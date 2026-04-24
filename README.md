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

## Safe main-branch integration workflow

When you need to bring code review fixes and improvements from multiple branches into `main`, use this sequence:

1. Refresh local refs and switch to `main`.
2. Pull latest `main` from origin.
3. For each reviewed branch:
   - Rebase the branch on latest `main`.
   - Run tests/typechecks.
   - Merge to `main` with `--no-ff` so history is explicit.
4. Run full checks on `main`.
5. Push `main` once all merges pass.

```bash
git fetch --all --prune
git checkout main
git pull --ff-only origin main

# Repeat for each reviewed branch
git checkout feature/code-review-fixes
git rebase main
npm test && npm run typecheck
git checkout main
git merge --no-ff feature/code-review-fixes

# Final verification on main
npm test && npm run typecheck && npm run build
git push origin main
```

Tips:
- Prefer `--ff-only` pulls on `main` to avoid accidental merge commits.
- Never push branches to `main` until review comments are resolved and tests pass.
- Resolve conflicts on feature branches first, then merge to keep `main` stable.

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
