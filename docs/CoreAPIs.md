### ColumnDef APIs

---
title: ColumnDef APIs
---

Column definitions are plain objects with the following options:

## Options

### `id`

```tsx
id: string
```

The unique identifier for the column.

> 🧠 A column ID is optional when:
>
> - An accessor column is created with an object key accessor
> - The column header is defined as a string

### `accessorKey`

```tsx
accessorKey?: string & typeof TData
```

The key of the row object to use when extracting the value for the column.

### `accessorFn`

```tsx
accessorFn?: (originalRow: TData, index: number) => any
```

The accessor function to use when extracting the value for the column from each row.

### `columns`

```tsx
columns?: ColumnDef<TData>[]
```

The child column defs to include in a group column.

### `header`

```tsx
header?:
  | string
  | ((props: {
      table: Table<TData>
      header: Header<TData>
      column: Column<TData>
    }) => unknown)
```

The header to display for the column. If a string is passed, it can be used as a default for the column ID. If a function is passed, it will be passed a props object for the header and should return the rendered header value (the exact type depends on the adapter being used).

### `footer`

```tsx
footer?:
  | string
  | ((props: {
      table: Table<TData>
      header: Header<TData>
      column: Column<TData>
    }) => unknown)
```

The footer to display for the column. If a function is passed, it will be passed a props object for the footer and should return the rendered footer value (the exact type depends on the adapter being used).

### `cell`

```tsx
cell?:
  | string
  | ((props: {
      table: Table<TData>
      row: Row<TData>
      column: Column<TData>
      cell: Cell<TData>
      getValue: () => any
      renderValue: () => any
    }) => unknown)
```

The cell to display each row for the column. If a function is passed, it will be passed a props object for the cell and should return the rendered cell value (the exact type depends on the adapter being used).

### `meta`

```tsx
meta?: ColumnMeta // This interface is extensible via declaration merging. See below!
```

The meta data to be associated with the column. We can access it anywhere when the column is available via `column.columnDef.meta`. This type is global to all tables and can be extended like so:

```tsx
import '@tanstack/react-table' //or vue, svelte, solid, qwik, etc.

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    foo: string
  }
}
```


### Table APIs

---
title: Table APIs
---

## `useReactTable` / `createSolidTable` / `useQwikTable` / `useVueTable` / `createSvelteTable`

```tsx
type useReactTable = <TData extends AnyData>(
  options: TableOptions<TData>
) => Table<TData>
```

These functions are used to create a table. Which one you use depends on which framework adapter you are using.

## Options

These are **core** options and API properties for the table. More options and API properties are available for other [table features](../../guide/features.md).

### `data`

```tsx
data: TData[]
```

The data for the table to display. This array should match the type you provided to `table.setRowType<...>`, but in theory could be an array of anything. It's common for each item in the array to be an object of key/values but this is not required. Columns can access this data via string/index or a functional accessor to return anything they want.

When the `data` option changes reference (compared via `Object.is`), the table will reprocess the data. Any other data processing that relies on the core data model (such as grouping, sorting, filtering, etc) will also be reprocessed.

> 🧠 Make sure your `data` option is only changing when you want the table to reprocess. Providing an inline `[]` or constructing the data array as a new object every time you want to render the table will result in a _lot_ of unnecessary re-processing. This can easily go unnoticed in smaller tables, but you will likely notice it in larger tables.

### `columns`

```tsx
type columns = ColumnDef<TData>[]
```

The array of column defs to use for the table. See the [Column Def Guide](../../guide/column-defs.md) for more information on creating column definitions.

### `defaultColumn`

```tsx
defaultColumn?: Partial<ColumnDef<TData>>
```

Default column options to use for all column defs supplied to the table. This is useful for providing default cell/header/footer renderers, sorting/filtering/grouping options, etc. All column definitions passed to `options.columns` are merged with this default column definition to produce the final column definitions.

### `initialState`

```tsx
initialState?: Partial<
  VisibilityTableState &
  ColumnOrderTableState &
  ColumnPinningTableState &
  FiltersTableState &
  SortingTableState &
  ExpandedTableState &
  GroupingTableState &
  ColumnSizingTableState &
  PaginationTableState &
  RowSelectionTableState
>
```

Use this option to optionally pass initial state to the table. This state will be used when resetting various table states either automatically by the table (eg. `options.autoResetPageIndex`) or via functions like `table.resetRowSelection()`. Most reset function allow you optionally pass a flag to reset to a blank/default state instead of the initial state.

