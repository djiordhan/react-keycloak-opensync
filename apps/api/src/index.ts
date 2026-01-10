import express from 'express';
import cors from 'cors';
import { connectMongo, Task } from './mongo';
import { requireAuth } from './auth';
import { generatePowerSyncToken, getJwks } from './powersync';

const app = express();
app.use(cors());
app.use(express.json());

// Public JWKS for PowerSync to validate tokens
app.get('/.well-known/jwks.json', (req, res) => {
  res.json(getJwks());
});

app.get('/health', (req, res) => res.send('OK'));

// Protected Routes
app.get('/api/me', requireAuth, (req: any, res) => {
  res.json({
    sub: req.user.sub,
    email: req.user.email,
    tenantId: req.user.tenantId
  });
});

app.get('/api/powersync/credentials', requireAuth, (req: any, res) => {
  try {
    const token = generatePowerSyncToken(req.user);
    res.json({
      endpoint: process.env.POWERSYNC_URL,
      token
    });
  } catch (e: any) {
    console.error("Credentials error", e);
    res.status(500).send("Error generating credentials");
  }
});

app.post('/api/powersync/upload', requireAuth, async (req: any, res) => {
  const { batch } = req.body;
  if (!batch || !Array.isArray(batch)) return res.status(400).send("Invalid batch");

  // Basic implementation of handling CRUD ops
  // Ops: { op: 'PUT' | 'PATCH' | 'DELETE', table: 'tasks', data: { id: ... } }
  
  // Important: Validate tenant ownership!
  const userTenantId = req.user.tenantId;

  try {
    for (const item of batch) {
      const { op, table, data } = item;
      if (table !== 'tasks') continue;

      if (op === 'PUT' || op === 'PATCH') {
        const doc = { ...data, tenantId: userTenantId };
        // Upsert based on ID
        await Task.findOneAndUpdate(
          { _id: data.id }, // Find by ID
          { $set: doc },
          { upsert: true, new: true }
        );
      } else if (op === 'DELETE') {
        // Only delete if it belongs to tenant
        await Task.deleteOne({ _id: data.id, tenantId: userTenantId });
      }
    }
    res.json({ success: true });
  } catch (e: any) {
    console.error("Upload error", e);
    res.status(500).send("Upload failed");
  }
});

const PORT = 3000;
connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
});
