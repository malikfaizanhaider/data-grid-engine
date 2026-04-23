# data-grid-engine

TypeScript-ready TanStack Table engine wrapper with build + test tooling.

## Setup

```bash
npm install
```

## Scripts

- `npm run build` – compile TypeScript to `dist/`
- `npm run typecheck` – run strict TypeScript checks
- `npm test` – run tests once with Vitest
- `npm run test:watch` – run Vitest in watch mode

## Usage

```ts
import {TanStackGridEngine} from 'data-grid-engine';

const engine = new TanStackGridEngine({
  data: [
    {id: 1, name: 'Amy', age: 33},
    {id: 2, name: 'Ben', age: 27},
  ],
  columns: [
    {accessorKey: 'name', header: 'Name'},
    {accessorKey: 'age', header: 'Age'},
  ],
});

engine.setSorting([{id: 'age', desc: false}]);
console.log(engine.getRows());
```