> 🧠 Table state will not be reset when this object changes, which also means that the initial state object does not need to be stable.

### `autoResetAll`

```tsx
autoResetAll?: boolean
```

Set this option to override any of the `autoReset...` feature options.

### `meta`

```tsx
meta?: TableMeta // This interface is extensible via declaration merging. See below!
```

You can pass any object to `options.meta` and access it anywhere the `table` is available via `table.options.meta` This type is global to all tables and can be extended like so:

```tsx
declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    foo: string
  }
}
```

> 🧠 Think of this option as an arbitrary "context" for your table. This is a great way to pass arbitrary data or functions to your table without having to pass it to every thing the table touches. A good example is passing a locale object to your table to use for formatting dates, numbers, etc or even a function that can be used to update editable data like in the [editable-data](https://github.com/TanStack/table/tree/main/examples/react/editable-data) example.

### `state`

```tsx
state?: Partial<
  VisibilityTableState &
  ColumnOrderTableState &
  ColumnPinningTableState &
  FiltersTableState &
  SortingTableState &
  ExpandedTableState &
  GroupingTableState &
  ColumnSizingTableState &
  PaginationTableState &
  RowSelectionTableState
>
```

The `state` option can be used to optionally _control_ part or all of the table state. The state you pass here will merge with and overwrite the internal automatically-managed state to produce the final state for the table. You can also listen to state changes via the `onStateChange` option.

### `onStateChange`

```tsx
onStateChange: (updater: Updater<TableState>) => void
```

The `onStateChange` option can be used to optionally listen to state changes within the table. If you provide this options, you will be responsible for controlling and updating the table state yourself. You can provide the state back to the table with the `state` option.

### `debugAll`

> ⚠️ Debugging is only available in development mode.

```tsx
debugAll?: boolean
```

Set this option to true to output all debugging information to the console.

### `debugTable`

> ⚠️ Debugging is only available in development mode.

```tsx
debugTable?: boolean
```

Set this option to true to output table debugging information to the console.

### `debugHeaders`

> ⚠️ Debugging is only available in development mode.

```tsx
debugHeaders?: boolean
```

Set this option to true to output header debugging information to the console.

### `debugColumns`

> ⚠️ Debugging is only available in development mode.

```tsx
debugColumns?: boolean
```

Set this option to true to output column debugging information to the console.

### `debugRows`

> ⚠️ Debugging is only available in development mode.

```tsx
debugRows?: boolean
```

Set this option to true to output row debugging information to the console.

### `_features`

```tsx
_features?: TableFeature[]
```

An array of extra features that you can add to the table instance.

### `render`

> ⚠️ This option is only necessary if you are implementing a table adapter.

```tsx
type render = <TProps>(template: Renderable<TProps>, props: TProps) => any
```

The `render` option provides a renderer implementation for the table. This implementation is used to turn a table's various column header and cell templates into a result that is supported by the user's framework.

### `mergeOptions`

> ⚠️ This option is only necessary if you are implementing a table adapter.

```tsx
type mergeOptions = <T>(defaultOptions: T, options: Partial<T>) => T
```

This option is used to optionally implement the merging of table options. Some framework like solid-js use proxies to track reactivity and usage, so merging reactive objects needs to be handled carefully. This option inverts control of this process to the adapter.

### `getCoreRowModel`

```tsx
getCoreRowModel: (table: Table<TData>) => () => RowModel<TData>
```

This required option is a factory for a function that computes and returns the core row model for the table. It is called **once** per table and should return a **new function** which will calculate and return the row model for the table.

A default implementation is provided via any table adapter's `{ getCoreRowModel }` export.

### `getSubRows`

```tsx
getSubRows?: (
  originalRow: TData,
  index: number
) => undefined | TData[]
```

This optional function is used to access the sub rows for any given row. If you are using nested rows, you will need to use this function to return the sub rows object (or undefined) from the row.

### `getRowId`

```tsx
getRowId?: (
  originalRow: TData,
  index: number,
  parent?: Row<TData>
) => string
```

This optional function is used to derive a unique ID for any given row. If not provided the rows index is used (nested rows join together with `.` using their grandparents' index eg. `index.index.index`). If you need to identify individual rows that are originating from any server-side operations, it's suggested you use this function to return an ID that makes sense regardless of network IO/ambiguity eg. a userId, taskId, database ID field, etc.

## Table API

These properties and methods are available on the table object:

### `initialState`

```tsx
initialState: VisibilityTableState &
  ColumnOrderTableState &
  ColumnPinningTableState &
  FiltersTableState &
  SortingTableState &
  ExpandedTableState &
  GroupingTableState &
  ColumnSizingTableState &
  PaginationTableState &
  RowSelectionTableState
```

This is the resolved initial state of the table.

### `reset`

```tsx
reset: () => void
```

Call this function to reset the table state to the initial state.

### `getState`

```tsx
getState: () => TableState
```

Call this function to get the table's current state. It's recommended to use this function and its state, especially when managing the table state manually. It is the exact same state used internally by the table for every feature and function it provides.

> 🧠 The state returned by this function is the shallow-merged result of the automatically-managed internal table-state and any manually-managed state passed via `options.state`.

### `setState`

```tsx
setState: (updater: Updater<TableState>) => void
```

Call this function to update the table state. It's recommended you pass an updater function in the form of `(prevState) => newState` to update the state, but a direct object can also be passed.

> 🧠 If `options.onStateChange` is provided, it will be triggered by this function with the new state.

### `options`

```tsx
options: TableOptions<TData>
```

A read-only reference to the table's current options.

> ⚠️ This property is generally used internally or by adapters. It can be updated by passing new options to your table. This is different per adapter. For adapters themselves, table options must be updated via the `setOptions` function.

### `setOptions`

```tsx
setOptions: (newOptions: Updater<TableOptions<TData>>) => void
```

> ⚠️ This function is generally used by adapters to update the table options. It can be used to update the table options directly, but it is generally not recommended to bypass your adapters strategy for updating table options.

### `getCoreRowModel`

```tsx
getCoreRowModel: () => {
  rows: Row<TData>[],
  flatRows: Row<TData>[],
  rowsById: Record<string, Row<TData>>,
}
```

Returns the core row model before any processing has been applied.

### `getRowModel`

```tsx
getRowModel: () => {
  rows: Row<TData>[],
  flatRows: Row<TData>[],
  rowsById: Record<string, Row<TData>>,
}
```

Returns the final model after all processing from other used features has been applied.

### `getAllColumns`

```tsx
type getAllColumns = () => Column<TData>[]
```

Returns all columns in the table in their normalized and nested hierarchy, mirrored from the column defs passed to the table.

### `getAllFlatColumns`

```tsx
type getAllFlatColumns = () => Column<TData>[]
```

Returns all columns in the table flattened to a single level. This includes parent column objects throughout the hierarchy.

### `getAllLeafColumns`

```tsx
type getAllLeafColumns = () => Column<TData>[]
```

Returns all leaf-node columns in the table flattened to a single level. This does not include parent columns.

### `getColumn`

```tsx
type getColumn = (id: string) => Column<TData> | undefined
```

Returns a single column by its ID.

### `getHeaderGroups`

```tsx
type getHeaderGroups = () => HeaderGroup<TData>[]
```

Returns the header groups for the table.

### `getFooterGroups`

```tsx
type getFooterGroups = () => HeaderGroup<TData>[]
```

Returns the footer groups for the table.

### `getFlatHeaders`

```tsx
type getFlatHeaders = () => Header<TData>[]
```

Returns a flattened array of Header objects for the table, including parent headers.

### `getLeafHeaders`

```tsx
type getLeafHeaders = () => Header<TData>[]
```

Returns a flattened array of leaf-node Header objects for the table.


### Column APIs

---
title: Column APIs
---

These are **core** options and API properties for all columns. More options and API properties are available for other [table features](../../guide/features.md).

## Column API

All column objects have the following properties:

### `id`

```tsx
id: string
```

The resolved unique identifier for the column resolved in this priority:

- A manual `id` property from the column def
- The accessor key from the column def
- The header string from the column def

### `depth`

```tsx
depth: number
```

The depth of the column (if grouped) relative to the root column def array.

### `accessorFn`

```tsx
accessorFn?: AccessorFn<TData>
```

The resolved accessor function to use when extracting the value for the column from each row. Will only be defined if the column def has a valid accessor key or function defined.

### `columnDef`

```tsx
columnDef: ColumnDef<TData>
```

The original column def used to create the column.

### `columns`

```tsx
type columns = ColumnDef<TData>[]
```

The child column (if the column is a group column). Will be an empty array if the column is not a group column.

### `parent`

```tsx
parent?: Column<TData>
```

The parent column for this column. Will be undefined if this is a root column.

### `getFlatColumns`

```tsx
type getFlatColumns = () => Column<TData>[]
```

Returns the flattened array of this column and all child/grand-child columns for this column.

### `getLeafColumns`

```tsx
type getLeafColumns = () => Column<TData>[]
```

Returns an array of all leaf-node columns for this column. If a column has no children, it is considered the only leaf-node column.


### HeaderGroup APIs

---
title: HeaderGroup APIs
---

These are **core** options and API properties for all header groups. More options and API properties may be available for other [table features](../../guide/features.md).

## Header Group API

All header group objects have the following properties:

### `id`

```tsx
id: string
```

The unique identifier for the header group.

### `depth`

```tsx
depth: number
```

The depth of the header group, zero-indexed based.

### `headers`

```tsx
type headers = Header<TData>[]
```

An array of [Header](./header.md) objects that belong to this header group


### Header APIs

---
title: Header APIs
---

These are **core** options and API properties for all headers. More options and API properties may be available for other [table features](../../guide/features.md).

## Header API

All header objects have the following properties:

### `id`

```tsx
id: string
```

The unique identifier for the header.

### `index`

```tsx
index: number
```

The index for the header within the header group.

### `depth`

```tsx
depth: number
```

The depth of the header, zero-indexed based.

### `column`

```tsx
column: Column<TData>
```

The header's associated [Column](./column.md) object

### `headerGroup`

```tsx
headerGroup: HeaderGroup<TData>
```

The header's associated [HeaderGroup](./header-group.md) object

### `subHeaders`

```tsx
type subHeaders = Header<TData>[]
```

The header's hierarchical sub/child headers. Will be empty if the header's associated column is a leaf-column.

### `colSpan`

```tsx
colSpan: number
```

The col-span for the header.

### `rowSpan`

```tsx
rowSpan: number
```

The row-span for the header.

### `getLeafHeaders`

```tsx
type getLeafHeaders = () => Header<TData>[]
```

Returns the leaf headers hierarchically nested under this header.

### `isPlaceholder`

```tsx
isPlaceholder: boolean
```

A boolean denoting if the header is a placeholder header

### `placeholderId`

```tsx
placeholderId?: string
```

If the header is a placeholder header, this will be a unique header ID that does not conflict with any other headers across the table

### `getContext`

```tsx
getContext: () => {
  table: Table<TData>
  header: Header<TData, TValue>
  column: Column<TData, TValue>
}
```

Returns the rendering context (or props) for column-based components like headers, footers and filters. Use these props with your framework's `flexRender` utility to render these using the template of your choice:

```tsx
flexRender(header.column.columnDef.header, header.getContext())
```

## Table API

### `getHeaderGroups`

```tsx
type getHeaderGroups = () => HeaderGroup<TData>[]
```

Returns all header groups for the table.

### `getLeftHeaderGroups`

```tsx
type getLeftHeaderGroups = () => HeaderGroup<TData>[]
```

If pinning, returns the header groups for the left pinned columns.

### `getCenterHeaderGroups`

```tsx
type getCenterHeaderGroups = () => HeaderGroup<TData>[]
```

If pinning, returns the header groups for columns that are not pinned.

### `getRightHeaderGroups`

```tsx
type getRightHeaderGroups = () => HeaderGroup<TData>[]
```

If pinning, returns the header groups for the right pinned columns.

### `getFooterGroups`

```tsx
type getFooterGroups = () => HeaderGroup<TData>[]
```

Returns all footer groups for the table.

### `getLeftFooterGroups`

```tsx
type getLeftFooterGroups = () => HeaderGroup<TData>[]
```

If pinning, returns the footer groups for the left pinned columns.

### `getCenterFooterGroups`

```tsx
type getCenterFooterGroups = () => HeaderGroup<TData>[]
```

If pinning, returns the footer groups for columns that are not pinned.

### `getRightFooterGroups`

```tsx
type getRightFooterGroups = () => HeaderGroup<TData>[]
```

If pinning, returns the footer groups for the right pinned columns.

### `getFlatHeaders`

```tsx
type getFlatHeaders = () => Header<TData, unknown>[]
```

Returns headers for all columns in the table, including parent headers.

### `getLeftFlatHeaders`

```tsx
type getLeftFlatHeaders = () => Header<TData, unknown>[]
```

If pinning, returns headers for all left pinned columns in the table, including parent headers.

### `getCenterFlatHeaders`

```tsx
type getCenterFlatHeaders = () => Header<TData, unknown>[]
```

If pinning, returns headers for all columns that are not pinned, including parent headers.

### `getRightFlatHeaders`

```tsx
type getRightFlatHeaders = () => Header<TData, unknown>[]
```

If pinning, returns headers for all right pinned columns in the table, including parent headers.

### `getLeafHeaders`

```tsx
type getLeafHeaders = () => Header<TData, unknown>[]
```

Returns headers for all leaf columns in the table, (not including parent headers).

### `getLeftLeafHeaders`

```tsx
type getLeftLeafHeaders = () => Header<TData, unknown>[]
```

If pinning, returns headers for all left pinned leaf columns in the table, (not including parent headers).

### `getCenterLeafHeaders`

```tsx
type getCenterLeafHeaders = () => Header<TData, unknown>[]
```

If pinning, returns headers for all columns that are not pinned, (not including parent headers).

### `getRightLeafHeaders`

```tsx
type getRightLeafHeaders = () => Header<TData, unknown>[]
```

If pinning, returns headers for all right pinned leaf columns in the table, (not including parent headers).


### Row APIs

---
title: Row APIs
---

These are **core** options and API properties for all rows. More options and API properties are available for other [table features](../../guide/features.md).

## Row API

All row objects have the following properties:

### `id`

```tsx
id: string
```

The resolved unique identifier for the row resolved via the `options.getRowId` option. Defaults to the row's index (or relative index if it is a subRow)

### `depth`

```tsx
depth: number
```

The depth of the row (if nested or grouped) relative to the root row array.

### `index`

```tsx
index: number
```

The index of the row within its parent array (or the root data array)

### `original`

```tsx
original: TData
```

The original row object provided to the table.

> 🧠 If the row is a grouped row, the original row object will be the first original in the group.

### `parentId`

```tsx
parentId?: string
```

If nested, this row's parent row id.

### `getValue`

```tsx
getValue: (columnId: string) => TValue
```

Returns the value from the row for a given columnId

### `renderValue`

```tsx
renderValue: (columnId: string) => TValue
```

Renders the value from the row for a given columnId, but will return the `renderFallbackValue` if no value is found.

### `getUniqueValues`

```tsx
getUniqueValues: (columnId: string) => TValue[]
```

Returns a unique array of values from the row for a given columnId.

### `subRows`

```tsx
type subRows = Row<TData>[]
```

An array of subRows for the row as returned and created by the `options.getSubRows` option.

### `getParentRow`

```tsx
type getParentRow = () => Row<TData> | undefined
```

Returns the parent row for the row, if it exists.

### `getParentRows`

```tsx
type getParentRows = () => Row<TData>[]
```

Returns the parent rows for the row, all the way up to a root row.

### `getLeafRows`

```tsx
type getLeafRows = () => Row<TData>[]
```

Returns the leaf rows for the row, not including any parent rows.

### `originalSubRows`

```tsx
originalSubRows?: TData[]
```

An array of the original subRows as returned by the `options.getSubRows` option.

### `getAllCells`

```tsx
type getAllCells = () => Cell<TData>[]
```

Returns all of the [Cells](./cell.md) for the row.


### Cell APIs

---
title: Cell APIs
---

These are **core** options and API properties for all cells. More options and API properties are available for other [table features](../../guide/features.md).

## Cell API

All cell objects have the following properties:

### `id`

```tsx
id: string
```

The unique ID for the cell across the entire table.

### `getValue`

```tsx
getValue: () => any
```

Returns the value for the cell, accessed via the associated column's accessor key or accessor function.

### `renderValue`

```tsx
renderValue: () => any
```

Renders the value for a cell the same as `getValue`, but will return the `renderFallbackValue` if no value is found.

### `row`

```tsx
row: Row<TData>
```

The associated Row object for the cell.

### `column`

```tsx
column: Column<TData>
```

The associated Column object for the cell.

### `getContext`

```tsx
getContext: () => {
  table: Table<TData>
  column: Column<TData, TValue>
  row: Row<TData>
  cell: Cell<TData, TValue>
  getValue: <TTValue = TValue,>() => TTValue
  renderValue: <TTValue = TValue,>() => TTValue | null
}
```

Returns the rendering context (or props) for cell-based components like cells and aggregated cells. Use these props with your framework's `flexRender` utility to render these using the template of your choice:

```tsx
flexRender(cell.column.columnDef.cell, cell.getContext())
```




