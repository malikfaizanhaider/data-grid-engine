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
});
