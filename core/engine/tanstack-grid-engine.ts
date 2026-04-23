// ============================================================================
// TanStack Grid Engine — V3 FINAL (Strict + Full Sync + Proxy)
// ============================================================================

import {
    createTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getGroupedRowModel,
    getExpandedRowModel,
    functionalUpdate,

    type Table,
    type TableState,
    type ColumnDef,
    type Updater,
    type FilterFnOption,
    type Row,

    // State types
    type VisibilityState,
    type ColumnPinningState,
    type RowPinningState,
    type GroupingState,
    type ExpandedState,
    type RowSelectionState,
    type ColumnSizingState,
    type PaginationState,
    type SortingState,
    type FilterFn,
} from '@tanstack/table-core';

import type {
    GridRow,
    GridListener,
    GridColumnFilter,
} from './tanstack-grid-engine.types';

// ============================================================================
// Config
// ============================================================================

type EngineConfig<T> = {
    data: T[];
    columns: ColumnDef<T, unknown>[];
    filterFns?: Record<string, FilterFn<T>>;
    globalFilterFn?: FilterFnOption<T>;
};

// ============================================================================
// Engine
// ============================================================================

export class TanStackGridEngine<T> {
    private readonly table: Table<T>;
    private readonly listeners = new Set<GridListener>();
    private notifyScheduled = false;

    private state: TableState;
    private data: T[];
    private columns: ColumnDef<T, unknown>[];

    constructor({data, columns, filterFns, globalFilterFn}: EngineConfig<T>) {
        this.data = data;

        // ✅ stable IDs
        this.columns = columns.map((col, i) => ({
            ...col,
            id: col.id ?? (col as any).accessorKey ?? `col_${i}`,
        }));

        this.state = {
            sorting: [],
            columnFilters: [],
            globalFilter: undefined,
            rowSelection: {},

            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },

            columnVisibility: {},
            columnOrder: this.columns.map((c: any) => c.id),

            columnPinning: {left: [], right: []},
            rowPinning: {top: [], bottom: []},

            grouping: [],
            expanded: {},

            columnSizing: {},
            columnSizingInfo: {} as any,
        };

        this.table = createTable<T>({
            data: this.data,
            columns: this.columns,
            state: this.state,
            filterFns,
            globalFilterFn: globalFilterFn ?? 'includesString',

            getRowId: (row: any, index: number) =>
                row.id == null ? String(index) : String(row.id),

            onStateChange: (updater: Updater<TableState>) => {
                this.state = functionalUpdate(updater, this.state);
                this.syncState();
                this.notify();
            },

            renderFallbackValue: null,

            getCoreRowModel: getCoreRowModel(),
            getSortedRowModel: getSortedRowModel(),
            getFilteredRowModel: getFilteredRowModel(),
            getPaginationRowModel: getPaginationRowModel(),
            getFacetedRowModel: getFacetedRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues(),
            getFacetedMinMaxValues: getFacetedMinMaxValues(),
            getGroupedRowModel: getGroupedRowModel(),
            getExpandedRowModel: getExpandedRowModel(),
            debugTable: true,
            debugHeaders: true,
            debugColumns: true,
        });

