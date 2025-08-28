# cagent Web UI

## Development

**⚠️ Always use the unified development command:**

```bash
# From the project root directory
task web:dev
```

This single command:
- Sets up environment (creates web/dist placeholder)
- Installs npm dependencies automatically
- Starts the Go backend server on :8080
- Starts the Vite frontend dev server on :5173
- Configures Vite to proxy `/api` calls to the backend

Then open http://localhost:5173 in your browser.

**Never start frontend and backend separately** - this causes confusion and connection issues.

## Production build

- `npm run build` generates `web/dist` which is embedded into the Go binary at build time.
