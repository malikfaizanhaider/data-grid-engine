import {describe, expect, it} from 'vitest';
import {TanStackGridEngine} from '../core';

type Person = {
  id: number;
  name: string;
  age: number;
};

const columns = [
  {accessorKey: 'name', header: 'Name'},
  {accessorKey: 'age', header: 'Age'},
];

describe('TanStackGridEngine project setup', () => {
  it('creates rows and supports sorting updates', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [
        {id: 1, name: 'Amy', age: 33},
        {id: 2, name: 'Ben', age: 27},
      ],
      columns,
    });

    expect(engine.getRows()).toHaveLength(2);

    engine.setSorting([{id: 'age', desc: false}]);
    expect(engine.getSorting()).toEqual([{id: 'age', desc: false}]);
  });

  it('exposes TanStack table methods through proxy', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [{id: 1, name: 'Amy', age: 33}],
      columns,
    });

    expect(engine.getAllLeafColumns().map((col) => col.id)).toEqual(['name', 'age']);
  });

  it('supports feature pipeline helpers and faceting APIs', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [
        {id: 1, name: 'Amy', age: 33},
        {id: 2, name: 'Ben', age: 27},
        {id: 3, name: 'Amy', age: 44},
      ],
      columns,
    });

    engine.setGlobalFilter('Amy');
    expect(engine.getFilteredRowModel().rows).toHaveLength(2);

    const nameColumn = engine.getColumn('name');
    expect(nameColumn).toBeDefined();
    expect(nameColumn!.getFacetedUniqueValues().get('Amy')).toBe(2);
    expect(nameColumn!.getFacetedMinMaxValues()).toEqual(undefined);
  });

  it('allows table options updates while preserving internal state sync', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [{id: 1, name: 'Amy', age: 33}],
      columns,
      manualPagination: true,
      pageCount: 10,
    });

    expect(engine.getOptions().manualPagination).toBe(true);
    expect(engine.getPageCount()).toBe(10);

    engine.updateOptions({pageCount: 5});
    expect(engine.getPageCount()).toBe(5);

    engine.setSorting([{id: 'age', desc: true}]);
    expect(engine.getState().sorting).toEqual([{id: 'age', desc: true}]);
  });

  it('persists updated data and columns across unrelated option updates', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [{id: 1, name: 'Amy', age: 33}],
      columns,
    });

    engine.updateOptions({
      data: [{id: 2, name: 'Ben', age: 27}],
      columns: [{accessorKey: 'name', header: 'Name only'}],
    });

    engine.updateOptions({pageCount: 1});

    expect(engine.getOptions().data).toEqual([{id: 2, name: 'Ben', age: 27}]);
    expect(engine.getAllLeafColumns().map((col) => col.id)).toEqual(['name']);
    expect(engine.getRows()).toHaveLength(1);
    expect(engine.getRows()[0]?.original.name).toBe('Ben');
  });
});
