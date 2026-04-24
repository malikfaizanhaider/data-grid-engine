import {describe, expect, it, vi} from 'vitest'
import {TanStackGridEngine} from '../core/engine/tanstack-grid-engine'
import {GridController} from '../core/controller/grid.controller'

type Person = {
  id: number
  name: string
  age: number
}

const columns = [
  {accessorKey: 'name', header: 'Name'},
  {accessorKey: 'age', header: 'Age'},
]

describe('GridController subscriptions and cache invalidation', () => {
  it('notifies each controller listener only once per engine update', async () => {
    const engine = new TanStackGridEngine<Person>({
      data: [
        {id: 1, name: 'Amy', age: 33},
        {id: 2, name: 'Ben', age: 27},
      ],
      columns,
    })

    const controller = new GridController(engine, {engine, recordCount: 2})

    const first = vi.fn()
    const second = vi.fn()

    const unsubscribeFirst = controller.subscribe(first)
    const unsubscribeSecond = controller.subscribe(second)

    controller.setSorting([{id: 'age', desc: false}])
    await Promise.resolve()

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)

    unsubscribeFirst()
    unsubscribeSecond()
  })

  it('refreshes cached rows for imperative writes without active subscribers', () => {
    const engine = new TanStackGridEngine<Person>({
      data: [
        {id: 1, name: 'Amy', age: 33},
        {id: 2, name: 'Ben', age: 27},
      ],
      columns,
    })

    const controller = new GridController(engine, {engine, recordCount: 2})

    expect(controller.getRows()).toHaveLength(2)

    controller.setGlobalFilter('Amy')

    expect(controller.getRows()).toHaveLength(1)
  })
})
