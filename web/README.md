# cagent Web UI

## Dev quickstart

- Ensure the backend is running:
  - Copy `.env.example` to `.env` in repo root and set:
    - `CAGENT_MODELS_GATEWAY=https://gw.docker.com/models`
  - Build the binary and start server pointing to the examples config directory:
    - `task build && ./bin/cagent web ./examples/config`
- Start the web dev server:
  - `cd web && npm install && npm run dev`
  - Open http://localhost:5173

Vite is configured to proxy API calls from `/api` to `http://localhost:8080`.

## Production build

- `npm run build` generates `web/dist` which is embedded into the Go binary at build time.
