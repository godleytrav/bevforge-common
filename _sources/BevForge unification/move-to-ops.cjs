#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting reorganization to ops/ folder...\n');

// Files and directories to move to ops/
const itemsToMove = [
  'src',
  'public',
  'drizzle',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.node.json',
  'components.json',
  'tailwind.config.js',
  'postcss.config.js',
  'eslint.config.js',
  'vitest.config.ts',
  'drizzle.config.ts',
  'index.html',
  'bundle.js',
  'env.example',
  'README.md',
  'MONOREPO-SETUP.md',
  'MIGRATION-GUIDE.md',
  'OS-API-CONTRACT.md',
  'DATA-MODEL-QUESTIONS.md'
];

// Items to keep at root
const keepAtRoot = [
  'OS',
  'os',
  'dev-tools',
  'source-mapper',
  'airo-secrets',
  'pnpm-workspace.yaml',
  '.git',
  '.gitignore',
  'node_modules',
  'reorganize-to-ops.sh',
  'REORGANIZE-INSTRUCTIONS.md',
  'move-to-ops.js'
];

try {
  // Create ops directory
  console.log('📁 Creating ops/ directory...');
  if (!fs.existsSync('ops')) {
    fs.mkdirSync('ops', { recursive: true });
  }

  // Move each item
  for (const item of itemsToMove) {
    if (fs.existsSync(item)) {
      console.log(`   Moving ${item} to ops/...`);
      try {
        execSync(`git mv ${item} ops/${item}`, { stdio: 'pipe' });
      } catch (error) {
        // If git mv fails, try regular move
        console.log(`   (using fs move for ${item})`);
        const dest = path.join('ops', item);
        fs.renameSync(item, dest);
      }
    }
  }

  // Create root package.json
  console.log('\n📦 Creating root package.json...');
  const rootPackage = {
    name: 'bevforge-monorepo',
    version: '1.0.0',
    private: true,
    workspaces: ['OS', 'ops', 'shared'],
    scripts: {
      'dev:os': 'cd OS && npm run dev',
      'dev:ops': 'cd ops && pnpm run dev',
      'build:os': 'cd OS && npm run build',
      'build:ops': 'cd ops && pnpm run build'
    }
  };
  fs.writeFileSync('package.json', JSON.stringify(rootPackage, null, 2));

  // Create root README
  console.log('📝 Creating root README.md...');
  const rootReadme = `# BevForge Monorepo

Unified platform for brewery management.

## Modules

- **OS** - Operating System (Inventory & Production)
- **OPS** - Operations (Orders & Logistics)
- **Lab** - Laboratory (Quality Control) - Coming Soon
- **Connect** - Integrations - Coming Soon
- **Flow** - Workflow Automation - Coming Soon

## Development

\`\`\`bash
# Run OS module
npm run dev:os

# Run OPS module
npm run dev:ops
\`\`\`

## Structure

\`\`\`
BevForge-Monorepo/
├── OS/          # Operating System module
├── ops/         # Operations module
├── shared/      # Shared code
└── package.json # Root configuration
\`\`\`
`;
  fs.writeFileSync('README.md', rootReadme);

  // Create shared directory
  console.log('📂 Creating shared/ directory...');
  if (!fs.existsSync('shared')) {
    fs.mkdirSync('shared', { recursive: true });
    fs.mkdirSync('shared/types', { recursive: true });
  }

  console.log('\n✅ Reorganization complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "refactor: reorganize into monorepo structure"');
  console.log('   3. git push origin main');

} catch (error) {
  console.error('❌ Error during reorganization:', error.message);
  process.exit(1);
}
