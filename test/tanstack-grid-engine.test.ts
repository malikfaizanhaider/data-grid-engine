import {describe, expect, it} from 'vitest';
import {TanStackGridEngine} from '../core';
import {TanStackGridEngine as RootExportedTanStackGridEngine} from '../index';

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

  it('re-exports engine from the package root entrypoint', () => {
    expect(RootExportedTanStackGridEngine).toBe(TanStackGridEngine);
  });
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

  it('normalizes and validates columns passed via updateOptions', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [{id: 1, name: 'Amy', age: 33}],
      columns,
    });

    engine.updateOptions({
      columns: [
        {
          header: 'Person',
          columns: [
            {header: 'Display Name', accessorKey: 'name'},
            {header: 'Years', accessorKey: 'age'},
          ],
        },
      ],
    });

    expect(engine.getAllLeafColumns().map((col) => col.id)).toEqual(['name', 'age']);
    expect(engine.getColumnOrder()).toEqual(['name', 'age']);

    expect(() =>
      engine.updateOptions({
        columns: [
          {id: 'dup', accessorKey: 'name', header: 'Name'},
          {id: 'dup', accessorKey: 'age', header: 'Age'},
        ],
      }),
    ).toThrow('Duplicate column id "dup" detected.');

    engine.updateOptions({pageCount: 2});
    expect(engine.getPageCount()).toBe(2);
    expect(engine.getAllLeafColumns().map((col) => col.id)).toEqual(['name', 'age']);
  });

  it('preserves valid falsey global filter values', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [{id: 1, name: 'Amy', age: 0}],
      columns,
    });

    engine.setGlobalFilter(0);
    expect(engine.getGlobalFilter()).toBe(0);
  });

  it('normalizes nested column IDs and updates column order on setColumns', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [{id: 1, name: 'Amy', age: 33}],
      columns,
    });

    engine.setColumns([
      {
        header: 'Person',
        columns: [
          {header: 'Display Name', accessorKey: 'name'},
          {header: 'Years', accessorKey: 'age'},
        ],
      },
    ]);

    expect(engine.getAllLeafColumns().map((col) => col.id)).toEqual(['name', 'age']);
    expect(engine.getColumnOrder()).toEqual(['name', 'age']);
  });

  it('throws when duplicate column IDs are configured', () => {
    expect(
      () =>
        new TanStackGridEngine<Person>({
          data: [{id: 1, name: 'Amy', age: 33}],
          columns: [
            {id: 'dup', accessorKey: 'name', header: 'Name'},
            {id: 'dup', accessorKey: 'age', header: 'Age'},
          ],
        }),
    ).toThrow('Duplicate column id "dup" detected.');
  });
});
