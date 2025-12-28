# BevForge Monorepo Setup Guide

## 🎯 Architecture Overview

BevForge is a modular brewery management system with clear separation of concerns:

```
┌─────────────────────────────────────┐
│  OS (Operating System)              │
│  Source of Truth                    │
│  ├── Inventory (physical quantities)│
│  ├── Batches (production runs)      │
│  ├── Materials (ingredients)        │
│  ├── Locations (warehouse bins)     │
│  └── Movements (audit trail)        │
└─────────────────────────────────────┘
              ▲
              │ REST API
              │
┌─────────────────────────────────────┐
│  OPS (Operations)                   │
│  Business Layer                     │
│  ├── Customers                      │
│  ├── Orders                         │
│  ├── Invoices                       │
│  ├── Vendors                        │
│  └── Pricing                        │
└─────────────────────────────────────┘
```

---

## 📁 Current Project Structure

**Current State:**
- This repository contains the **OPS module**
- All files in root directory are OPS-related

**Target State:**
```
bevforge-monorepo/
├── os/                    # OS Module (to be added)
├── ops/                   # OPS Module (current project - needs to be moved)
├── shared/                # Shared types/utilities
├── docs/                  # Architecture documentation
├── pnpm-workspace.yaml    # Monorepo config
└── README.md              # Main README
```

---

## 🚀 Setup Instructions

### **Option A: Manual Restructure (Recommended)**

**Step 1: Create `ops/` directory**
```bash
mkdir ops
```

**Step 2: Move all OPS files into `ops/`**
```bash
# Move source code
mv src ops/
mv public ops/

# Move config files
mv vite.config.ts ops/
mv tsconfig.json ops/
mv tsconfig.node.json ops/
mv tailwind.config.js ops/
mv postcss.config.js ops/
mv components.json ops/
mv vitest.config.ts ops/
mv eslint.config.js ops/

# Move package files
mv package.json ops/
mv pnpm-lock.yaml ops/

# Move documentation (OPS-specific)
mv OPS-*.md ops/
mv CANVAS-*.md ops/
mv CONTROL-*.md ops/
```

**Step 3: Create `os/` directory (empty for now)**
```bash
mkdir os
echo "# BevForge OS Module" > os/README.md
```

**Step 4: Create `shared/` directory**
```bash
mkdir -p shared/types
echo "# Shared Types and Utilities" > shared/README.md
```

**Step 5: Create `docs/` directory**
```bash
mkdir docs
mv OS-API-CONTRACT.md docs/
mv DATA-MODEL-QUESTIONS.md docs/
mv SYSTEM-STATUS.md docs/
```

**Step 6: Update root `package.json`**
Create a new root `package.json` for monorepo management:
```json
{
  "name": "bevforge-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:os": "pnpm --filter os dev",
    "dev:ops": "pnpm --filter ops dev",
    "build:os": "pnpm --filter os build",
    "build:ops": "pnpm --filter ops build",
    "build:all": "pnpm -r build",
    "test:all": "pnpm -r test"
  },
  "devDependencies": {
    "typescript": "^5.7.2"
  }
}
```

**Step 7: Update `ops/package.json`**
Change the name to scope it:
```json
{
  "name": "@bevforge/ops",
  "version": "1.0.0",
  ...
}
```

---

### **Option B: Keep Current Structure (Simpler)**

If you prefer to keep things simple for now:

1. **Keep OPS in root** (current structure)
2. **Add OS as subfolder**: `os/` directory
3. **Add shared types**: `shared/` directory
4. **Move docs**: Create `docs/` for architecture docs

**Pros:**
- ✅ Less disruptive
- ✅ OPS continues working as-is
- ✅ Easy to add OS alongside

**Cons:**
- ❌ Less clean separation
- ❌ Harder to manage dependencies
- ❌ Root directory cluttered

---

## 🔄 Integration Workflow

### **Phase 1: Build OS (Separate Airo Chat)**

1. Create new Airo project/chat for OS
2. Point it to this Git repository
3. Work in `os/` directory
4. Build OS API endpoints per `docs/OS-API-CONTRACT.md`
5. Test OS standalone

