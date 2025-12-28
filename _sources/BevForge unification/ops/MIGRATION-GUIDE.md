# 🚀 BevForge Monorepo Migration Guide

## Current Situation

Your current project has all OPS files in the root directory. We need to reorganize into a clean monorepo structure where each suite (OS, OPS, Lab, Connect, etc.) has its own folder.

---

## 🎯 Target Structure

```
BevForge-Skin/                    # Git repository root
├── os/                           # OS Module (Operating System)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── README.md
│
├── ops/                          # OPS Module (Operations)
│   ├── src/
│   ├── public/
│   ├── drizzle/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── README.md
│
├── lab/                          # Lab Module (Quality Control) - Future
│   └── README.md
│
├── connect/                      # Connect Module (Integrations) - Future
│   └── README.md
│
├── flow/                         # Flow Module (Workflow) - Future
│   └── README.md
│
├── shared/                       # Shared code between modules
│   ├── types/
│   │   ├── os.ts                # OS API types
│   │   ├── ops.ts               # OPS types
│   │   └── common.ts            # Common types
│   └── utils/
│       └── api-client.ts        # Shared API utilities
│
├── docs/                         # Architecture documentation
│   ├── OS-API-CONTRACT.md
│   ├── MONOREPO-SETUP.md
│   ├── ARCHITECTURE.md
│   └── INTEGRATION-GUIDE.md
│
├── pnpm-workspace.yaml           # Monorepo configuration
├── package.json                  # Root package.json
├── .gitignore
└── README.md                     # Main project README
```

---

## 📋 Migration Steps

### Step 1: Create Folder Structure (Manual - On Your Machine)

Since I can't directly modify your GitHub repo, you'll need to do this locally:

```bash
# Navigate to your local BevForge-Skin directory
cd /path/to/BevForge-Skin

# Create new directory structure
mkdir -p ops
mkdir -p os
mkdir -p lab
mkdir -p connect
mkdir -p flow
mkdir -p shared/types
mkdir -p shared/utils
mkdir -p docs
```

### Step 2: Move OPS Files into ops/ Directory

```bash
# Move all current files into ops/
mv src ops/
mv public ops/
mv drizzle ops/
mv package.json ops/
mv pnpm-lock.yaml ops/
mv vite.config.ts ops/
mv vitest.config.ts ops/
mv tsconfig.json ops/
mv tsconfig.node.json ops/
mv tailwind.config.js ops/
mv postcss.config.js ops/
mv eslint.config.js ops/
mv components.json ops/
mv drizzle.config.ts ops/
mv index.html ops/
mv bundle.js ops/
mv env.example ops/
```

### Step 3: Move Documentation to docs/

```bash
# Move architecture docs
mv OS-API-CONTRACT.md docs/
mv MONOREPO-SETUP.md docs/
mv OPS-UI-CONTRACT.md docs/
mv DATA-MODEL-QUESTIONS.md docs/
mv CANVAS-KEG-TRACKING-DESIGN.md docs/
mv CANVAS-RESTORED.md docs/
mv CONTROL-DATASET-READY.md docs/
mv CONTROL-DATASET.md docs/
mv OPS-AUDIT-REPORT.md docs/
mv OPS-COMPLETE-STATUS.md docs/
mv OPS-ORDERS-AUDIT.md docs/
mv SYSTEM-STATUS.md docs/
```

### Step 4: Keep Root Files

