// ============================================================================
// Grid Engine Types — FINAL V3 (Strict + Full Sync)
// ============================================================================

import type {
    ColumnDef,
    Table,
    TableState,
    Updater,
    RowData,
    SortingState,
    VisibilityState,
    ColumnPinningState,
    RowPinningState,
    GroupingState,
    ExpandedState,
    RowSelectionState,
    ColumnSizingState,
    PaginationState,
    ColumnFiltersState,
    RowModel,
} from '@tanstack/table-core';

// ----------------------------------------------------------------------------
// Shared
// ----------------------------------------------------------------------------

export type GridListener = () => void;
export type GridUpdater<T> = Updater<T>;

export type GridColumnFilter = {
    id: string;
    value: unknown;
};

// ----------------------------------------------------------------------------
// ENGINE TYPE (Proxy Compatible)
// ----------------------------------------------------------------------------

export type GridEngine<TData extends RowData = unknown> =
    TanStackGridEngine<TData> & Table<TData>;

// ----------------------------------------------------------------------------
// ENGINE CONTRACT (ONLY CUSTOM APIS)
// ----------------------------------------------------------------------------

export interface TanStackGridEngine<TData extends RowData = unknown> {
    // Core
    getState(): TableState;

    setState(updater: GridUpdater<TableState>): void;

    reset(): void;

    subscribe(listener: GridListener): () => void;

    getTable(): Table<TData>;

    // Data
    getRows(): GridRow<TData>[];

    setData(data: TData[]): void;

    setColumns(columns: ColumnDef<TData, unknown>[]): void;

    // Sorting
    setSorting(updater: GridUpdater<SortingState>): void;

    getSorting(): SortingState;

    resetSorting(): void;

    // Filtering
    setColumnFilters(updater: GridUpdater<ColumnFiltersState>): void;

    getColumnFilters(): GridColumnFilter[];

    resetColumnFilters(): void;

    setGlobalFilter(value: unknown): void;

    getGlobalFilter(): unknown;

    resetGlobalFilter(force?: boolean): void;

    // Visibility
    setColumnVisibility(updater: GridUpdater<VisibilityState>): void;

    getColumnVisibility(): VisibilityState;

    resetColumnVisibility(): void;

    // Pinning
    setColumnPinning(updater: GridUpdater<ColumnPinningState>): void;

    getColumnPinning(): ColumnPinningState;

    resetColumnPinning(): void;

    setRowPinning(updater: GridUpdater<RowPinningState>): void;

    getRowPinning(): RowPinningState;

    resetRowPinning(): void;

    // Grouping
    setGrouping(updater: GridUpdater<GroupingState>): void;

    getGrouping(): GroupingState;

    resetGrouping(): void;

    // Expanding
    setExpanded(updater: GridUpdater<ExpandedState>): void;

    getExpanded(): ExpandedState;

    resetExpanded(): void;

    toggleAllRowsExpanded(value?: boolean): void;

    // Selection
    setRowSelection(updater: GridUpdater<RowSelectionState>): void;

    getRowSelection(): RowSelectionState;

    resetRowSelection(): void;

    getSelectedRowModel(): RowModel<TData>;

    // Sizing
    setColumnSizing(updater: GridUpdater<ColumnSizingState>): void;

    getColumnSizing(): ColumnSizingState;

    resetColumnSizing(): void;

    // Pagination
    setPagination(updater: GridUpdater<PaginationState>): void;

    getPagination(): PaginationState;

    setPageIndex(updater: GridUpdater<number>): void;

    setPageSize(updater: GridUpdater<number>): void;

    resetPagination(): void;

    // Column Order
    getColumnOrder(): string[];

    setColumnOrder(updater: GridUpdater<string[]>): void;

    resetColumnOrder(): void;
}

// ----------------------------------------------------------------------------
// Row / Cell
// ----------------------------------------------------------------------------

export interface GridRow<TData = unknown> {
    id: string;
    original: TData;

    getCells(): GridCell[];

    getValue(columnId: string): unknown;
}

export interface GridCell {
    id: string;
    columnId: string;
    value: unknown;
    meta?: unknown;
}
