import {
  AbstractPowerSyncDatabase,
  ColumnType,
  PowerSyncDatabase,
  Schema,
  Table,
  UpdateType
} from '@powersync/web';
// Note: WASM is handled by vite plugin logic or @powersync/web default requires some setup. 
// We'll trust the package.

import { getToken, updateToken } from './auth';

export const TASKS_TABLE = 'tasks';

const tasks = new Table({
  id: ColumnType.TEXT,
  tenantId: ColumnType.TEXT,
  title: ColumnType.TEXT,
  done: ColumnType.INTEGER, // sqlite boolean is integer
  updatedAt: ColumnType.TEXT
});

export const AppSchema = new Schema({
  tasks
});

export type TaskRecord = {
  id: string;
  tenantId: string;
  title: string;
  done: number;
  updatedAt: string;
}

export class Connector {
  constructor() {}

  async fetchCredentials() {
    await updateToken();
    const token = getToken();
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/powersync/credentials`, { headers });
    if (!res.ok) throw new Error(`Failed to get credentials: ${res.statusText}`);
    const data = await res.json();
    return {
      endpoint: data.endpoint,
      token: data.token
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const batch = await database.getCrudBatch();
    if (!batch) return;

    await updateToken();
    const token = getToken();
    
    // Transform batch to what our API expects if needed, or send as is
    // Our API expects: { batch: [{ op, table, data }] }
    // PowerSync batch.crud has items with id, op, data
    
    // NOTE: batch.crud is list of { table, id, op, data }? 
    // Need to map specific to batch format.
    
    const payload = batch.crud.map(item => ({
      op: item.op, // PUT, PATCH, DELETE
      table: item.table,
      data: item.data // might correspond to 'id' logic
    }));

    // data includes 'id' usually.

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/powersync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ batch: payload })
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      
      await batch.complete();
    } catch (e) {
      console.error(e);
      // Wait or retry logic (handled by PowerSync retry typically if we throw)
      throw e;
    }
  }
}

let dbInstance: PowerSyncDatabase | null = null;

export const getDb = (): PowerSyncDatabase => {
  if (!dbInstance) {
    dbInstance = new PowerSyncDatabase({
      schema: AppSchema,
      database: {
        name: 'tasks_db_demo'
      }
    });
  }
  return dbInstance;
}

export const connectPowerSync = async () => {
  const db = getDb();
  const connector = new Connector();
  await db.connect(connector);
};