These files should stay in the root:
- `README.md` (main project README)
- `pnpm-workspace.yaml` (monorepo config)
- `.gitignore`
- `package.json` (root package.json - we'll create this)

### Step 5: Create Root package.json

Create a new `package.json` in the root:

```json
{
  "name": "bevforge-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "BevForge - Modular Brewery Management System",
  "scripts": {
    "dev:ops": "pnpm --filter ops dev",
    "dev:os": "pnpm --filter os dev",
    "build:ops": "pnpm --filter ops build",
    "build:os": "pnpm --filter os build",
    "build:all": "pnpm -r build",
    "test:all": "pnpm -r test",
    "lint:all": "pnpm -r lint"
  },
  "workspaces": [
    "os",
    "ops",
    "lab",
    "connect",
    "flow",
    "shared"
  ]
}
```

### Step 6: Update pnpm-workspace.yaml

Already created - should look like:

```yaml
packages:
  - 'os'
  - 'ops'
  - 'lab'
  - 'connect'
  - 'flow'
  - 'shared'
```

### Step 7: Create README files for each module

**ops/README.md:**
```markdown
# BevForge OPS (Operations)

Business layer for BevForge - handles customers, orders, invoicing, and sales.

## Features
- Customer management
- Order processing
- Invoice generation
- Canvas Logistics (packing & shipping)
- Sales reporting

## Development
\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Integration
OPS reads inventory data from OS module via API.
```

**os/README.md:**
```markdown
# BevForge OS (Operating System)

Source of truth for inventory, batches, and production tracking.

## Features
- Inventory ledger
- Batch production tracking
- Material management
- Location tracking
- Movement history

## API
See `/docs/OS-API-CONTRACT.md` for complete API specification.

## Development
\`\`\`bash
pnpm install
pnpm dev
\`\`\`
```

### Step 8: Update Import Paths in OPS

After moving files, you may need to update some import paths. Most should work as-is since they use relative paths, but check:

- Any imports that reference root-level files
- API client imports
- Shared utility imports

### Step 9: Commit and Push

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "refactor: reorganize into monorepo structure

- Move OPS files into ops/ directory
- Create folder structure for OS, Lab, Connect, Flow
- Move documentation to docs/ directory
- Add root package.json for monorepo management
- Update pnpm-workspace.yaml
- Add README files for each module"

# Push to GitHub
git push origin main
```

---

## 🔧 Alternative: Automated Script

If you prefer, here's a bash script to automate the migration:

```bash
#!/bin/bash

# Create directory structure
mkdir -p ops os lab connect flow shared/types shared/utils docs

# Move OPS files
mv src ops/
mv public ops/
mv drizzle ops/
mv package.json ops/
mv pnpm-lock.yaml ops/
mv vite.config.ts ops/
mv vitest.config.ts ops/
mv tsconfig.json ops/
mv tsconfig.node.json ops/
mv tailwind.config.js ops/
mv postcss.config.js ops/
mv eslint.config.js ops/
mv components.json ops/
mv drizzle.config.ts ops/
mv index.html ops/
mv bundle.js ops/
mv env.example ops/

# Move documentation
mv OS-API-CONTRACT.md docs/
mv MONOREPO-SETUP.md docs/
mv OPS-UI-CONTRACT.md docs/
mv DATA-MODEL-QUESTIONS.md docs/
mv CANVAS-KEG-TRACKING-DESIGN.md docs/
mv CANVAS-RESTORED.md docs/
mv CONTROL-DATASET-READY.md docs/
mv CONTROL-DATASET.md docs/
mv OPS-AUDIT-REPORT.md docs/
mv OPS-COMPLETE-STATUS.md docs/
mv OPS-ORDERS-AUDIT.md docs/
mv SYSTEM-STATUS.md docs/

echo "Migration complete! Review changes and commit."
```

Save this as `migrate.sh`, make it executable (`chmod +x migrate.sh`), and run it (`./migrate.sh`).

---

## ⚠️ Important Notes

### Before Migration:
1. **Backup your work** - Make sure everything is committed
2. **Close Airo projects** - Stop any running dev servers
3. **Test locally first** - Don't push until you verify it works

### After Migration:
1. **Reinstall dependencies** - Run `pnpm install` in root
2. **Test OPS** - Run `pnpm dev:ops` to verify it works
3. **Update Airo projects** - Reconnect to the new structure

### For Airo Projects:
- **OPS Project**: Point to `ops/` directory
- **OS Project**: Point to `os/` directory
- Each project works independently in its own folder

---

## 🎯 Benefits of This Structure

### 1. Clean Separation
- Each module has its own directory
- No file conflicts between modules
- Easy to navigate and understand

### 2. Independent Development
- Work on OS in one Airo project
- Work on OPS in another Airo project
- No interference between projects

### 3. Scalability
- Easy to add new modules (Lab, Connect, Flow)
- Shared code in `shared/` directory
- Documentation centralized in `docs/`

### 4. Monorepo Benefits
- Single git repository
- Shared dependencies
- Cross-module refactoring
- Unified versioning

---

## 🚀 Next Steps After Migration

### 1. Upload OS Files
```bash
# Copy your OS project files into os/ directory
cp -r /path/to/your/os/project/* os/

# Commit
git add os/
git commit -m "feat: add OS module"
git push
```

### 2. Create Airo Projects
- **Project 1 (OPS)**: Connect to `BevForge-Skin` repo, work in `ops/` directory
- **Project 2 (OS)**: Connect to `BevForge-Skin` repo, work in `os/` directory
- **Project 3 (Lab)**: Connect to `BevForge-Skin` repo, work in `lab/` directory (future)

### 3. Development Workflow
```bash
# Work on OPS
cd ops/
pnpm dev

# Work on OS (in separate terminal)
cd os/
pnpm dev

# Both run independently on different ports
```

### 4. Integration
Once both OS and OPS are ready:
- OS provides API at `http://localhost:3001/api/os`
- OPS consumes API from OS
- Test end-to-end workflow

---

## 📞 Questions?

If you run into issues during migration:
1. Check that all files moved correctly
2. Verify `pnpm-workspace.yaml` is in root
3. Run `pnpm install` in root to link workspaces
4. Test each module independently

---

## ✅ Verification Checklist

After migration, verify:
- [ ] All OPS files in `ops/` directory
- [ ] All docs in `docs/` directory
- [ ] Root `package.json` created
- [ ] `pnpm-workspace.yaml` in root
- [ ] Each module has `README.md`
- [ ] `pnpm install` runs successfully
- [ ] `pnpm dev:ops` starts OPS server
- [ ] Git commit and push successful
- [ ] Airo projects can connect to new structure

---

**Ready to migrate? Follow the steps above and you'll have a clean, professional monorepo structure!** 🎉
