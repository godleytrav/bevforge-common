# 🚀 Instructions to Reorganize OPS into ops/ Folder

## Current Situation

The OS module has been created in the `OS/` folder, but OPS files are still in the root directory. We need to move OPS files into an `ops/` folder to match the structure.

## Target Structure

```
BevForge-Skin/
├── OS/                    # Operating System module ✅ (already done)
├── ops/                   # Operations module ⏳ (needs to be created)
├── shared/                # Shared code (will be created)
├── package.json           # Root monorepo config
└── README.md              # Main project README
```

---

## Option 1: Automated Script (Recommended)

I've created a bash script that will do everything automatically.

### Steps:

1. **Pull the latest changes** (includes the script):
   ```bash
   git pull origin main
   ```

2. **Make the script executable**:
   ```bash
   chmod +x reorganize-to-ops.sh
   ```

3. **Run the script**:
   ```bash
   ./reorganize-to-ops.sh
   ```

4. **Push the changes**:
   ```bash
   git push origin main
   ```

That's it! The script will:
- ✅ Create `ops/` directory
- ✅ Move all OPS files into `ops/`
- ✅ Create root-level monorepo config
- ✅ Create shared directory
- ✅ Commit all changes

---

## Option 2: Manual Steps

If you prefer to do it manually:

### Step 1: Create ops directory
```bash
mkdir ops
```

### Step 2: Move OPS directories
```bash
git mv src ops/src
git mv public ops/public
git mv drizzle ops/drizzle
```

### Step 3: Move OPS config files
```bash
git mv components.json ops/
git mv drizzle.config.ts ops/
git mv eslint.config.js ops/
git mv index.html ops/
git mv package.json ops/
git mv pnpm-lock.yaml ops/
git mv postcss.config.js ops/
git mv tailwind.config.js ops/
git mv tsconfig.json ops/
git mv tsconfig.node.json ops/
git mv vite.config.ts ops/
git mv vitest.config.ts ops/
```

### Step 4: Move OPS documentation
```bash
git mv CANVAS-KEG-TRACKING-DESIGN.md ops/
git mv CANVAS-RESTORED.md ops/
git mv CONTROL-DATASET-READY.md ops/
git mv CONTROL-DATASET.md ops/
git mv DATA-MODEL-QUESTIONS.md ops/
git mv MIGRATION-GUIDE.md ops/
git mv MONOREPO-SETUP.md ops/
git mv OPS-AUDIT-REPORT.md ops/
git mv OPS-COMPLETE-STATUS.md ops/
git mv OPS-CORE.md ops/
git mv OPS-ORDERS-AUDIT.md ops/
git mv OPS-UI-CONTRACT.md ops/
git mv SYSTEM-STATUS.md ops/
```

### Step 5: Move other OPS files
```bash
git mv bundle.js ops/ 2>/dev/null || true
git mv env.example ops/ 2>/dev/null || true
```

### Step 6: Create root package.json
```bash
cat > package.json << 'EOF'
{
  "name": "bevforge-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "BevForge Modular Suite - OS, OPS, Lab, Connect, Flow",
  "scripts": {
    "dev:os": "cd OS && npm run dev",
    "dev:ops": "cd ops && pnpm dev",
    "build:os": "cd OS && npm run build",
    "build:ops": "cd ops && pnpm build",
    "install:all": "cd OS && npm install && cd ../ops && pnpm install"
  },
  "workspaces": [
    "OS",
    "ops",
    "shared"
  ]
}
EOF
```

### Step 7: Create root README
```bash
cat > README.md << 'EOF'
# BevForge Modular Suite

A comprehensive brewery management platform with modular architecture.

## Modules

- **OS** - Operating System (Production Control & Inventory)
- **OPS** - Operations (Business Management & Sales)
- **Lab** - Laboratory Management (Coming Soon)
- **Connect** - Integration Hub (Coming Soon)
- **Flow** - Workflow Automation (Coming Soon)

## Getting Started

### OS Module
```bash
cd OS
npm install
npm run dev
```

### OPS Module
```bash
cd ops
pnpm install
pnpm dev
```

## Architecture

Each module is independently deployable but shares:
- Unified navigation (AppShell)
- Consistent styling (CSS variables)
- Common UI components (shadcn)
- Integration via REST APIs

See individual module READMEs for details.
EOF
```

### Step 8: Create shared directory
```bash
mkdir -p shared/types
cat > shared/types/index.ts << 'EOF'
// Shared TypeScript types across all modules
export interface User {
  id: string;
  name: string;
  email: string;
}

// Add more shared types here
EOF
```

### Step 9: Commit and push
```bash
git add .
git commit -m "refactor: reorganize into monorepo structure with ops/ folder"
git push origin main
```

---

## After Reorganization

### Update Airo OPS Project

The current Airo project is pointing to the root directory. After reorganization, you'll need to either:

**Option A: Update this project's working directory**
- Configure Airo to work in the `ops/` subdirectory

**Option B: Create a new Airo project**
- Create new project for OPS
- Connect to same GitHub repo
- Set working directory to `ops/`

### Verify Structure

After reorganization, your structure should look like:

```
BevForge-Skin/
├── OS/                          # OS Module
│   ├── src/
│   ├── package.json
│   └── ...
├── ops/                         # OPS Module
│   ├── src/
│   ├── package.json
│   └── ...
├── shared/                      # Shared Code
│   └── types/
├── dev-tools/                   # Development tools
├── source-mapper/               # Source mapping
├── airo-secrets/                # Secrets management
├── package.json                 # Root monorepo config
├── pnpm-workspace.yaml          # Workspace config
└── README.md                    # Main README
```

### Test Both Modules

**Test OS:**
```bash
cd OS
npm install
npm run dev
```

**Test OPS:**
```bash
cd ops
pnpm install
pnpm dev
```

Both should work independently!

---

## Troubleshooting

### If git mv fails
Use regular mv and then git add:
```bash
mv src ops/src
git add ops/src
git rm -r src
```

### If files are missing
Check git status to see what wasn't moved:
```bash
git status
```

### If you need to undo
Before committing, you can reset:
```bash
git reset --hard HEAD
```

---

## Summary

**Automated (Recommended):**
```bash
git pull origin main
chmod +x reorganize-to-ops.sh
./reorganize-to-ops.sh
git push origin main
```

**Manual:**
Follow the manual steps above.

**Result:**
- ✅ Clean monorepo structure
- ✅ OS and OPS at same level
- ✅ Ready for Lab, Connect, Flow modules
- ✅ Professional organization

---

**Questions?** Check the script output or git status for details.
