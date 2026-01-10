# Offline-First Demo App (Monorepo)

A complete offline-first demo using **React**, **Node.js**, **MongoDB**, **Keycloak**, and **PowerSync**.

## features
- **Secure Auth**: Keycloak Integration (PKCE).
- **Offline-First**: PowerSync uses a local SQLite DB in the browser.
- **Bi-directional Sync**: Changes sync between Client <-> PowerSync <-> Backend <-> Mongo.
- **Dockerized**: Entire stack runs with one command.

## Prerequisites
- Docker & Docker Compose
- Node.js (optional, for local intellisense/scripts)

## Quick Start

1. **Build and Start**:
   ```bash
   # From root directory
   docker compose -f infra/docker-compose.yml up --build
   ```
   *Note: The first run might take a while to download images and build.*

2. **Access the App**:
   - **Web App**: [http://localhost:5173](http://localhost:5173)
   - **Keycloak**: [http://localhost:8080](http://localhost:8080) (Admin: admin/admin)
   - **API**: [http://localhost:3000](http://localhost:3000)

3. **Login**:
   - Click "Login" on the web app.
   - Use the pre-configured user:
     - **Username**: `demo@demo.com`
     - **Password**: `demo`

4. **Test Offline Mode**:
   - Add some tasks.
   - Stop the API/Backend: `docker compose -f infra/docker-compose.yml stop api` (or disable specific network if advanced).
   - Add/Edit tasks in the UI.
   - Start the API: `docker compose -f infra/docker-compose.yml start api`.
   - Observe the "Last Synced" time update and changes checking in.

## Troubleshooting

- **Keycloak Loading**: If the login page redirects to an error or loops, ensure `localhost:8080` is accessible.
- **PowerSync Connection**: Check the browser console. If 401, check token generation in API logs.
- **MongoDB**: Ensure the Replica Set is initiated. The init script tries to do this, but if it fails, run:
  ```bash
  docker compose -f infra/docker-compose.yml exec mongo mongosh --eval "rs.initiate()"
  ```
- **WASM Errors**: If you see errors about `wa-sqlite` or `wasm` missing, ensure the `vite-plugin-wasm` is working or manually copy the WASM files from node_modules to `public/`.

## Architecture

- **Repo**:
  - `apps/web`: React Vite App
  - `apps/api`: Express API
  - `infra`: Docker & Configs
- **Sync Flow**:
  1. Client writes to local SQLite.
  2. PowerSync SDK uploads batch to `/api/powersync/upload`.
  3. API writes to MongoDB.
  4. MongoDB Change Stream -> PowerSync Service -> Client.

Enjoy!
