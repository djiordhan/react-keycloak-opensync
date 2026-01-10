import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getDb, TaskRecord, TASKS_TABLE } from './db';
import { doLogin, doLogout, isAuthenticated } from './auth';

function App() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [newTask, setNewTask] = useState('');
  const [online, setOnline] = useState(navigator.onLine);

  const db = getDb();
  const loggedIn = isAuthenticated();

  useEffect(() => {
    if (!loggedIn) return;

    // Watch tasks
    const abortController = new AbortController();
    
    (async () => {
      for await (const result of db.onChange('SELECT * FROM tasks ORDER BY createdAt DESC, id', [], { throttleMs: 50 })) {
        if (abortController.signal.aborted) break;
        setTasks(result.map(r => ({
           id: r.id, 
           title: r.title, 
           done: !!r.done, 
           tenantId: r.tenantId, 
           updatedAt: r.updatedAt 
        })) as any);
      }
    })();

    // Watch status
    return () => abortController.abort();
  }, [loggedIn]);

  useEffect(() => {
      if (!loggedIn) return;
      const timer = setInterval(() => {
          setStatus({
              connected: db.connected,
              lastSyncedAt: db.lastSyncedAt,
              version: db.currentVersion
          });
      }, 1000);
      return () => clearInterval(timer);
  }, [loggedIn]);

  useEffect(() => {
      window.addEventListener('online', () => setOnline(true));
      window.addEventListener('offline', () => setOnline(false));
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const id = uuidv4();
    // Default tenant for demo if not strictly enforced by client code (backend validates)
    // We assume the user has a claim 'tenantId' but we don't parse it here easily without helper.
    // For demo, we just rely on backend to override or we send a placeholder.
    // Actually, backend connector uses the token.
    // BUT we need to insert locally.
    // We need the tenantId to be correct for the sync rule filter "tenantId == :tenantId" to work?
    // Actually, if we insert a row with wrong tenantId, it won't sync back down?
    // Let's decode token or just use "tenant-demo" hardcoded as per prompt plan.
    const tenantId = "tenant-demo"; 

    await db.execute(
      `INSERT INTO ${TASKS_TABLE} (id, tenantId, title, done, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      [id, tenantId, newTask, 0, new Date().toISOString()]
    );
    setNewTask('');
  };

  const toggleTask = async (task: TaskRecord) => {
    await db.execute(
      `UPDATE ${TASKS_TABLE} SET done = ?, updatedAt = ? WHERE id = ?`,
      [task.done ? 0 : 1, new Date().toISOString(), task.id]
    );
  };

  const deleteTask = async (id: string) => {
    await db.execute(`DELETE FROM ${TASKS_TABLE} WHERE id = ?`, [id]);
  };

  if (!loggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Offline-First Demo</h1>
        <button onClick={() => doLogin()}>Login with Keycloak</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>My Tasks</h1>
        <button onClick={() => doLogout()}>Logout</button>
      </header>

      <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3>Status Panel</h3>
        <div><strong>Network:</strong> {online ? 'Online' : 'Offline'}</div>
        <div><strong>PowerSync Connected:</strong> {status?.connected ? 'Yes' : 'No'}</div>
        <div><strong>Last Synced:</strong> {status?.lastSyncedAt?.toLocaleTimeString() || 'Never'}</div>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          To test offline: Stop the API container or disconnect network. You can still add/edit tasks.
        </p>
      </div>

      <form onSubmit={addTask} style={{ marginBottom: 20 }}>
        <input 
          type="text" 
          value={newTask} 
          onChange={e => setNewTask(e.target.value)} 
          placeholder="New Task..." 
          style={{ padding: 8, width: 300, marginRight: 10 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Add</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map(task => (
          <li key={task.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: 10, 
            borderBottom: '1px solid #eee',
            background: task.done ? '#f9f9f9' : 'white'
          }}>
            <input 
              type="checkbox" 
              checked={!!task.done} 
              onChange={() => toggleTask(task)}
              style={{ marginRight: 10 }}
            />
            <span style={{ 
              flex: 1, 
              textDecoration: task.done ? 'line-through' : 'none',
              color: task.done ? '#999' : 'black'
            }}>
              {task.title}
            </span>
            <button 
              onClick={() => deleteTask(task.id)}
              style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
