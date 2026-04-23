### Column Filtering APIs

---
title: Column Filtering APIs
id: column-filtering
---

## Can-Filter

The ability for a column to be **column** filtered is determined by the following:

- The column was defined with a valid `accessorKey`/`accessorFn`.
- `column.enableColumnFilter` is not set to `false`
- `options.enableColumnFilters` is not set to `false`
- `options.enableFilters` is not set to `false`

## State

Filter state is stored on the table using the following shape:

```tsx
export interface ColumnFiltersTableState {
  columnFilters: ColumnFiltersState
}

export type ColumnFiltersState = ColumnFilter[]

export interface ColumnFilter {
  id: string
  value: unknown
}
```

## Filter Functions

The following filter functions are built-in to the table core:

- `includesString`
    - Case-insensitive string inclusion
- `includesStringSensitive`
    - Case-sensitive string inclusion
- `equalsString`
    - Case-insensitive string equality
- `equalsStringSensitive`
    - Case-sensitive string equality
- `arrIncludes`
    - Item inclusion within an array
- `arrIncludesAll`
    - All items included in an array
- `arrIncludesSome`
    - Some items included in an array
- `equals`
    - Object/referential equality `Object.is`/`===`
- `weakEquals`
    - Weak object/referential equality `==`
- `inNumberRange`
    - Number range inclusion

Every filter function receives:

- The row to filter
- The columnId to use to retrieve the row's value
- The filter value

and should return `true` if the row should be included in the filtered rows, and `false` if it should be removed.

This is the type signature for every filter function:

```tsx
export type FilterFn<TData extends AnyData> = {
  (
    row: Row<TData>,
    columnId: string,
    filterValue: any,
    addMeta: (meta: any) => void
  ): boolean
  resolveFilterValue?: TransformFilterValueFn<TData>
  autoRemove?: ColumnFilterAutoRemoveTestFn<TData>
  addMeta?: (meta?: any) => void
}

export type TransformFilterValueFn<TData extends AnyData> = (
  value: any,
  column?: Column<TData>
) => unknown

export type ColumnFilterAutoRemoveTestFn<TData extends AnyData> = (
  value: any,
  column?: Column<TData>
) => boolean

export type CustomFilterFns<TData extends AnyData> = Record<
  string,
  FilterFn<TData>
>
```

### `filterFn.resolveFilterValue`

This optional "hanging" method on any given `filterFn` allows the filter function to transform/sanitize/format the filter value before it is passed to the filter function.

### `filterFn.autoRemove`

This optional "hanging" method on any given `filterFn` is passed a filter value and expected to return `true` if the filter value should be removed from the filter state. eg. Some boolean-style filters may want to remove the filter value from the table state if the filter value is set to `false`.

#### Using Filter Functions

Filter functions can be used/referenced/defined by passing the following to `columnDefinition.filterFn`:

- A `string` that references a built-in filter function
- A function directly provided to the `columnDefinition.filterFn` option

The final list of filter functions available for the `columnDef.filterFn` option use the following type:

```tsx
export type FilterFnOption<TData extends AnyData> =
  | 'auto'
  | BuiltInFilterFn
  | FilterFn<TData>
```

#### Filter Meta

