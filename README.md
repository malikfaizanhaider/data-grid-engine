# @i2c/data-grid-engine

TypeScript-ready TanStack Table engine wrapper with full ESM, CommonJS, and UMD support.

## Installation

```bash
npm install @i2c/data-grid-engine @tanstack/table-core
```

> **Note:** `@tanstack/table-core` is a peer dependency. You must install it alongside this package.

## Usage

### ES Modules (recommended)

```ts
import { TanStackGridEngine } from '@i2c/data-grid-engine';

const engine = new TanStackGridEngine({
  data: [
    { id: 1, name: 'Amy', age: 33 },
    { id: 2, name: 'Ben', age: 27 },
  ],
  columns: [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'age', header: 'Age' },
  ],
});

engine.setSorting([{ id: 'age', desc: false }]);
console.log(engine.getRows());
```

### Tree-shakable imports

For optimal bundle size, import only what you need:

```ts
// Import specific modules for better tree-shaking
import { TanStackGridEngine } from '@i2c/data-grid-engine/core/base/engine';
import { GridEventBus } from '@i2c/data-grid-engine/core/base/events';
import { GridFeatureManager } from '@i2c/data-grid-engine/core/base/features';
import { GridMutationManager } from '@i2c/data-grid-engine/core/base/mutations';
```

### CommonJS

```js
const { TanStackGridEngine } = require('@i2c/data-grid-engine');

const engine = new TanStackGridEngine({
  data: [...],
  columns: [...],
});
```

### Browser (CDN)

```html
<!-- Production (minified) -->
<script src="https://unpkg.com/@i2c/data-grid-engine/dist/cdn/index.umd.min.js"></script>

<!-- Development (with source maps) -->
<script src="https://unpkg.com/@i2c/data-grid-engine/dist/cdn/index.umd.js"></script>

<script>
  const engine = new DataGridEngine.TanStackGridEngine({
    data: [...],
    columns: [...],
  });
</script>
```

## Package Exports

| Import Path | Description |
|-------------|-------------|
| `@i2c/data-grid-engine` | Main entry (ESM/CJS auto-resolved) |
| `@i2c/data-grid-engine/core` | Core module |
| `@i2c/data-grid-engine/core/base` | Base utilities |
| `@i2c/data-grid-engine/core/base/*` | Individual modules (engine, events, etc.) |
| `@i2c/data-grid-engine/cdn` | UMD minified bundle |
| `@i2c/data-grid-engine/cdn/dev` | UMD development bundle |

## Build Outputs

```
dist/
├── index.js          # ESM entry
├── index.cjs         # CJS entry
├── index.d.ts        # TypeScript declarations
├── chunk-*.js        # Shared ESM chunks (tree-shaking)
├── chunk-*.cjs       # Shared CJS chunks
├── core/
│   ├── index.js
│   ├── index.cjs
│   ├── index.d.ts
│   └── base/
│       ├── engine.js      # ESM
│       ├── engine.cjs     # CJS
│       ├── engine.d.ts    # Types
│       ├── events.js
│       ├── events.cjs
│       ├── features.js
│       └── ...
└── cdn/              # UMD for browsers
    ├── index.umd.min.js   # Production (minified)
    └── index.umd.js       # Development
```

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build ESM, CJS, and UMD bundles |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests with Vitest |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run clean` | Remove dist folder |
| `npm run dev` | Watch mode for development |

### Building

```bash
npm run build
```

This generates:
- **ESM** (`dist/esm/`) - Tree-shakable ES modules with TypeScript declarations
- **CJS** (`dist/cjs/`) - CommonJS modules for Node.js
- **UMD** (`dist/cdn/`) - Browser bundles (minified + development)

## Git Workflow

When integrating code review fixes from multiple branches into `main`:

```bash
git fetch --all --prune
git checkout main
git pull --ff-only origin main

# For each reviewed branch
git checkout feature/code-review-fixes
git rebase main
npm test && npm run typecheck
git checkout main
git merge --no-ff feature/code-review-fixes

# Final verification
npm test && npm run typecheck && npm run build
git push origin main
```

## License

ISC © i2c Inc