        // 🔥 PROXY
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) return (target as any)[prop];

                const table = target.table as any;

                if (prop in table) {
                    const value = table[prop];
                    return typeof value === 'function' ? value.bind(table) : value;
                }

                return undefined;
            },
        });
    }

    // ============================================================================
    // INTERNAL
    // ============================================================================

    private syncState() {
        this.table.setOptions((prev) => ({
            ...prev,
            state: this.state,
        }));
    }

    private notify() {
        if (this.notifyScheduled) return;

        this.notifyScheduled = true;

        queueMicrotask(() => {
            this.listeners.forEach((l) => l());
            this.notifyScheduled = false;
        });
    }

    // ============================================================================
    // CORE
    // ============================================================================

    subscribe(listener: GridListener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    getState(): TableState {
        return this.state;
    }

    setState(updater: Updater<TableState>) {
        this.table.setState(updater);
    }

    reset() {
        this.table.reset();
    }

    getTable(): Table<T> {
        return this.table;
    }

    // ============================================================================
    // ROW HELPERS
    // ============================================================================

    private mapRows(rows: Row<T>[]): GridRow<T>[] {
        return rows.map((row) => ({
            id: row.id,
            original: row.original,
            getValue: (id: string) => row.getValue(id),
            getCells: () =>
                row.getVisibleCells().map((cell) => ({
                    id: cell.id,
                    columnId: cell.column.id,
                    value: cell.getValue(),
                    meta: cell.column.columnDef.meta ?? {},
                })),
        }));
    }

    getRows(): GridRow<T>[] {
        return this.mapRows(this.table.getRowModel().rows);
    }

    // ============================================================================
    // SORTING
    // ============================================================================

    setSorting(updater: Updater<SortingState>) {
        this.table.setSorting(updater);
    }

    getSorting(): SortingState {
        return this.table.getState().sorting;
    }

    resetSorting() {
        this.table.resetSorting();
    }

    // ============================================================================
    // FILTERING
    // ============================================================================

    setColumnFilters(filters: GridColumnFilter[]) {
        this.table.setColumnFilters(filters);
    }

    getColumnFilters(): GridColumnFilter[] {
        return this.table.getState().columnFilters as GridColumnFilter[];
    }

    resetColumnFilters() {
        this.table.resetColumnFilters();
    }

    setGlobalFilter(value: unknown) {
        this.table.setGlobalFilter(value || undefined);
        this.table.setPageIndex(0);
    }

    getGlobalFilter(): unknown {
        return this.table.getState().globalFilter;
    }

    resetGlobalFilter(force?: boolean) {
        this.table.resetGlobalFilter(force);
    }

    // ============================================================================
    // VISIBILITY
    // ============================================================================

    setColumnVisibility(updater: Updater<VisibilityState>) {
        this.table.setColumnVisibility(updater);
    }

    getColumnVisibility(): VisibilityState {
        return this.table.getState().columnVisibility;
    }

    resetColumnVisibility() {
        this.table.resetColumnVisibility();
    }

    // ============================================================================
    // PINNING
    // ============================================================================

    setColumnPinning(updater: Updater<ColumnPinningState>) {
        this.table.setColumnPinning(updater);
    }

    getColumnPinning(): ColumnPinningState {
        return this.table.getState().columnPinning;
    }

    resetColumnPinning() {
        this.table.resetColumnPinning();
    }

    setRowPinning(updater: Updater<RowPinningState>) {
        this.table.setRowPinning(updater);
    }

    getRowPinning(): RowPinningState {
        return this.table.getState().rowPinning;
    }

    resetRowPinning() {
        this.table.resetRowPinning();
    }

    // ============================================================================
    // GROUPING
    // ============================================================================

    setGrouping(updater: Updater<GroupingState>) {
        this.table.setGrouping(updater);
    }

    getGrouping(): GroupingState {
        return this.table.getState().grouping;
    }

    resetGrouping() {
        this.table.resetGrouping();
    }

    // ============================================================================
    // EXPANDING
    // ============================================================================

    setExpanded(updater: Updater<ExpandedState>) {
        this.table.setExpanded(updater);
    }

    getExpanded(): ExpandedState {
        return this.table.getState().expanded;
    }

    resetExpanded() {
        this.table.resetExpanded();
    }

    toggleAllRowsExpanded(value?: boolean) {
        this.table.toggleAllRowsExpanded(value);
    }

    // ============================================================================
    // SELECTION
    // ============================================================================

    setRowSelection(updater: Updater<RowSelectionState>) {
        this.table.setRowSelection(updater);
    }

    getRowSelection(): RowSelectionState {
        return this.table.getState().rowSelection;
    }

    resetRowSelection() {
        this.table.resetRowSelection();
    }

    getSelectedRowModel(): GridRow<T>[] {
        return this.mapRows(this.table.getSelectedRowModel().rows);
    }

    // ============================================================================
    // SIZING
    // ============================================================================

    setColumnSizing(updater: Updater<ColumnSizingState>) {
        this.table.setColumnSizing(updater);
    }

    getColumnSizing(): ColumnSizingState {
        return this.table.getState().columnSizing;
    }

    resetColumnSizing() {
        this.table.resetColumnSizing();
    }

    // ============================================================================
    // PAGINATION
    // ============================================================================

    setPagination(updater: Updater<PaginationState>) {
        this.table.setPagination(updater);
    }

    getPagination(): PaginationState {
        return this.table.getState().pagination;
    }

    setPageIndex(index: number) {
        this.table.setPageIndex(index);
    }

    setPageSize(size: number) {
        this.table.setPageSize(size);
    }

    resetPagination() {
        this.table.resetPagination();
    }

    // ============================================================================
    // COLUMN ORDER
    // ============================================================================

    getColumnOrder(): string[] {
        return this.table.getState().columnOrder;
    }

    setColumnOrder(order: string[]) {
        this.table.setColumnOrder(order);
    }

    resetColumnOrder() {
        this.table.resetColumnOrder();
    }

    // ============================================================================
    // DATA
    // ============================================================================

    setData(data: T[]) {
        this.data = data;

        this.table.setOptions((prev) => ({
            ...prev,
            data: this.data,
        }));

        this.table.setPageIndex(0);
        this.notify();
    }

    setColumns(columns: ColumnDef<T, unknown>[]) {
        this.columns = columns.map((col, i) => ({
            ...col,
            id: col.id ?? (col as any).accessorKey ?? `col_${i}`,
        }));

        this.table.setOptions((prev) => ({
            ...prev,
            columns: this.columns,
        }));

        this.notify();
    }
}

// Type-level merge so engine instances expose full TanStack Table APIs.
// Runtime forwarding is handled by the constructor Proxy above.
export interface TanStackGridEngine<T> extends Table<T> {}