### **Phase 2: Integrate OPS with OS (This Chat)**

1. OS provides API base URL
2. Update OPS to call OS APIs
3. Remove mock data from OPS
4. Test end-to-end workflow

### **Phase 3: Shared Types (Both Chats)**

1. Create shared TypeScript types in `shared/`
2. Both OS and OPS import from `@bevforge/shared`
3. Ensures type safety across modules

---

## 📋 Git Workflow

### **Working in Separate Chats**

**OS Chat (Airo #2):**
```bash
# Work only in os/ directory
cd os/
git add os/
git commit -m "feat(os): add inventory API"
git push
```

**OPS Chat (Airo #1 - This Chat):**
```bash
# Work only in ops/ directory (or root if Option B)
git add ops/  # or git add . if Option B
git commit -m "feat(ops): integrate with OS API"
git push
```

**Merge Strategy:**
- Each chat works in its own directory
- No file conflicts (different paths)
- Pull before starting work to get latest changes
- Push when done

---

## 🎯 Recommended Approach

**I recommend Option B (Keep Current Structure) for now:**

**Why?**
1. ✅ Less disruptive - OPS keeps working
2. ✅ Faster setup - just add `os/` folder
3. ✅ Easy to restructure later if needed
4. ✅ Both modules can coexist peacefully

**Steps:**
1. Create `os/` directory (empty for now)
2. Upload your current OS work to `os/`
3. Create new Airo chat pointing to this repo
4. OS chat works in `os/`, OPS chat works in root
5. Integrate when both are ready

---

## 📝 Next Steps

### **For You:**

1. **Upload OS files to Git**
   ```bash
   # In your local machine
   mkdir os
   # Copy your OS project files into os/
   git add os/
   git commit -m "feat: add OS module"
   git push
   ```

2. **Create new Airo project/chat**
   - Point it to this Git repository
   - Tell it to work in `os/` directory
   - Share `docs/OS-API-CONTRACT.md` with it

3. **Continue OPS development here**
   - This chat continues working on OPS
   - We'll integrate with OS when it's ready

---

## 🔗 Integration Points

### **OS Provides (API Endpoints):**
- `GET /api/os/items` - Products/materials
- `GET /api/os/inventory/on-hand` - Stock levels
- `GET /api/os/batches` - Production batches
- `POST /api/os/inventory/movements` - Record movements

### **OPS Consumes (API Client):**
```typescript
// ops/src/lib/os-client.ts
export async function getInventoryOnHand(itemId: string) {
  const response = await fetch(`${OS_API_BASE}/api/os/inventory/on-hand?itemId=${itemId}`);
  return response.json();
}
```

---

## ✅ Success Criteria

**OS Module Complete:**
- ✅ API endpoints implemented
- ✅ Inventory ledger working
- ✅ Batch tracking functional
- ✅ Can run standalone

**OPS Module Complete:**
- ✅ Reads inventory from OS API
- ✅ Creates orders with stock validation
- ✅ Records shipments in OS
- ✅ Business workflows functional

**Integration Complete:**
- ✅ OPS can check stock in OS
- ✅ OPS can create inventory movements in OS
- ✅ No data duplication
- ✅ End-to-end order workflow works

---

## 📞 Communication Between Chats

**Share this information between chats:**
- API base URLs (OS and OPS)
- Shared type definitions
- Integration test results
- Any breaking changes

**Use Git commit messages to communicate:**
```bash
# OS chat
git commit -m "feat(os): add inventory API - ready for OPS integration"

# OPS chat
git commit -m "feat(ops): integrate with OS inventory API"
```

---

## 🎉 Summary

**Current State:**
- ✅ OPS module working in root directory
- ✅ Architecture defined (OS/OPS separation)
- ✅ API contract documented

**Next Steps:**
1. Upload OS files to `os/` directory
2. Create new Airo chat for OS development
3. Build OS API endpoints
4. Integrate OPS with OS
5. Test end-to-end workflow

**You're ready to build both modules in parallel!** 🚀
