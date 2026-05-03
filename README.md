# @engine/data-grid

Headless, framework-agnostic data grid engine built on top of [TanStack Table](https://tanstack.com/table). Provides a powerful abstraction layer with built-in state management, event system, and enterprise features.

## Features

- **Framework Agnostic** - Works with React, Vue, Angular, Solid, or vanilla JS
- **Headless** - Full control over markup and styling
- **TypeScript First** - Complete type safety and IntelliSense
- **Tree-shakable** - Import only what you need
- **Server-Side Ready** - Built-in support for server-side operations
- **Plugin System** - Extensible architecture
- **Event-Driven** - Comprehensive event system for state changes

## Installation

```bash
npm install @engine/data-grid @tanstack/table-core
```

```bash
yarn add @engine/data-grid @tanstack/table-core
```

```bash
pnpm add @engine/data-grid @tanstack/table-core
```

## Quick Start

```ts
import { TanStackGridEngine } from '@engine/data-grid';

// Define your data type
interface Person {
  id: number;
  name: string;
  age: number;
}

// Create the engine
const engine = new TanStackGridEngine<Person>({
  data: [
    { id: 1, name: 'Amy', age: 33 },
    { id: 2, name: 'Ben', age: 27 },
    { id: 3, name: 'Charlie', age: 45 },
  ],
  columns: [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'age', header: 'Age' },
  ],
});

// Use the engine
engine.setSorting([{ id: 'age', desc: false }]);
const rows = engine.getRows();
```

## Imports

### Main Entry

```ts
// Everything from one import
import { 
  TanStackGridEngine,
  GridEventBus,
  GridFeatureManager,
  // ... all exports
} from '@engine/data-grid';
```

### Tree-shakable Imports

```ts
// Import specific modules for optimal bundle size
import { TanStackGridEngine } from '@engine/data-grid/core/base/engine';
import { GridEventBus } from '@engine/data-grid/core/base/events';
import { GridFeatureManager } from '@engine/data-grid/core/base/features';
import { GridMutationManager } from '@engine/data-grid/core/base/mutations';
import { GridPersistenceManager } from '@engine/data-grid/core/base/persistence';
import { GridPluginManager } from '@engine/data-grid/core/base/plugins';
```

### Type Imports

```ts
import type { GridCore } from '@engine/data-grid/core/base/core';
import type { GridFeatureConfig } from '@engine/data-grid/core/base/types';
import type { 
  GridRenderableRow,
  GridRenderableHeader,
  GridRenderableCell,
} from '@engine/data-grid/core/base/rendering';
```

## API Reference

### TanStackGridEngine

The main engine class that wraps TanStack Table with additional functionality.

```ts
const engine = new TanStackGridEngine<TData>({
  data: TData[],
  columns: ColumnDef<TData>[],
  // ... TanStack Table options
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `getRows()` | Get all processed rows |
| `getRowModel()` | Get the current row model |
| `getAllColumns()` | Get all column definitions |
| `getVisibleLeafColumns()` | Get visible leaf columns |
| `getState()` | Get current table state |
| `setState(updater)` | Update table state |
| `setSorting(sorting)` | Set sorting state |
| `setFiltering(filters)` | Set column filters |
| `setPagination(pagination)` | Set pagination state |
| `on(event, handler)` | Subscribe to events |
| `off(event, handler)` | Unsubscribe from events |
| `destroy()` | Clean up resources |

### Events

```ts
// Subscribe to state changes
engine.on('stateChange', (state) => {
  console.log('State changed:', state);
});

// Subscribe to sorting changes
engine.on('sortingChange', (sorting) => {
  console.log('Sorting:', sorting);
});

// Subscribe to errors
engine.on('error', (error) => {
  console.error('Error:', error);
});
```

## Package Exports

| Path | Description |
|------|-------------|
| `@engine/data-grid` | Main entry point |
| `@engine/data-grid/core` | Core module |
| `@engine/data-grid/core/base` | Base utilities |
| `@engine/data-grid/core/base/engine` | Grid engine |
| `@engine/data-grid/core/base/events` | Event system |
| `@engine/data-grid/core/base/features` | Feature management |
| `@engine/data-grid/core/base/mutations` | Mutation handling |
| `@engine/data-grid/core/base/persistence` | State persistence |
| `@engine/data-grid/core/base/plugins` | Plugin system |
| `@engine/data-grid/core/base/rendering` | Rendering utilities |
| `@engine/data-grid/core/base/server` | Server-side support |
| `@engine/data-grid/core/base/types` | TypeScript types |

## CDN / Browser

```html
<script src="https://unpkg.com/@engine/data-grid/dist/cdn/index.umd.min.js"></script>

<script>
  const { TanStackGridEngine } = DataGridEngine;
  
  const engine = new TanStackGridEngine({
    data: [...],
    columns: [...],
  });
</script>
```

## CommonJS

```js
const { TanStackGridEngine } = require('@engine/data-grid');
```

## TypeScript

This package is written in TypeScript and includes complete type definitions. No additional `@types/*` packages required.

```ts
import type { 
  GridFeatureConfig,
  GridServerConfig,
  GridEngineDiagnostics,
} from '@engine/data-grid/core/base/types';
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@tanstack/table-core` | `^8.0.0` |

## Contributing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## License

MIT © TanStack
