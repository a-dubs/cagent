# 🎯 Unified Development Workflow

## Overview
All documentation and tooling has been unified around a single development command to eliminate confusion and connection issues.

## ✅ **The One True Development Command**

```bash
task web:dev
```

This single command handles everything:
- 🏗️ Sets up environment (creates web/dist placeholder)  
- 📦 Installs npm dependencies automatically
- 🚀 Starts Go backend server on :8080
- ⚡ Starts Vite frontend dev server on :5173
- 🔗 Configures Vite to proxy `/api` calls to backend
- 🔄 Hot reload for both frontend and backend changes

## 🚫 **What NOT to Do**

**Never start these separately:**
- ❌ `go run . web` 
- ❌ `cd web && npm run dev`
- ❌ `./bin/cagent web ./examples/config`
- ❌ Any combination of manual backend + frontend startup

**Why?** This causes connection refused errors because:
1. Frontend starts before backend is ready
2. Different environment setups
3. Race conditions in service startup
4. Proxy configuration issues

## 📖 **Updated Documentation**

### Main README.md
- **Option 1: Web UI (Recommended)** - Uses `task web:dev`
- **Option 2: Command Line** - Traditional CLI mode
- Clear separation between development and production

### Web README.md  
- ⚠️ **Warning section** about using unified command
- **Never start separately** - prominent warning
- Detailed explanation of what `task web:dev` does

### User Guide
- Updated all web interface examples
- Separated development vs production commands
- Fixed debug mode examples

## 🔧 **Behind the Scenes: Taskfile.yml**

The `web:dev` task is configured as:
```yaml
web:dev:
  desc: Run frontend and backend dev servers together (Vite on :5173, API on :8080)
  deps:
    - web:dev:backend    # Starts Go server with examples config
    - web:dev:frontend   # Starts Vite dev server with proxy
```

**Dependencies:**
- `web:dev:backend` depends on `web:dev:prepare` (creates dist folder)
- `web:dev:frontend` depends on `web:install` (npm install)

**Environment Integration:**
- Uses `AGENTS_PATH: ./examples/config` from Taskfile
- Respects `CAGENT_REPO_PATH` from `.env` when backend starts
- Auto-loads all example agent configurations

## 🎉 **Benefits of Unified Workflow**

### For Developers
1. **No Confusion** - One command to rule them all
2. **Reliable Startup** - No race conditions or connection issues  
3. **Consistent Environment** - Same setup every time
4. **Hot Reload** - Both frontend and backend restart on changes
5. **Proper Proxy** - API calls work seamlessly

### For New Contributors
1. **Simple Onboarding** - Just run `task web:dev`
2. **No Documentation Confusion** - Single source of truth
3. **Quick Debugging** - Everything starts together or fails together
4. **Professional Experience** - Matches modern development standards

### For Maintenance
1. **Single Point of Configuration** - All in Taskfile.yml
2. **Easier Updates** - Change one place, affects all docs
3. **Reduced Support Issues** - No more "backend won't connect" problems
4. **Better Testing** - Consistent development environment

## 🚀 **Usage Examples**

### Development (New Features/Bug Fixes)
```bash
git clone https://github.com/docker/cagent.git
cd cagent
cp .env.example .env
task web:dev
# Open http://localhost:5173
```

### Testing Agent Configurations  
```bash
# Already running task web:dev
# Upload your .yaml configs via the web UI
# Create agent setups referencing those configs
# Test with persistent chat history
```

### Production Deployment
```bash
task build
./bin/cagent web ./path/to/agent/configs
```

The unified workflow eliminates the "fucking mess" of conflicting tooling and provides a professional, reliable development experience! 🎯
