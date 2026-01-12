import {
  AbstractPowerSyncDatabase,
  Column,
  ColumnType,
  PowerSyncDatabase,
  Schema,
  Table
} from '@powersync/web';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export type TaskRecord = {
  id: string;
  tenantId: string;
  title: string;
  done: boolean;
  updatedAt: string;
};

export type PowerSyncStatus = {
  connected: boolean;
  lastSyncedAt: Date | null;
};

const TASKS_TABLE = 'tasks';

const tasksTable = new Table({
  name: TASKS_TABLE,
  columns: [
    new Column({ name: 'id', type: ColumnType.TEXT }),
    new Column({ name: 'tenantId', type: ColumnType.TEXT }),
    new Column({ name: 'title', type: ColumnType.TEXT }),
    new Column({ name: 'done', type: ColumnType.INTEGER }),
    new Column({ name: 'updatedAt', type: ColumnType.TEXT })
  ]
});

const appSchema = new Schema([tasksTable]);

class Connector {
  constructor(private auth: AuthService) {}

  async fetchCredentials() {
    await this.auth.updateToken();
    const token = this.auth.getToken();
    const headers = {
      Authorization: `Bearer ${token}`
    };
    const res = await fetch(`${environment.apiUrl}/api/powersync/credentials`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to get credentials: ${res.statusText}`);
    }
    const text = await res.text();
    if (!text) {
      throw new Error('Empty response from credentials endpoint');
    }

    let data: { endpoint: string; token: string };
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse credentials JSON: ${text.substring(0, 100)}...`);
    }

    return {
      endpoint: data.endpoint,
      token: data.token
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const batch = await database.getCrudBatch();
    if (!batch) return;

    await this.auth.updateToken();
    const token = this.auth.getToken();

    const payload = batch.crud.map((item: any) => ({
      op: item.op,
      table: item.table,
      data: item.data ?? item.values ?? item
    }));

    const res = await fetch(`${environment.apiUrl}/api/powersync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ batch: payload })
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }

    await batch.complete();
  }
}

@Injectable()
export class DbService {
  private db = new PowerSyncDatabase({
    schema: appSchema,
    database: {
      dbFilename: 'tasks_db_demo.db'
    }
  });

  private tasksSubject = new BehaviorSubject<TaskRecord[]>([]);
  private statusSubject = new BehaviorSubject<PowerSyncStatus | null>(null);

  tasks$ = this.tasksSubject.asObservable();
  status$ = this.statusSubject.asObservable();

  private abortController: AbortController | null = null;
  private statusInterval: ReturnType<typeof setInterval> | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(private auth: AuthService) {}

  async connect(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = (async () => {
      const connector = new Connector(this.auth);
      await this.db.connect(connector);
      this.startWatchers();
    })();

    return this.connectPromise;
  }

  stop(): void {
    this.abortController?.abort();
    this.abortController = null;
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    this.statusInterval = null;
    this.connectPromise = null;
  }

  private startWatchers(): void {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    (async () => {
      for await (const result of this.db.watch(
        'SELECT * FROM tasks ORDER BY createdAt DESC, id',
        [],
        { throttleMs: 50 }
      )) {
        if (signal.aborted) break;
        const rows = (result.rows?._array ?? []) as Array<Record<string, any>>;
        this.tasksSubject.next(
          rows.map((record) => ({
            id: String(record['id']),
            title: record['title'],
            done: !!record['done'],
            tenantId: record['tenantId'],
            updatedAt: record['updatedAt']
          }))
        );
      }
    })();

    this.statusInterval = setInterval(() => {
      const syncStatus = this.db.currentStatus;
      this.statusSubject.next({
        connected: syncStatus.connected,
        lastSyncedAt: syncStatus.lastSyncedAt ?? null
      });
    }, 1000);
  }

  async addTask(title: string): Promise<void> {
    const id = uuidv4();
    const tenantId = 'tenant-demo';

    await this.db.execute(
      `INSERT INTO ${TASKS_TABLE} (id, tenantId, title, done, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      [id, tenantId, title, 0, new Date().toISOString()]
    );
  }

  async toggleTask(task: TaskRecord): Promise<void> {
    await this.db.execute(
      `UPDATE ${TASKS_TABLE} SET done = ?, updatedAt = ? WHERE id = ?`,
      [task.done ? 0 : 1, new Date().toISOString(), task.id]
    );
  }

  async deleteTask(id: string): Promise<void> {
    await this.db.execute(`DELETE FROM ${TASKS_TABLE} WHERE id = ?`, [id]);
  }
}
