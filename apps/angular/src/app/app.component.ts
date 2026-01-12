import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fromEvent, Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';
import { DbService, TaskRecord, PowerSyncStatus } from './services/db.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AuthService, DbService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  tasks: TaskRecord[] = [];
  status: PowerSyncStatus | null = null;
  newTask = '';
  online = navigator.onLine;
  loggedIn = false;

  private subscriptions = new Subscription();

  constructor(private auth: AuthService, private db: DbService) {}

  async ngOnInit(): Promise<void> {
    this.subscriptions.add(fromEvent(window, 'online').subscribe(() => (this.online = true)));
    this.subscriptions.add(fromEvent(window, 'offline').subscribe(() => (this.online = false)));

    await this.auth.init();
    this.loggedIn = this.auth.isAuthenticated();

    this.subscriptions.add(
      this.auth.authenticated$.subscribe(async (authenticated) => {
        this.loggedIn = authenticated;
        if (authenticated) {
          await this.db.connect();
        } else {
          this.db.stop();
        }
      })
    );

    this.subscriptions.add(this.db.tasks$.subscribe((tasks) => (this.tasks = tasks)));
    this.subscriptions.add(this.db.status$.subscribe((status) => (this.status = status)));

    if (this.loggedIn) {
      await this.db.connect();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.db.stop();
  }

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }

  async addTask(): Promise<void> {
    const trimmed = this.newTask.trim();
    if (!trimmed) return;
    await this.db.addTask(trimmed);
    this.newTask = '';
  }

  async toggleTask(task: TaskRecord): Promise<void> {
    await this.db.toggleTask(task);
  }

  async deleteTask(id: string): Promise<void> {
    await this.db.deleteTask(id);
  }
}