Filtering data can often expose additional information about the data that can be used to aid other future operations on the same data. A good example of this concept is a ranking-system like that of [`match-sorter`](https://github.com/kentcdodds/match-sorter) that simultaneously ranks, filters and sorts data. While utilities like `match-sorter` make a lot of sense for single-dimensional filter+sort tasks, the decoupled filtering/sorting architecture of building a table makes them very difficult and slow to use.

To make a ranking/filtering/sorting system work with tables, `filterFn`s can optionally mark results with a **filter meta** value that can be used later to sort/group/etc the data to your liking. This is done by calling the `addMeta` function supplied to your custom `filterFn`.

Below is an example using our own `match-sorter-utils` package (a utility fork of `match-sorter`) to rank, filter, and sort the data

```tsx
import { sortingFns } from '@tanstack/react-table'

import { rankItem, compareItems } from '@tanstack/match-sorter-utils'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the ranking info
  addMeta(itemRank)

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const fuzzySort = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]!,
      rowB.columnFiltersMeta[columnId]!
    )
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}
```

## Column Def Options

### `filterFn`

```tsx
filterFn?: FilterFn | keyof FilterFns | keyof BuiltInFilterFns
```

The filter function to use with this column.

Options:

- A `string` referencing a [built-in filter function](#filter-functions))
- A [custom filter function](#filter-functions)

### `enableColumnFilter`

```tsx
enableColumnFilter?: boolean
```

Enables/disables the **column** filter for this column.

## Column API

### `getCanFilter`

```tsx
getCanFilter: () => boolean
```

Returns whether or not the column can be **column** filtered.

### `getFilterIndex`

```tsx
getFilterIndex: () => number
```

Returns the index (including `-1`) of the column filter in the table's `state.columnFilters` array.

### `getIsFiltered`

```tsx
getIsFiltered: () => boolean
```

Returns whether or not the column is currently filtered.

### `getFilterValue`

```tsx
getFilterValue: () => unknown
```

Returns the current filter value of the column.

### `setFilterValue`

```tsx
setFilterValue: (updater: Updater<any>) => void
```

A function that sets the current filter value for the column. You can pass it a value or an updater function for immutability-safe operations on existing values.

### `getAutoFilterFn`

```tsx
getAutoFilterFn: (columnId: string) => FilterFn<TData> | undefined
```

Returns an automatically calculated filter function for the column based off of the columns first known value.

### `getFilterFn`

```tsx
getFilterFn: (columnId: string) => FilterFn<TData> | undefined
```

Returns the filter function (either user-defined or automatic, depending on configuration) for the columnId specified.

## Row API

### `columnFilters`

```tsx
columnFilters: Record<string, boolean>
```

The column filters map for the row. This object tracks whether a row is passing/failing specific filters by their column ID.

### `columnFiltersMeta`

```tsx
columnFiltersMeta: Record<string, any>
```

The column filters meta map for the row. This object tracks any filter meta for a row as optionally provided during the filtering process.

## Table Options

### `filterFns`

```tsx
filterFns?: Record<string, FilterFn>
```

This option allows you to define custom filter functions that can be referenced in a column's `filterFn` option by their key.
Example:

```tsx
declare module '@tanstack/[adapter]-table' {
  interface FilterFns {
    myCustomFilter: FilterFn<unknown>
  }
}

const column = columnHelper.data('key', {
  filterFn: 'myCustomFilter',
})

const table = useReactTable({
  columns: [column],
  filterFns: {
    myCustomFilter: (rows, columnIds, filterValue) => {
      // return the filtered rows
    },
  },
})
```

### `filterFromLeafRows`

```tsx
filterFromLeafRows?: boolean
```

By default, filtering is done from parent rows down (so if a parent row is filtered out, all of its children will be filtered out as well). Setting this option to `true` will cause filtering to be done from leaf rows up (which means parent rows will be included so long as one of their child or grand-child rows is also included).

### `maxLeafRowFilterDepth`

```tsx
maxLeafRowFilterDepth?: number
```

By default, filtering is done for all rows (max depth of 100), no matter if they are root level parent rows or the child leaf rows of a parent row. Setting this option to `0` will cause filtering to only be applied to the root level parent rows, with all sub-rows remaining unfiltered. Similarly, setting this option to `1` will cause filtering to only be applied to child leaf rows 1 level deep, and so on.

This is useful for situations where you want a row's entire child hierarchy to be visible regardless of the applied filter.

### `enableFilters`

```tsx
enableFilters?: boolean
```

Enables/disables all filters for the table.

### `manualFiltering`

```tsx
manualFiltering?: boolean
```

Disables the `getFilteredRowModel` from being used to filter data. This may be useful if your table needs to dynamically support both client-side and server-side filtering.

### `onColumnFiltersChange`

```tsx
onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
```

If provided, this function will be called with an `updaterFn` when `state.columnFilters` changes. This overrides the default internal state management, so you will need to persist the state change either fully or partially outside of the table.

### `enableColumnFilters`

```tsx
enableColumnFilters?: boolean
```

Enables/disables **all** column filters for the table.

### `getFilteredRowModel`

```tsx
getFilteredRowModel?: (
  table: Table<TData>
) => () => RowModel<TData>
```

If provided, this function is called **once** per table and should return a **new function** which will calculate and return the row model for the table when it's filtered.

- For server-side filtering, this function is unnecessary and can be ignored since the server should already return the filtered row model.
- For client-side filtering, this function is required. A default implementation is provided via any table adapter's `{ getFilteredRowModel }` export.

Example:

```tsx
import { getFilteredRowModel } from '@tanstack/[adapter]-table'


  getFilteredRowModel: getFilteredRowModel(),
})
```

## Table API

### `setColumnFilters`

```tsx
setColumnFilters: (updater: Updater<ColumnFiltersState>) => void
```

Sets or updates the `state.columnFilters` state.

### `resetColumnFilters`

```tsx
resetColumnFilters: (defaultState?: boolean) => void
```

Resets the **columnFilters** state to `initialState.columnFilters`, or `true` can be passed to force a default blank state reset to `[]`.

### `getPreFilteredRowModel`

```tsx
getPreFilteredRowModel: () => RowModel<TData>
```

Returns the row model for the table before any **column** filtering has been applied.

### `getFilteredRowModel`

```tsx
getFilteredRowModel: () => RowModel<TData>
```

Returns the row model for the table after **column** filtering has been applied.



### Column Faceting APIs

---
title: Column Faceting APIs
id: column-faceting
---

## Column API

### `getFacetedRowModel`

```tsx
type getFacetedRowModel = () => RowModel<TData>
```

> ⚠️ Requires that you pass a valid `getFacetedRowModel` function to `options.facetedRowModel`. A default implementation is provided via the exported `getFacetedRowModel` function.

Returns the row model with all other column filters applied, excluding its own filter. Useful for displaying faceted result counts.

### `getFacetedUniqueValues`

```tsx
getFacetedUniqueValues: () => Map<any, number>
```

> ⚠️ Requires that you pass a valid `getFacetedUniqueValues` function to `options.getFacetedUniqueValues`. A default implementation is provided via the exported `getFacetedUniqueValues` function.

A function that **computes and returns** a `Map` of unique values and their occurrences derived from `column.getFacetedRowModel`. Useful for displaying faceted result values.

### `getFacetedMinMaxValues`

```tsx
getFacetedMinMaxValues: () => Map<any, number>
```

> ⚠️ Requires that you pass a valid `getFacetedMinMaxValues` function to `options.getFacetedMinMaxValues`. A default implementation is provided via the exported `getFacetedMinMaxValues` function.

A function that **computes and returns** a min/max tuple derived from `column.getFacetedRowModel`. Useful for displaying faceted result values.

## Table Options

### `getColumnFacetedRowModel`

```tsx
getColumnFacetedRowModel: (columnId: string) => RowModel<TData>
```

Returns the faceted row model for a given columnId.

### Column Ordering APIs

---
title: Column Ordering APIs
id: column-ordering
---

## State

Column ordering state is stored on the table using the following shape:

```tsx
export type ColumnOrderTableState = {
  columnOrder: ColumnOrderState
}

export type ColumnOrderState = string[]
```

## Table Options

### `onColumnOrderChange`

```tsx
onColumnOrderChange?: OnChangeFn<ColumnOrderState>
```

If provided, this function will be called with an `updaterFn` when `state.columnOrder` changes. This overrides the default internal state management, so you will need to persist the state change either fully or partially outside of the table.

## Table API

### `setColumnOrder`

```tsx
setColumnOrder: (updater: Updater<ColumnOrderState>) => void
```

Sets or updates the `state.columnOrder` state.

### `resetColumnOrder`

```tsx
resetColumnOrder: (defaultState?: boolean) => void
```

Resets the **columnOrder** state to `initialState.columnOrder`, or `true` can be passed to force a default blank state reset to `[]`.

## Column API

### `getIndex`

```tsx
getIndex: (position?: ColumnPinningPosition) => number
```

Returns the index of the column in the order of the visible columns. Optionally pass a `position` parameter to get the index of the column in a sub-section of the table.

### `getIsFirstColumn`

```tsx
getIsFirstColumn: (position?: ColumnPinningPosition) => boolean
```

Returns `true` if the column is the first column in the order of the visible columns. Optionally pass a `position` parameter to check if the column is the first in a sub-section of the table.

### `getIsLastColumn`

```tsx
getIsLastColumn: (position?: ColumnPinningPosition) => boolean
```

Returns `true` if the column is the last column in the order of the visible columns. Optionally pass a `position` parameter to check if the column is the last in a sub-section of the table.


### Column Pinning APIs

---
title: Column Pinning APIs
id: column-pinning
---

## Can-Pin

The ability for a column to be **pinned** is determined by the following:

- `options.enablePinning` is not set to `false`
- `options.enableColumnPinning` is not set to `false`
- `columnDefinition.enablePinning` is not set to `false`

## State

Pinning state is stored on the table using the following shape:

```tsx
export type ColumnPinningPosition = false | 'left' | 'right'

export type ColumnPinningState = {
  left?: string[]
  right?: string[]
}


export type ColumnPinningTableState = {
  columnPinning: ColumnPinningState
}
```

## Table Options

### `enableColumnPinning`

```tsx
enableColumnPinning?: boolean
```

Enables/disables column pinning for all columns in the table.

### `onColumnPinningChange`

```tsx
onColumnPinningChange?: OnChangeFn<ColumnPinningState>
```

If provided, this function will be called with an `updaterFn` when `state.columnPinning` changes. This overrides the default internal state management, so you will also need to supply `state.columnPinning` from your own managed state.

## Column Def Options

### `enablePinning`

```tsx
enablePinning?: boolean
```

Enables/disables pinning for the column.

## Table API

### `setColumnPinning`

```tsx
setColumnPinning: (updater: Updater<ColumnPinningState>) => void
```

Sets or updates the `state.columnPinning` state.

### `resetColumnPinning`

```tsx
resetColumnPinning: (defaultState?: boolean) => void
```

Resets the **columnPinning** state to `initialState.columnPinning`, or `true` can be passed to force a default blank state reset to `{ left: [], right: [], }`.

### `getIsSomeColumnsPinned`

```tsx
getIsSomeColumnsPinned: (position?: ColumnPinningPosition) => boolean
```

Returns whether or not any columns are pinned. Optionally specify to only check for pinned columns in either the `left` or `right` position.

_Note: Does not account for column visibility_

### `getLeftHeaderGroups`

```tsx
getLeftHeaderGroups: () => HeaderGroup<TData>[]
```

Returns the left pinned header groups for the table.

### `getCenterHeaderGroups`

```tsx
getCenterHeaderGroups: () => HeaderGroup<TData>[]
```

Returns the unpinned/center header groups for the table.

### `getRightHeaderGroups`

```tsx
getRightHeaderGroups: () => HeaderGroup<TData>[]
```

Returns the right pinned header groups for the table.

### `getLeftFooterGroups`

```tsx
getLeftFooterGroups: () => HeaderGroup<TData>[]
```

Returns the left pinned footer groups for the table.

### `getCenterFooterGroups`

```tsx
getCenterFooterGroups: () => HeaderGroup<TData>[]
```

Returns the unpinned/center footer groups for the table.

### `getRightFooterGroups`

```tsx
getRightFooterGroups: () => HeaderGroup<TData>[]
```

Returns the right pinned footer groups for the table.

### `getLeftFlatHeaders`

```tsx
getLeftFlatHeaders: () => Header<TData>[]
```

Returns a flat array of left pinned headers for the table, including parent headers.

### `getCenterFlatHeaders`

```tsx
getCenterFlatHeaders: () => Header<TData>[]
```

Returns a flat array of unpinned/center headers for the table, including parent headers.

### `getRightFlatHeaders`

```tsx
getRightFlatHeaders: () => Header<TData>[]
```

Returns a flat array of right pinned headers for the table, including parent headers.

### `getLeftLeafHeaders`

```tsx
getLeftLeafHeaders: () => Header<TData>[]
```

Returns a flat array of leaf-node left pinned headers for the table.

### `getCenterLeafHeaders`

```tsx
getCenterLeafHeaders: () => Header<TData>[]
```

Returns a flat array of leaf-node unpinned/center headers for the table.

### `getRightLeafHeaders`

```tsx
getRightLeafHeaders: () => Header<TData>[]
```

Returns a flat array of leaf-node right pinned headers for the table.

### `getLeftLeafColumns`

```tsx
getLeftLeafColumns: () => Column<TData>[]
```

Returns all left pinned leaf columns.

### `getRightLeafColumns`

```tsx
getRightLeafColumns: () => Column<TData>[]
```

Returns all right pinned leaf columns.

### `getCenterLeafColumns`

```tsx
getCenterLeafColumns: () => Column<TData>[]
```

Returns all center pinned (unpinned) leaf columns.

## Column API

### `getCanPin`

```tsx
getCanPin: () => boolean
```

Returns whether or not the column can be pinned.

### `getPinnedIndex`

```tsx
getPinnedIndex: () => number
```

Returns the numeric pinned index of the column within a pinned column group.

### `getIsPinned`

```tsx
getIsPinned: () => ColumnPinningPosition
```

Returns the pinned position of the column. (`'left'`, `'right'` or `false`)

### `pin`

```tsx
pin: (position: ColumnPinningPosition) => void
```

Pins a column to the `'left'` or `'right'`, or unpins the column to the center if `false` is passed.

## Row API

### `getLeftVisibleCells`

```tsx
getLeftVisibleCells: () => Cell<TData>[]
```

Returns all left pinned leaf cells in the row.

### `getRightVisibleCells`

```tsx
getRightVisibleCells: () => Cell<TData>[]
```

Returns all right pinned leaf cells in the row.

### `getCenterVisibleCells`

```tsx
getCenterVisibleCells: () => Cell<TData>[]
```

Returns all center pinned (unpinned) leaf cells in the row.


### Column Sizing APIs


---
title: Column Sizing APIs
id: column-sizing
---

## State

Column sizing state is stored on the table using the following shape:

```tsx
export type ColumnSizingTableState = {
  columnSizing: ColumnSizing
  columnSizingInfo: ColumnSizingInfoState
}

export type ColumnSizing = Record<string, number>

export type ColumnSizingInfoState = {
  startOffset: null | number
  startSize: null | number
  deltaOffset: null | number
  deltaPercentage: null | number
  isResizingColumn: false | string
  columnSizingStart: [string, number][]
}
```

## Column Def Options

### `enableResizing`

```tsx
enableResizing?: boolean
```

Enables or disables column resizing for the column.

### `size`

```tsx
size?: number
```

The desired size for the column

### `minSize`

```tsx
minSize?: number
```

The minimum allowed size for the column

### `maxSize`

```tsx
maxSize?: number
```

The maximum allowed size for the column

## Column API

### `getSize`

```tsx
getSize: () => number
```

Returns the current size of the column

### `getStart`

```tsx
getStart: (position?: ColumnPinningPosition) => number
```

Returns the offset measurement along the row-axis (usually the x-axis for standard tables) for the column, measuring the size of all preceding columns.

Useful for sticky or absolute positioning of columns. (e.g. `left` or `transform`)

### `getAfter`

```tsx
getAfter: (position?: ColumnPinningPosition) => number
```

Returns the offset measurement along the row-axis (usually the x-axis for standard tables) for the column, measuring the size of all succeeding columns.

Useful for sticky or absolute positioning of columns. (e.g. `right` or `transform`)

### `getCanResize`

```tsx
getCanResize: () => boolean
```

Returns `true` if the column can be resized.

### `getIsResizing`

```tsx
getIsResizing: () => boolean
```

Returns `true` if the column is currently being resized.

### `resetSize`

```tsx
resetSize: () => void
```

Resets the column size to its initial size.

## Header API

### `getSize`

```tsx
getSize: () => number
```

Returns the size for the header, calculated by summing the size of all leaf-columns that belong to it.

### `getStart`

```tsx
getStart: (position?: ColumnPinningPosition) => number
```

Returns the offset measurement along the row-axis (usually the x-axis for standard tables) for the header. This is effectively a sum of the offset measurements of all preceding headers.

### `getResizeHandler`

```tsx
getResizeHandler: () => (event: unknown) => void
```

Returns an event handler function that can be used to resize the header. It can be used as an:

- `onMouseDown` handler
- `onTouchStart` handler

The dragging and release events are automatically handled for you.

## Table Options

### `enableColumnResizing`

```tsx
enableColumnResizing?: boolean
```

Enables/disables column resizing for \*all columns\*\*.

### `columnResizeMode`

```tsx
columnResizeMode?: 'onChange' | 'onEnd'
```

Determines when the columnSizing state is updated. `onChange` updates the state when the user is dragging the resize handle. `onEnd` updates the state when the user releases the resize handle.

### `columnResizeDirection`

```tsx
columnResizeDirection?: 'ltr' | 'rtl'
```

Enables or disables right-to-left support for resizing the column. defaults to 'ltr'.

### `onColumnSizingChange`

```tsx
onColumnSizingChange?: OnChangeFn<ColumnSizingState>
```

This optional function will be called when the columnSizing state changes. If you provide this function, you will be responsible for maintaining its state yourself. You can pass this state back to the table via the `state.columnSizing` table option.

### `onColumnSizingInfoChange`

```tsx
onColumnSizingInfoChange?: OnChangeFn<ColumnSizingInfoState>
```

This optional function will be called when the columnSizingInfo state changes. If you provide this function, you will be responsible for maintaining its state yourself. You can pass this state back to the table via the `state.columnSizingInfo` table option.

## Table API

### `setColumnSizing`

```tsx
setColumnSizing: (updater: Updater<ColumnSizingState>) => void
```

Sets the column sizing state using an updater function or a value. This will trigger the underlying `onColumnSizingChange` function if one is passed to the table options, otherwise the state will be managed automatically by the table.

### `setColumnSizingInfo`

```tsx
setColumnSizingInfo: (updater: Updater<ColumnSizingInfoState>) => void
```

Sets the column sizing info state using an updater function or a value. This will trigger the underlying `onColumnSizingInfoChange` function if one is passed to the table options, otherwise the state will be managed automatically by the table.

### `resetColumnSizing`

```tsx
resetColumnSizing: (defaultState?: boolean) => void
```

Resets column sizing to its initial state. If `defaultState` is `true`, the default state for the table will be used instead of the initialValue provided to the table.

### `resetHeaderSizeInfo`

```tsx
resetHeaderSizeInfo: (defaultState?: boolean) => void
```

Resets column sizing info to its initial state. If `defaultState` is `true`, the default state for the table will be used instead of the initialValue provided to the table.

### `getTotalSize`

```tsx
getTotalSize: () => number
```

Returns the total size of the table by calculating the sum of the sizes of all leaf-columns.

### `getLeftTotalSize`

```tsx
getLeftTotalSize: () => number
```

If pinning, returns the total size of the left portion of the table by calculating the sum of the sizes of all left leaf-columns.

### `getCenterTotalSize`

```tsx
getCenterTotalSize: () => number
```

If pinning, returns the total size of the center portion of the table by calculating the sum of the sizes of all unpinned/center leaf-columns.

### `getRightTotalSize`

```tsx
getRightTotalSize: () => number
```

If pinning, returns the total size of the right portion of the table by calculating the sum of the sizes of all right leaf-columns.


### Column Visibility APIs

---
title: Column Visibility APIs
id: column-visibility
---

## State

Column visibility state is stored on the table using the following shape:

```tsx
export type VisibilityState = Record<string, boolean>

export type VisibilityTableState = {
  columnVisibility: VisibilityState
}
```

## Column Def Options

### `enableHiding`

```tsx
enableHiding?: boolean
```

Enables/disables hiding the column

## Column API

### `getCanHide`

```tsx
getCanHide: () => boolean
```

Returns whether the column can be hidden

### `getIsVisible`

```tsx
getIsVisible: () => boolean
```

Returns whether the column is visible

### `toggleVisibility`

```tsx
toggleVisibility: (value?: boolean) => void
```

Toggles the column visibility

### `getToggleVisibilityHandler`

```tsx
getToggleVisibilityHandler: () => (event: unknown) => void
```

Returns a function that can be used to toggle the column visibility. This function can be used to bind to an event handler to a checkbox.

## Table Options

### `onColumnVisibilityChange`

```tsx
onColumnVisibilityChange?: OnChangeFn<VisibilityState>
```

If provided, this function will be called with an `updaterFn` when `state.columnVisibility` changes. This overrides the default internal state management, so you will need to persist the state change either fully or partially outside of the table.

### `enableHiding`

```tsx
enableHiding?: boolean
```

Enables/disables hiding of columns.

## Table API

### `getVisibleFlatColumns`

```tsx
getVisibleFlatColumns: () => Column<TData>[]
```

Returns a flat array of columns that are visible, including parent columns.

### `getVisibleLeafColumns`

```tsx
getVisibleLeafColumns: () => Column<TData>[]
```

Returns a flat array of leaf-node columns that are visible.

### `getLeftVisibleLeafColumns`

```tsx
getLeftVisibleLeafColumns: () => Column<TData>[]
```

If column pinning, returns a flat array of leaf-node columns that are visible in the left portion of the table.

### `getRightVisibleLeafColumns`

```tsx
getRightVisibleLeafColumns: () => Column<TData>[]
```

If column pinning, returns a flat array of leaf-node columns that are visible in the right portion of the table.

### `getCenterVisibleLeafColumns`

```tsx
getCenterVisibleLeafColumns: () => Column<TData>[]
```

If column pinning, returns a flat array of leaf-node columns that are visible in the unpinned/center portion of the table.

### `setColumnVisibility`

```tsx
setColumnVisibility: (updater: Updater<VisibilityState>) => void
```

Updates the column visibility state via an updater function or value

### `resetColumnVisibility`

```tsx
resetColumnVisibility: (defaultState?: boolean) => void
```

Resets the column visibility state to the initial state. If `defaultState` is provided, the state will be reset to `{}`

### `toggleAllColumnsVisible`

```tsx
toggleAllColumnsVisible: (value?: boolean) => void
```

Toggles the visibility of all columns

### `getIsAllColumnsVisible`

```tsx
getIsAllColumnsVisible: () => boolean
```

Returns whether all columns are visible

### `getIsSomeColumnsVisible`

```tsx
getIsSomeColumnsVisible: () => boolean
```

Returns whether some columns are visible

### `getToggleAllColumnsVisibilityHandler`

```tsx
getToggleAllColumnsVisibilityHandler: () => ((event: unknown) => void)
```

Returns a handler for toggling the visibility of all columns, meant to be bound to a `input[type=checkbox]` element.

## Row API

### `getVisibleCells`

```tsx
getVisibleCells: () => Cell<TData>[]
```

Returns an array of cells that account for column visibility for the row.

### Global Faceting APIs

---
title: Global Faceting APIs
id: global-faceting
---

## Table API

### `getGlobalFacetedRowModel`

```tsx
getGlobalFacetedRowModel: () => RowModel<TData>
```

Returns the faceted row model for the global filter.

### `getGlobalFacetedUniqueValues`

```tsx
getGlobalFacetedUniqueValues: () => Map<any, number>
```

Returns the faceted unique values for the global filter.

### `getGlobalFacetedMinMaxValues`

```tsx
getGlobalFacetedMinMaxValues: () => [number, number]
```

Returns the faceted min and max values for the global filter.


### Global Filtering APIs

---
title: Global Filtering APIs
id: global-filtering
---

## Can-Filter

The ability for a column to be **globally** filtered is determined by the following:

- The column was defined a valid `accessorKey`/`accessorFn`.
- If provided, `options.getColumnCanGlobalFilter` returns `true` for the given column. If it is not provided, the column is assumed to be globally filterable if the value in the first row is a `string` or `number` type.
- `column.enableColumnFilter` is not set to `false`
- `options.enableColumnFilters` is not set to `false`
- `options.enableFilters` is not set to `false`

## State

Filter state is stored on the table using the following shape:

```tsx
export interface GlobalFilterTableState {
  globalFilter: any
}
```

## Filter Functions

You can use the same filter functions that are available for column filtering for global filtering. See the [Column Filtering](../../guide/column-filtering.md) to learn more about filter functions.

#### Using Filter Functions

Filter functions can be used/referenced/defined by passing the following to `options.globalFilterFn`:

- A `string` that references a built-in filter function
- A function directly provided to the `options.globalFilterFn` option

The final list of filter functions available for the `tableOptions.globalFilterFn` options use the following type:

```tsx
export type FilterFnOption<TData extends AnyData> =
  | 'auto'
  | BuiltInFilterFn
  | FilterFn<TData>
```

#### Filter Meta

Filtering data can often expose additional information about the data that can be used to aid other future operations on the same data. A good example of this concept is a ranking-system like that of [`match-sorter`](https://github.com/kentcdodds/match-sorter) that simultaneously ranks, filters and sorts data. While utilities like `match-sorter` make a lot of sense for single-dimensional filter+sort tasks, the decoupled filtering/sorting architecture of building a table makes them very difficult and slow to use.

To make a ranking/filtering/sorting system work with tables, `filterFn`s can optionally mark results with a **filter meta** value that can be used later to sort/group/etc the data to your liking. This is done by calling the `addMeta` function supplied to your custom `filterFn`.

Below is an example using our own `match-sorter-utils` package (a utility fork of `match-sorter`) to rank, filter, and sort the data

```tsx
import { sortingFns } from '@tanstack/[adapter]-table'

import { rankItem, compareItems } from '@tanstack/match-sorter-utils'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the ranking info
  addMeta(itemRank)

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const fuzzySort = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]!,
      rowB.columnFiltersMeta[columnId]!
    )
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}
```

## Column Def Options

### `enableGlobalFilter`

```tsx
enableGlobalFilter?: boolean
```

Enables/disables the **global** filter for this column.

## Column API

### `getCanGlobalFilter`

```tsx
getCanGlobalFilter: () => boolean
```

Returns whether or not the column can be **globally** filtered.  Set to `false` to disable a column from being scanned during global filtering.

## Row API

### `columnFiltersMeta`

```tsx
columnFiltersMeta: Record<string, any>
```

The column filters meta map for the row. This object tracks any filter meta for a row as optionally provided during the filtering process.

## Table Options

### `filterFns`

```tsx
filterFns?: Record<string, FilterFn>
```

This option allows you to define custom filter functions that can be referenced in a column's `filterFn` option by their key.
Example:

```tsx
declare module '@tanstack/table-core' {
  interface FilterFns {
    myCustomFilter: FilterFn<unknown>
  }
}

const column = columnHelper.data('key', {
  filterFn: 'myCustomFilter',
})

const table = useReactTable({
  columns: [column],
  filterFns: {
    myCustomFilter: (rows, columnIds, filterValue) => {
      // return the filtered rows
    },
  },
})
```

### `filterFromLeafRows`

```tsx
filterFromLeafRows?: boolean
```

By default, filtering is done from parent rows down (so if a parent row is filtered out, all of its children will be filtered out as well). Setting this option to `true` will cause filtering to be done from leaf rows up (which means parent rows will be included so long as one of their child or grand-child rows is also included).

### `maxLeafRowFilterDepth`

```tsx
maxLeafRowFilterDepth?: number
```

By default, filtering is done for all rows (max depth of 100), no matter if they are root level parent rows or the child leaf rows of a parent row. Setting this option to `0` will cause filtering to only be applied to the root level parent rows, with all sub-rows remaining unfiltered. Similarly, setting this option to `1` will cause filtering to only be applied to child leaf rows 1 level deep, and so on.

This is useful for situations where you want a row's entire child hierarchy to be visible regardless of the applied filter.

### `enableFilters`

```tsx
enableFilters?: boolean
```

Enables/disables all filters for the table.

### `manualFiltering`

```tsx
manualFiltering?: boolean
```

Disables the `getFilteredRowModel` from being used to filter data. This may be useful if your table needs to dynamically support both client-side and server-side filtering.

### `getFilteredRowModel`

```tsx
getFilteredRowModel?: (
  table: Table<TData>
) => () => RowModel<TData>
```

If provided, this function is called **once** per table and should return a **new function** which will calculate and return the row model for the table when it's filtered.

- For server-side filtering, this function is unnecessary and can be ignored since the server should already return the filtered row model.
- For client-side filtering, this function is required. A default implementation is provided via any table adapter's `{ getFilteredRowModel }` export.

Example:

```tsx
import { getFilteredRowModel } from '@tanstack/[adapter]-table'

  getFilteredRowModel: getFilteredRowModel(),
})
```

### `globalFilterFn`

```tsx
globalFilterFn?: FilterFn | keyof FilterFns | keyof BuiltInFilterFns
```

The filter function to use for global filtering.

Options:

- A `string` referencing a [built-in filter function](#filter-functions))
- A `string` that references a custom filter functions provided via the `tableOptions.filterFns` option
- A [custom filter function](#filter-functions)

### `onGlobalFilterChange`

```tsx
onGlobalFilterChange?: OnChangeFn<GlobalFilterState>
```

If provided, this function will be called with an `updaterFn` when `state.globalFilter` changes. This overrides the default internal state management, so you will need to persist the state change either fully or partially outside of the table.

### `enableGlobalFilter`

```tsx
enableGlobalFilter?: boolean
```

Enables/disables the global filter for the table.

### `getColumnCanGlobalFilter`

```tsx
getColumnCanGlobalFilter?: (column: Column<TData>) => boolean
```

If provided, this function will be called with the column and should return `true` or `false` to indicate whether this column should be used for global filtering.
This is useful if the column can contain data that is not `string` or `number` (i.e. `undefined`).

## Table API

### `getPreFilteredRowModel`

```tsx
getPreFilteredRowModel: () => RowModel<TData>
```

Returns the row model for the table before any **column** filtering has been applied.

### `getFilteredRowModel`

```tsx
getFilteredRowModel: () => RowModel<TData>
```

Returns the row model for the table after **column** filtering has been applied.

### `setGlobalFilter`

```tsx
setGlobalFilter: (updater: Updater<any>) => void
```

Sets or updates the `state.globalFilter` state.

### `resetGlobalFilter`

```tsx
resetGlobalFilter: (defaultState?: boolean) => void
```

Resets the **globalFilter** state to `initialState.globalFilter`, or `true` can be passed to force a default blank state reset to `undefined`.

### `getGlobalAutoFilterFn`

```tsx
getGlobalAutoFilterFn: (columnId: string) => FilterFn<TData> | undefined
```

Currently, this function returns the built-in `includesString` filter function. In future releases, it may return more dynamic filter functions based on the nature of the data provided.

### `getGlobalFilterFn`

```tsx
getGlobalFilterFn: (columnId: string) => FilterFn<TData> | undefined
```

Returns the global filter function (either user-defined or automatic, depending on configuration) for the table.



### Sorting APIs

---
title: Sorting APIs
id: sorting
---

## State

Sorting state is stored on the table using the following shape:

```tsx
export type SortDirection = 'asc' | 'desc'

export type ColumnSort = {
  id: string
  desc: boolean
}

export type SortingState = ColumnSort[]

export type SortingTableState = {
  sorting: SortingState
}
```

## Sorting Functions

The following sorting functions are built-in to the table core:

- `alphanumeric`
    - Sorts by mixed alphanumeric values without case-sensitivity. Slower, but more accurate if your strings contain numbers that need to be naturally sorted.
- `alphanumericCaseSensitive`
    - Sorts by mixed alphanumeric values with case-sensitivity. Slower, but more accurate if your strings contain numbers that need to be naturally sorted.
- `text`
    - Sorts by text/string values without case-sensitivity. Faster, but less accurate if your strings contain numbers that need to be naturally sorted.
- `textCaseSensitive`
    - Sorts by text/string values with case-sensitivity. Faster, but less accurate if your strings contain numbers that need to be naturally sorted.
- `datetime`
    - Sorts by time, use this if your values are `Date` objects.
- `basic`
    - Sorts using a basic/standard `a > b ? 1 : a < b ? -1 : 0` comparison. This is the fastest sorting function, but may not be the most accurate.

Every sorting function receives 2 rows and a column ID and are expected to compare the two rows using the column ID to return `-1`, `0`, or `1` in ascending order. Here's a cheat sheet:

| Return | Ascending Order |
| ------ | --------------- |
| `-1`   | `a < b`         |
| `0`    | `a === b`       |
| `1`    | `a > b`         |

This is the type signature for every sorting function:

```tsx
export type SortingFn<TData extends AnyData> = {
  (rowA: Row<TData>, rowB: Row<TData>, columnId: string): number
}
```

#### Using Sorting Functions

Sorting functions can be used/referenced/defined by passing the following to `columnDefinition.sortingFn`:

- A `string` that references a built-in sorting function
- A `string` that references a custom sorting functions provided via the `tableOptions.sortingFns` option
- A function directly provided to the `columnDefinition.sortingFn` option

The final list of sorting functions available for the `columnDef.sortingFn` use the following type:

```tsx
export type SortingFnOption<TData extends AnyData> =
  | 'auto'
  | SortingFns
  | BuiltInSortingFns
  | SortingFn<TData>
```

## Column Def Options

### `sortingFn`

```tsx
sortingFn?: SortingFn | keyof SortingFns | keyof BuiltInSortingFns
```

The sorting function to use with this column.

Options:

- A `string` referencing a [built-in sorting function](#sorting-functions))
- A [custom sorting function](#sorting-functions)

### `sortDescFirst`

```tsx
sortDescFirst?: boolean
```

Set to `true` for sorting toggles on this column to start in the descending direction.

### `enableSorting`

```tsx
enableSorting?: boolean
```

Enables/Disables sorting for this column.

### `enableMultiSort`

```tsx
enableMultiSort?: boolean
```

Enables/Disables multi-sorting for this column.

### `invertSorting`

```tsx
invertSorting?: boolean
```

Inverts the order of the sorting for this column. This is useful for values that have an inverted best/worst scale where lower numbers are better, eg. a ranking (1st, 2nd, 3rd) or golf-like scoring

### `sortUndefined`

```tsx
sortUndefined?: 'first' | 'last' | false | -1 | 1 // defaults to 1
```

- `'first'`
    - Undefined values will be pushed to the beginning of the list
- `'last'`
    - Undefined values will be pushed to the end of the list
- `false`
    - Undefined values will be considered tied and need to be sorted by the next column filter or original index (whichever applies)
- `-1`
    - Undefined values will be sorted with higher priority (ascending) (if ascending, undefined will appear on the beginning of the list)
- `1`
    - Undefined values will be sorted with lower priority (descending) (if ascending, undefined will appear on the end of the list)

> NOTE: `'first'` and `'last'` options are new in v8.16.0

## Column API

### `getAutoSortingFn`

```tsx
getAutoSortingFn: () => SortingFn<TData>
```

Returns a sorting function automatically inferred based on the columns values.

### `getAutoSortDir`

```tsx
getAutoSortDir: () => SortDirection
```

Returns a sort direction automatically inferred based on the columns values.

### `getSortingFn`

```tsx
getSortingFn: () => SortingFn<TData>
```

Returns the resolved sorting function to be used for this column

### `getNextSortingOrder`

```tsx
getNextSortingOrder: () => SortDirection | false
```

Returns the next sorting order.

### `getCanSort`

```tsx
getCanSort: () => boolean
```

Returns whether this column can be sorted.

### `getCanMultiSort`

```tsx
getCanMultiSort: () => boolean
```

Returns whether this column can be multi-sorted.

### `getSortIndex`

```tsx
getSortIndex: () => number
```

Returns the index position of this column's sorting within the sorting state

### `getIsSorted`

```tsx
getIsSorted: () => false | SortDirection
```

Returns whether this column is sorted.

### `getFirstSortDir`

```tsx 
getFirstSortDir: () => SortDirection
```

Returns the first direction that should be used when sorting this column.

### `clearSorting`

```tsx
clearSorting: () => void
```

Removes this column from the table's sorting state

### `toggleSorting`

```tsx
toggleSorting: (desc?: boolean, isMulti?: boolean) => void
```

Toggles this columns sorting state. If `desc` is provided, it will force the sort direction to that value. If `isMulti` is provided, it will additivity multi-sort the column (or toggle it if it is already sorted).

### `getToggleSortingHandler`

```tsx
getToggleSortingHandler: () => undefined | ((event: unknown) => void)
```

Returns a function that can be used to toggle this column's sorting state. This is useful for attaching a click handler to the column header.

## Table Options

### `sortingFns`

```tsx
sortingFns?: Record<string, SortingFn>
```

This option allows you to define custom sorting functions that can be referenced in a column's `sortingFn` option by their key.
Example:

```tsx
declare module '@tanstack/table-core' {
  interface SortingFns {
    myCustomSorting: SortingFn<unknown>
  }
}

const column = columnHelper.data('key', {
  sortingFn: 'myCustomSorting',
})

const table = useReactTable({
  columns: [column],
  sortingFns: {
    myCustomSorting: (rowA: any, rowB: any, columnId: any): number =>
      rowA.getValue(columnId).value < rowB.getValue(columnId).value ? 1 : -1,
  },
})
```

### `manualSorting`

```tsx
manualSorting?: boolean
```

Enables manual sorting for the table. If this is `true`, you will be expected to sort your data before it is passed to the table. This is useful if you are doing server-side sorting.

### `onSortingChange`

```tsx
onSortingChange?: OnChangeFn<SortingState>
```

If provided, this function will be called with an `updaterFn` when `state.sorting` changes. This overrides the default internal state management, so you will need to persist the state change either fully or partially outside of the table.

### `enableSorting`

```tsx
enableSorting?: boolean
```

Enables/Disables sorting for the table.

### `enableSortingRemoval`

```tsx
enableSortingRemoval?: boolean
```

Enables/Disables the ability to remove sorting for the table.
- If `true` then changing sort order will circle like: 'none' -> 'desc' -> 'asc' -> 'none' -> ...
- If `false` then changing sort order will circle like: 'none' -> 'desc' -> 'asc' -> 'desc' -> 'asc' -> ...

### `enableMultiRemove`

```tsx
enableMultiRemove?: boolean
```

Enables/disables the ability to remove multi-sorts

### `enableMultiSort`

```tsx
enableMultiSort?: boolean
```

Enables/Disables multi-sorting for the table.

### `sortDescFirst`

```tsx
sortDescFirst?: boolean
```

If `true`, all sorts will default to descending as their first toggle state.

### `getSortedRowModel`

```tsx
getSortedRowModel?: (table: Table<TData>) => () => RowModel<TData>
```

This function is used to retrieve the sorted row model. If using server-side sorting, this function is not required. To use client-side sorting, pass the exported `getSortedRowModel()` from your adapter to your table or implement your own.

### `maxMultiSortColCount`

```tsx
maxMultiSortColCount?: number
```

Set a maximum number of columns that can be multi-sorted.

### `isMultiSortEvent`

```tsx
isMultiSortEvent?: (e: unknown) => boolean
```

Pass a custom function that will be used to determine if a multi-sort event should be triggered. It is passed the event from the sort toggle handler and should return `true` if the event should trigger a multi-sort.

## Table API

### `setSorting`

```tsx
setSorting: (updater: Updater<SortingState>) => void
```

Sets or updates the `state.sorting` state.

### `resetSorting`

```tsx
resetSorting: (defaultState?: boolean) => void
```

Resets the **sorting** state to `initialState.sorting`, or `true` can be passed to force a default blank state reset to `[]`.

### `getPreSortedRowModel`

```tsx
getPreSortedRowModel: () => RowModel<TData>
```

Returns the row model for the table before any sorting has been applied.

### `getSortedRowModel`

```tsx
getSortedRowModel: () => RowModel<TData>
```

Returns the row model for the table after sorting has been applied.

### Grouping APIs

---
title: Grouping APIs
id: grouping
---

## State

Grouping state is stored on the table using the following shape:

```tsx
export type GroupingState = string[]

export type GroupingTableState = {
  grouping: GroupingState
}
```

## Aggregation Functions

The following aggregation functions are built-in to the table core:

- `sum`
    - Sums the values of a group of rows
- `min`
    - Finds the minimum value of a group of rows
- `max`
    - Finds the maximum value of a group of rows
- `extent`
    - Finds the minimum and maximum values of a group of rows
- `mean`
    - Finds the mean/average value of a group of rows
- `median`
    - Finds the median value of a group of rows
- `unique`
    - Finds the unique values of a group of rows
- `uniqueCount`
    - Finds the number of unique values of a group of rows
- `count`
    - Calculates the number of rows in a group

Every grouping function receives:

- A function to retrieve the leaf values of the groups rows
- A function to retrieve the immediate-child values of the groups rows

and should return a value (usually primitive) to build the aggregated row model.

This is the type signature for every aggregation function:

```tsx
export type AggregationFn<TData extends AnyData> = (
  getLeafRows: () => Row<TData>[],
  getChildRows: () => Row<TData>[]
) => any
```

#### Using Aggregation Functions

Aggregation functions can be used/referenced/defined by passing the following to `columnDefinition.aggregationFn`:

- A `string` that references a built-in aggregation function
- A `string` that references a custom aggregation functions provided via the `tableOptions.aggregationFns` option
- A function directly provided to the `columnDefinition.aggregationFn` option

The final list of aggregation functions available for the `columnDef.aggregationFn` use the following type:

```tsx
export type AggregationFnOption<TData extends AnyData> =
  | 'auto'
  | keyof AggregationFns
  | BuiltInAggregationFn
  | AggregationFn<TData>
```

## Column Def Options

### `aggregationFn`

```tsx
aggregationFn?: AggregationFn | keyof AggregationFns | keyof BuiltInAggregationFns
```

The aggregation function to use with this column.

Options:

- A `string` referencing a [built-in aggregation function](#aggregation-functions))
- A [custom aggregation function](#aggregation-functions)

### `aggregatedCell`

```tsx
aggregatedCell?: Renderable<
  {
    table: Table<TData>
    row: Row<TData>
    column: Column<TData>
    cell: Cell<TData>
    getValue: () => any
    renderValue: () => any
  }
>
```

The cell to display each row for the column if the cell is an aggregate. If a function is passed, it will be passed a props object with the context of the cell and should return the property type for your adapter (the exact type depends on the adapter being used).

### `enableGrouping`

```tsx
enableGrouping?: boolean
```

Enables/disables grouping for this column.

### `getGroupingValue`

```tsx
getGroupingValue?: (row: TData) => any
```

Specify a value to be used for grouping rows on this column. If this option is not specified, the value derived from `accessorKey` / `accessorFn` will be used instead.

## Column API

### `aggregationFn`

```tsx
aggregationFn?: AggregationFnOption<TData>
```

The resolved aggregation function for the column.

### `getCanGroup`

```tsx
getCanGroup: () => boolean
```

Returns whether or not the column can be grouped.

### `getIsGrouped`

```tsx
getIsGrouped: () => boolean
```

Returns whether or not the column is currently grouped.

### `getGroupedIndex`

```tsx
getGroupedIndex: () => number
```

Returns the index of the column in the grouping state.

### `toggleGrouping`

```tsx
toggleGrouping: () => void
```

Toggles the grouping state of the column.

### `getToggleGroupingHandler`

```tsx
getToggleGroupingHandler: () => () => void
```

Returns a function that toggles the grouping state of the column. This is useful for passing to the `onClick` prop of a button.

### `getAutoAggregationFn`

```tsx
getAutoAggregationFn: () => AggregationFn<TData> | undefined
```

Returns the automatically inferred aggregation function for the column.

### `getAggregationFn`

```tsx
getAggregationFn: () => AggregationFn<TData> | undefined
```

Returns the aggregation function for the column.

## Row API

### `groupingColumnId`

```tsx
groupingColumnId?: string
```

If this row is grouped, this is the id of the column that this row is grouped by.

### `groupingValue`

```tsx
groupingValue?: any
```

If this row is grouped, this is the unique/shared value for the `groupingColumnId` for all of the rows in this group.

### `getIsGrouped`

```tsx
getIsGrouped: () => boolean
```

Returns whether or not the row is currently grouped.

### `getGroupingValue`

```tsx
getGroupingValue: (columnId: string) => unknown
```

Returns the grouping value for any row and column (including leaf rows).

## Table Options

### `aggregationFns`

```tsx
aggregationFns?: Record<string, AggregationFn>
```

This option allows you to define custom aggregation functions that can be referenced in a column's `aggregationFn` option by their key.
Example:

```tsx
declare module '@tanstack/table-core' {
  interface AggregationFns {
    myCustomAggregation: AggregationFn<unknown>
  }
}

const column = columnHelper.data('key', {
  aggregationFn: 'myCustomAggregation',
})

const table = useReactTable({
  columns: [column],
  aggregationFns: {
    myCustomAggregation: (columnId, leafRows, childRows) => {
      // return the aggregated value
    },
  },
})
```

### `manualGrouping`

```tsx
manualGrouping?: boolean
```

Enables manual grouping. If this option is set to `true`, the table will not automatically group rows using `getGroupedRowModel()` and instead will expect you to manually group the rows before passing them to the table. This is useful if you are doing server-side grouping and aggregation.

### `onGroupingChange`

```tsx
onGroupingChange?: OnChangeFn<GroupingState>
```

If this function is provided, it will be called when the grouping state changes and you will be expected to manage the state yourself. You can pass the managed state back to the table via the `tableOptions.state.grouping` option.

### `enableGrouping`

```tsx
enableGrouping?: boolean
```

Enables/disables grouping for all columns.

### `getGroupedRowModel`

```tsx
getGroupedRowModel?: (table: Table<TData>) => () => RowModel<TData>
```

Returns the row model after grouping has taken place, but no further.

### `groupedColumnMode`

```tsx
groupedColumnMode?: false | 'reorder' | 'remove' // default: `reorder`
```

Grouping columns are automatically reordered by default to the start of the columns list. If you would rather remove them or leave them as-is, set the appropriate mode here.

## Table API

### `setGrouping`

```tsx
setGrouping: (updater: Updater<GroupingState>) => void
```

Sets or updates the `state.grouping` state.

### `resetGrouping`

```tsx
resetGrouping: (defaultState?: boolean) => void
```

Resets the **grouping** state to `initialState.grouping`, or `true` can be passed to force a default blank state reset to `[]`.

### `getPreGroupedRowModel`

```tsx
getPreGroupedRowModel: () => RowModel<TData>
```

Returns the row model for the table before any grouping has been applied.

### `getGroupedRowModel`

```tsx
getGroupedRowModel: () => RowModel<TData>
```

Returns the row model for the table after grouping has been applied.

## Cell API

### `getIsAggregated`

```tsx
getIsAggregated: () => boolean
```

Returns whether or not the cell is currently aggregated.

### `getIsGrouped`

```tsx
getIsGrouped: () => boolean
```

Returns whether or not the cell is currently grouped.

### `getIsPlaceholder`

```tsx
getIsPlaceholder: () => boolean
```

Returns whether or not the cell is currently a placeholder.


### Expanding APIs

---
title: Expanding APIs
id: expanding
---

## State

Expanding state is stored on the table using the following shape:

```tsx
export type ExpandedState = true | Record<string, boolean>

export type ExpandedTableState = {
  expanded: ExpandedState
}
```

## Row API

### `toggleExpanded`

```tsx
toggleExpanded: (expanded?: boolean) => void
```

Toggles the expanded state (or sets it if `expanded` is provided) for the row.

### `getIsExpanded`

```tsx
getIsExpanded: () => boolean
```

Returns whether the row is expanded.

### `getIsAllParentsExpanded`

```tsx
getIsAllParentsExpanded: () => boolean
```

Returns whether all parent rows of the row are expanded.

### `getCanExpand`

```tsx
getCanExpand: () => boolean
```

Returns whether the row can be expanded.

### `getToggleExpandedHandler`

```tsx
getToggleExpandedHandler: () => () => void
```

Returns a function that can be used to toggle the expanded state of the row. This function can be used to bind to an event handler to a button.

## Table Options

### `manualExpanding`

```tsx
manualExpanding?: boolean
```

Enables manual row expansion. If this is set to `true`, `getExpandedRowModel` will not be used to expand rows and you would be expected to perform the expansion in your own data model. This is useful if you are doing server-side expansion.

### `onExpandedChange`

```tsx
onExpandedChange?: OnChangeFn<ExpandedState>
```

This function is called when the `expanded` table state changes. If a function is provided, you will be responsible for managing this state on your own. To pass the managed state back to the table, use the `tableOptions.state.expanded` option.

### `autoResetExpanded`

```tsx
autoResetExpanded?: boolean
```

Enable this setting to automatically reset the expanded state of the table when expanding state changes.

### `enableExpanding`

```tsx
enableExpanding?: boolean
```

Enable/disable expanding for all rows.

### `getExpandedRowModel`

```tsx
getExpandedRowModel?: (table: Table<TData>) => () => RowModel<TData>
```

This function is responsible for returning the expanded row model. If this function is not provided, the table will not expand rows. You can use the default exported `getExpandedRowModel` function to get the expanded row model or implement your own.

### `getIsRowExpanded`

```tsx
getIsRowExpanded?: (row: Row<TData>) => boolean
```

If provided, allows you to override the default behavior of determining whether a row is currently expanded.

### `getRowCanExpand`

```tsx
getRowCanExpand?: (row: Row<TData>) => boolean
```

If provided, allows you to override the default behavior of determining whether a row can be expanded.

### `paginateExpandedRows`

```tsx
paginateExpandedRows?: boolean
```

If `true` expanded rows will be paginated along with the rest of the table (which means expanded rows may span multiple pages).

If `false` expanded rows will not be considered for pagination (which means expanded rows will always render on their parents page. This also means more rows will be rendered than the set page size)

## Table API

### `setExpanded`

```tsx
setExpanded: (updater: Updater<ExpandedState>) => void
```

Updates the expanded state of the table via an update function or value

### `toggleAllRowsExpanded`

```tsx
toggleAllRowsExpanded: (expanded?: boolean) => void
```

Toggles the expanded state for all rows. Optionally, provide a value to set the expanded state to.

### `resetExpanded`

```tsx
resetExpanded: (defaultState?: boolean) => void
```

Reset the expanded state of the table to the initial state. If `defaultState` is provided, the expanded state will be reset to `{}`

### `getCanSomeRowsExpand`

```tsx
getCanSomeRowsExpand: () => boolean
```

Returns whether there are any rows that can be expanded.

### `getToggleAllRowsExpandedHandler`

```tsx
getToggleAllRowsExpandedHandler: () => (event: unknown) => void
```

Returns a handler that can be used to toggle the expanded state of all rows. This handler is meant to be used with an `input[type=checkbox]` element.

### `getIsSomeRowsExpanded`

```tsx
getIsSomeRowsExpanded: () => boolean
```

Returns whether there are any rows that are currently expanded.

### `getIsAllRowsExpanded`

```tsx
getIsAllRowsExpanded: () => boolean
```

Returns whether all rows are currently expanded.

### `getExpandedDepth`

```tsx
getExpandedDepth: () => number
```

Returns the maximum depth of the expanded rows.

### `getExpandedRowModel`

```tsx
getExpandedRowModel: () => RowModel<TData>
```

Returns the row model after expansion has been applied.

### `getPreExpandedRowModel`

```tsx
getPreExpandedRowModel: () => RowModel<TData>
```

Returns the row model before expansion has been applied.


### Pagination APIs

---
title: Pagination APIs
id: pagination
---

## State

Pagination state is stored on the table using the following shape:

```tsx
export type PaginationState = {
  pageIndex: number
  pageSize: number
}

export type PaginationTableState = {
  pagination: PaginationState
}

export type PaginationInitialTableState = {
  pagination?: Partial<PaginationState>
}
```

## Table Options

### `manualPagination`

```tsx
manualPagination?: boolean
```

Enables manual pagination. If this option is set to `true`, the table will not automatically paginate rows using `getPaginationRowModel()` and instead will expect you to manually paginate the rows before passing them to the table. This is useful if you are doing server-side pagination and aggregation.

### `pageCount`

```tsx
pageCount?: number
```

When manually controlling pagination, you can supply a total `pageCount` value to the table if you know it. If you do not know how many pages there are, you can set this to `-1`. Alternatively, you can provide a `rowCount` value and the table will calculate the `pageCount` internally.

### `rowCount`

```tsx
rowCount?: number
```

When manually controlling pagination, you can supply a total `rowCount` value to the table if you know it. `pageCount` will be calculated internally from `rowCount` and `pageSize`.

### `autoResetPageIndex`

```tsx
autoResetPageIndex?: boolean
```

If set to `true`, pagination will be reset to the first page when page-altering state changes eg. `data` is updated, filters change, grouping changes, etc.

> 🧠 Note: This option defaults to `false` if `manualPagination` is set to `true`

### `onPaginationChange`

```tsx
onPaginationChange?: OnChangeFn<PaginationState>
```

If this function is provided, it will be called when the pagination state changes and you will be expected to manage the state yourself. You can pass the managed state back to the table via the `tableOptions.state.pagination` option.

### `getPaginationRowModel`

```tsx
getPaginationRowModel?: (table: Table<TData>) => () => RowModel<TData>
```

Returns the row model after pagination has taken place, but no further.

Pagination columns are automatically reordered by default to the start of the columns list. If you would rather remove them or leave them as-is, set the appropriate mode here.

## Table API

### `setPagination`

```tsx
setPagination: (updater: Updater<PaginationState>) => void
```

Sets or updates the `state.pagination` state.

### `resetPagination`

```tsx
resetPagination: (defaultState?: boolean) => void
```

Resets the **pagination** state to `initialState.pagination`, or `true` can be passed to force a default blank state reset to `[]`.

### `setPageIndex`

```tsx
setPageIndex: (updater: Updater<number>) => void
```

Updates the page index using the provided function or value.

### `resetPageIndex`

```tsx
resetPageIndex: (defaultState?: boolean) => void
```

Resets the page index to its initial state. If `defaultState` is `true`, the page index will be reset to `0` regardless of initial state.

### `setPageSize`

```tsx
setPageSize: (updater: Updater<number>) => void
```

Updates the page size using the provided function or value.

### `resetPageSize`

```tsx
resetPageSize: (defaultState?: boolean) => void
```

Resets the page size to its initial state. If `defaultState` is `true`, the page size will be reset to `10` regardless of initial state.

### `getPageOptions`

```tsx
getPageOptions: () => number[]
```

Returns an array of page options (zero-index-based) for the current page size.

### `getCanPreviousPage`

```tsx
getCanPreviousPage: () => boolean
```

Returns whether the table can go to the previous page.

### `getCanNextPage`

```tsx
getCanNextPage: () => boolean
```

Returns whether the table can go to the next page.

### `previousPage`

```tsx
previousPage: () => void
```

Decrements the page index by one, if possible.

### `nextPage`

```tsx
nextPage: () => void
```

Increments the page index by one, if possible.

### `firstPage`

```tsx
firstPage: () => void
```

Sets the page index to `0`.

### `lastPage`

```tsx
lastPage: () => void
```

Sets the page index to the last available page.

### `getPageCount`

```tsx
getPageCount: () => number
```

Returns the page count. If manually paginating or controlling the pagination state, this will come directly from the `options.pageCount` table option, otherwise it will be calculated from the table data using the total row count and current page size.

### `getPrePaginationRowModel`

```tsx
getPrePaginationRowModel: () => RowModel<TData>
```

Returns the row model for the table before any pagination has been applied.

### `getPaginationRowModel`

```tsx
getPaginationRowModel: () => RowModel<TData>
```

Returns the row model for the table after pagination has been applied.


### Row Pinning APIs

---
title: Row Pinning APIs
id: row-pinning
---

## Can-Pin

The ability for a row to be **pinned** is determined by the following:

- `options.enableRowPinning` resolves to `true`
- `options.enablePinning` is not set to `false`

## State

Pinning state is stored on the table using the following shape:

```tsx
export type RowPinningPosition = false | 'top' | 'bottom'

export type RowPinningState = {
  top?: string[]
  bottom?: string[]
}

export type RowPinningRowState = {
  rowPinning: RowPinningState
}
```

## Table Options

### `enableRowPinning`

```tsx
enableRowPinning?: boolean | ((row: Row<TData>) => boolean)
```

Enables/disables row pinning for all rows in the table.

### `keepPinnedRows`

```tsx
keepPinnedRows?: boolean
```

When `false`, pinned rows will not be visible if they are filtered or paginated out of the table. When `true`, pinned rows will always be visible regardless of filtering or pagination. Defaults to `true`.

### `onRowPinningChange`

```tsx
onRowPinningChange?: OnChangeFn<RowPinningState>
```

If provided, this function will be called with an `updaterFn` when `state.rowPinning` changes. This overrides the default internal state management, so you will also need to supply `state.rowPinning` from your own managed state.

## Table API

### `setRowPinning`

```tsx
setRowPinning: (updater: Updater<RowPinningState>) => void
```

Sets or updates the `state.rowPinning` state.

### `resetRowPinning`

```tsx
resetRowPinning: (defaultState?: boolean) => void
```

Resets the **rowPinning** state to `initialState.rowPinning`, or `true` can be passed to force a default blank state reset to `{}`.

### `getIsSomeRowsPinned`

```tsx
getIsSomeRowsPinned: (position?: RowPinningPosition) => boolean
```

Returns whether or not any rows are pinned. Optionally specify to only check for pinned rows in either the `top` or `bottom` position.

### `getTopRows`

```tsx
getTopRows: () => Row<TData>[]
```

Returns all top pinned rows.

### `getBottomRows`

```tsx
getBottomRows: () => Row<TData>[]
```

Returns all bottom pinned rows.

### `getCenterRows`

```tsx
getCenterRows: () => Row<TData>[]
```

Returns all rows that are not pinned to the top or bottom.

## Row API

### `pin`

```tsx
pin: (position: RowPinningPosition) => void
```

Pins a row to the `'top'` or `'bottom'`, or unpins the row to the center if `false` is passed.

### `getCanPin`

```tsx
getCanPin: () => boolean
```

Returns whether or not the row can be pinned.

### `getIsPinned`

```tsx
getIsPinned: () => RowPinningPosition
```

Returns the pinned position of the row. (`'top'`, `'bottom'` or `false`)

### `getPinnedIndex`

```tsx
getPinnedIndex: () => number
```

Returns the numeric pinned index of the row within a pinned row group.


### Row Selection APIs

---
title: Row Selection APIs
id: row-selection
---

## State

Row selection state is stored on the table using the following shape:

```tsx
export type RowSelectionState = Record<string, boolean>

export type RowSelectionTableState = {
  rowSelection: RowSelectionState
}
```

By default, the row selection state uses the index of each row as the row identifiers. Row selection state can instead be tracked with a custom unique row id by passing in a custom [getRowId](../core/table.md#getrowid) function to the the table.

## Table Options

### `enableRowSelection`

```tsx
enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
```

- Enables/disables row selection for all rows in the table OR
- A function that given a row, returns whether to enable/disable row selection for that row

### `enableMultiRowSelection`

```tsx
enableMultiRowSelection?: boolean | ((row: Row<TData>) => boolean)
```

- Enables/disables multiple row selection for all rows in the table OR
- A function that given a row, returns whether to enable/disable multiple row selection for that row's children/grandchildren

### `enableSubRowSelection`

```tsx
enableSubRowSelection?: boolean | ((row: Row<TData>) => boolean)
```

Enables/disables automatic sub-row selection when a parent row is selected, or a function that enables/disables automatic sub-row selection for each row.

(Use in combination with expanding or grouping features)

### `onRowSelectionChange`

```tsx
onRowSelectionChange?: OnChangeFn<RowSelectionState>
```

If provided, this function will be called with an `updaterFn` when `state.rowSelection` changes. This overrides the default internal state management, so you will need to persist the state change either fully or partially outside of the table.

## Table API

### `getToggleAllRowsSelectedHandler`

```tsx
getToggleAllRowsSelectedHandler: () => (event: unknown) => void
```

Returns a handler that can be used to toggle all rows in the table.

### `getToggleAllPageRowsSelectedHandler`

```tsx
getToggleAllPageRowsSelectedHandler: () => (event: unknown) => void
```

Returns a handler that can be used to toggle all rows on the current page.

### `setRowSelection`

```tsx
setRowSelection: (updater: Updater<RowSelectionState>) => void
```

Sets or updates the `state.rowSelection` state.

### `resetRowSelection`

```tsx
resetRowSelection: (defaultState?: boolean) => void
```

Resets the **rowSelection** state to the `initialState.rowSelection`, or `true` can be passed to force a default blank state reset to `{}`.

### `getIsAllRowsSelected`

```tsx
getIsAllRowsSelected: () => boolean
```

Returns whether or not all rows in the table are selected.

### `getIsAllPageRowsSelected`

```tsx
getIsAllPageRowsSelected: () => boolean
```

Returns whether or not all rows on the current page are selected.

### `getIsSomeRowsSelected`

```tsx
getIsSomeRowsSelected: () => boolean
```

Returns whether or not any rows in the table are selected.

### `getIsSomePageRowsSelected`

```tsx
getIsSomePageRowsSelected: () => boolean
```

Returns whether or not any rows on the current page are selected.

### `toggleAllRowsSelected`

```tsx
toggleAllRowsSelected: (value: boolean) => void
```

Selects/deselects all rows in the table.

### `toggleAllPageRowsSelected`

```tsx
toggleAllPageRowsSelected: (value: boolean) => void
```

Selects/deselects all rows on the current page.

### `getPreSelectedRowModel`

```tsx
getPreSelectedRowModel: () => RowModel<TData>
```

### `getSelectedRowModel`

```tsx
getSelectedRowModel: () => RowModel<TData>
```

### `getFilteredSelectedRowModel`

```tsx
getFilteredSelectedRowModel: () => RowModel<TData>
```

### `getGroupedSelectedRowModel`

```tsx
getGroupedSelectedRowModel: () => RowModel<TData>
```

## Row API

### `getIsSelected`

```tsx
getIsSelected: () => boolean
```

Returns whether or not the row is selected.

### `getIsSomeSelected`

```tsx
getIsSomeSelected: () => boolean
```

Returns whether or not some of the row's sub rows are selected.

### `getIsAllSubRowsSelected`

```tsx
getIsAllSubRowsSelected: () => boolean
```

Returns whether or not all of the row's sub rows are selected.

### `getCanSelect`

```tsx
getCanSelect: () => boolean
```

Returns whether or not the row can be selected.

### `getCanMultiSelect`

```tsx
getCanMultiSelect: () => boolean
```

Returns whether or not the row can multi-select.

### `getCanSelectSubRows`

```tsx
getCanSelectSubRows: () => boolean
```

Returns whether or not the row can select sub rows automatically when the parent row is selected.

### `toggleSelected`

```tsx
toggleSelected: (value?: boolean) => void
```

Selects/deselects the row.

### `getToggleSelectedHandler`

```tsx
getToggleSelectedHandler: () => (event: unknown) => void
```

Returns a handler that can be used to toggle the row.












