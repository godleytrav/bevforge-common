#!/bin/bash

# Script to reorganize OPS files into ops/ folder
# Run this from the root of BevForge-Skin repository

echo "🚀 Starting OPS folder reorganization..."

# Create ops directory
mkdir -p ops

# Move OPS-specific directories
echo "📁 Moving source directories..."
git mv src ops/src
git mv public ops/public
git mv drizzle ops/drizzle

# Move OPS-specific config files
echo "📄 Moving configuration files..."
git mv components.json ops/components.json
git mv drizzle.config.ts ops/drizzle.config.ts
git mv eslint.config.js ops/eslint.config.js
git mv index.html ops/index.html
git mv package.json ops/package.json
git mv pnpm-lock.yaml ops/pnpm-lock.yaml
git mv postcss.config.js ops/postcss.config.js
git mv tailwind.config.js ops/tailwind.config.js
git mv tsconfig.json ops/tsconfig.json
git mv tsconfig.node.json ops/tsconfig.node.json
git mv vite.config.ts ops/vite.config.ts
git mv vitest.config.ts ops/vitest.config.ts

# Move OPS-specific documentation
echo "📚 Moving documentation..."
git mv CANVAS-KEG-TRACKING-DESIGN.md ops/CANVAS-KEG-TRACKING-DESIGN.md
git mv CANVAS-RESTORED.md ops/CANVAS-RESTORED.md
git mv CONTROL-DATASET-READY.md ops/CONTROL-DATASET-READY.md
git mv CONTROL-DATASET.md ops/CONTROL-DATASET.md
git mv DATA-MODEL-QUESTIONS.md ops/DATA-MODEL-QUESTIONS.md
git mv MIGRATION-GUIDE.md ops/MIGRATION-GUIDE.md
git mv MONOREPO-SETUP.md ops/MONOREPO-SETUP.md
git mv OPS-AUDIT-REPORT.md ops/OPS-AUDIT-REPORT.md
git mv OPS-COMPLETE-STATUS.md ops/OPS-COMPLETE-STATUS.md
git mv OPS-CORE.md ops/OPS-CORE.md
git mv OPS-ORDERS-AUDIT.md ops/OPS-ORDERS-AUDIT.md
git mv OPS-UI-CONTRACT.md ops/OPS-UI-CONTRACT.md
git mv SYSTEM-STATUS.md ops/SYSTEM-STATUS.md

# Move other OPS files
git mv bundle.js ops/bundle.js 2>/dev/null || true
git mv env.example ops/env.example 2>/dev/null || true

# Create root-level files
echo "📝 Creating root-level configuration..."

# Create root package.json for monorepo
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

# Create root README
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

# Create shared directory for future use
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

# Commit the changes
echo "💾 Committing changes..."
git add .
git commit -m "refactor: reorganize into monorepo structure with ops/ folder

- Moved all OPS files into ops/ directory
- Created root-level monorepo configuration
- OS and OPS now at same level
- Added shared/ directory for common code
- Updated documentation structure"

echo "✅ Reorganization complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Update Airo project to point to ops/ directory"
echo "3. Test that both OS and OPS work independently"
echo ""
echo "🎯 Structure:"
echo "  BevForge-Skin/"
echo "  ├── OS/          (Operating System module)"
echo "  ├── ops/         (Operations module)"
echo "  ├── shared/      (Shared code)"
echo "  └── package.json (Root monorepo config)"
