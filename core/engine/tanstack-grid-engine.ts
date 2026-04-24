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
    type TableOptions,
    type ColumnDef,
    type Updater,
    type FilterFnOption, type Row, type RowModel, type RowData,

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
    type ColumnFiltersState,
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

type EngineConfig<T extends RowData> = {
    data: T[];
    columns: ColumnDef<T, unknown>[];
} & Omit<
    Partial<TableOptions<T>>,
    'data' | 'columns' | 'state' | 'onStateChange'
> & {
    filterFns?: Record<string, FilterFn<T>>;
    globalFilterFn?: FilterFnOption<T>;
};

// ============================================================================
// Engine
// ============================================================================

export class TanStackGridEngine<T extends RowData> {
    private readonly table: Table<T>;
    private readonly listeners = new Set<GridListener>();
    private notifyScheduled = false;

    private state: TableState;
    private data: T[];
    private columns: ColumnDef<T, unknown>[];

    private static normalizeColumns<TData>(
        columns: ColumnDef<TData, unknown>[],
        prefix = 'col',
    ): ColumnDef<TData, unknown>[] {
        return columns.map((column, index) => {
            const col = column as ColumnDef<TData, unknown> & {
                accessorKey?: string;
                columns?: ColumnDef<TData, unknown>[];
                header?: unknown;
            };

            const path = `${prefix}_${index}`;
            const derivedId =
                col.id ??
                col.accessorKey ??
                (typeof col.header === 'string' ? col.header : undefined) ??
                path;

            return {
                ...column,
                id: String(derivedId),
                columns: col.columns
                    ? TanStackGridEngine.normalizeColumns(col.columns, path)
                    : undefined,
            };
        });
    }

    private static assertUniqueColumnIds<TData>(
        columns: ColumnDef<TData, unknown>[],
        ids = new Set<string>(),
    ) {
        for (const column of columns) {
            const id = String(column.id ?? '');
            if (ids.has(id)) {
                throw new Error(`Duplicate column id "${id}" detected.`);
            }
            ids.add(id);

            const childColumns = (column as ColumnDef<TData, unknown> & {
                columns?: ColumnDef<TData, unknown>[];
            }).columns;
            if (childColumns?.length) {
                TanStackGridEngine.assertUniqueColumnIds(childColumns, ids);
            }
        }
    }

    private static getLeafColumnIds<TData>(
        columns: ColumnDef<TData, unknown>[],
    ): string[] {
        return columns.flatMap((column) => {
            const childColumns = (column as ColumnDef<TData, unknown> & {
                columns?: ColumnDef<TData, unknown>[];
            }).columns;
            return childColumns?.length
                ? TanStackGridEngine.getLeafColumnIds(childColumns)
                : [String(column.id)];
        });
    }

    private static reconcileColumnDrivenState(
        state: TableState,
        leafColumnIds: string[],
    ): TableState {
        const validIds = new Set(leafColumnIds);

        const sanitizeColumnOrder = (currentOrder: string[]): string[] => {
            const nextOrder = currentOrder.filter((id) => validIds.has(id));
            for (const id of leafColumnIds) {
                if (!nextOrder.includes(id)) {
                    nextOrder.push(id);
                }
            }
            return nextOrder;
        };

        return {
            ...state,
            sorting: state.sorting.filter((sort) => validIds.has(sort.id)),
            columnFilters: state.columnFilters.filter((filter) =>
                validIds.has(filter.id),
            ),
            grouping: state.grouping.filter((id) => validIds.has(id)),
            columnVisibility: Object.fromEntries(
                Object.entries(state.columnVisibility).filter(([id]) =>
                    validIds.has(id),
                ),
            ),
            columnSizing: Object.fromEntries(
                Object.entries(state.columnSizing).filter(([id]) =>
                    validIds.has(id),
                ),
            ),
            columnPinning: {
                left: (state.columnPinning.left ?? []).filter((id) =>
                    validIds.has(id),
                ),
                right: (state.columnPinning.right ?? []).filter((id) =>
                    validIds.has(id),
                ),
            },
            columnOrder: sanitizeColumnOrder(state.columnOrder),
        };
    }

    constructor(config: EngineConfig<T>) {
        const {
            data,
            columns,
            filterFns,
            globalFilterFn,
            ...optionOverrides
        } = config;
        this.data = data;

        this.columns = TanStackGridEngine.normalizeColumns(columns);
        TanStackGridEngine.assertUniqueColumnIds(this.columns);

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
            columnOrder: TanStackGridEngine.getLeafColumnIds(this.columns),

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
            ...optionOverrides,

            getRowId: (row: any, index: number) =>
                row.id == null ? String(index) : String(row.id),

            onStateChange: (updater: Updater<TableState>) => {
                this.state = functionalUpdate(updater, this.state);
                this.syncState();
                this.notify();
            },

            renderFallbackValue: config.renderFallbackValue ?? null,

            getCoreRowModel: config.getCoreRowModel ?? getCoreRowModel(),
            getFilteredRowModel: config.getFilteredRowModel ?? getFilteredRowModel(),
            getGroupedRowModel: config.getGroupedRowModel ?? getGroupedRowModel(),
            getSortedRowModel: config.getSortedRowModel ?? getSortedRowModel(),
            getExpandedRowModel: config.getExpandedRowModel ?? getExpandedRowModel(),
            getPaginationRowModel: config.getPaginationRowModel ?? getPaginationRowModel(),
            getFacetedRowModel: config.getFacetedRowModel ?? getFacetedRowModel(),
            getFacetedUniqueValues:
                config.getFacetedUniqueValues ?? getFacetedUniqueValues(),
            getFacetedMinMaxValues:
                config.getFacetedMinMaxValues ?? getFacetedMinMaxValues(),
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

    getOptions(): TableOptions<T> {
        return this.table.options;
    }

    updateOptions(updater: Partial<TableOptions<T>>) {
        const nextData = updater.data ?? this.data;
        const nextColumns = updater.columns
            ? TanStackGridEngine.normalizeColumns(updater.columns)
            : this.columns;

        if (updater.columns) {
            TanStackGridEngine.assertUniqueColumnIds(nextColumns);
        }

        this.data = nextData;
        this.columns = nextColumns;

        if (updater.columns) {
            const nextLeafColumnIds = TanStackGridEngine.getLeafColumnIds(nextColumns);
            this.state = {
                ...this.state,
                columnOrder: nextLeafColumnIds,
            };
            this.state = TanStackGridEngine.reconcileColumnDrivenState(
                this.state,
                nextLeafColumnIds,
            );
        }

        this.table.setOptions((prev) => ({
            ...prev,
            ...updater,
            state: this.state,
            onStateChange: prev.onStateChange,
            data: this.data,
            columns: this.columns,
        }));

        this.notify();
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

    setColumnFilters(updater: Updater<ColumnFiltersState>) {
        this.table.setColumnFilters(updater);
    }

    getColumnFilters(): GridColumnFilter[] {
        return this.table.getState().columnFilters as GridColumnFilter[];
    }

    resetColumnFilters() {
        this.table.resetColumnFilters();
    }

    setGlobalFilter(value: unknown) {
        this.table.setGlobalFilter(value ?? undefined);
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

    getSelectedRowModel(): RowModel<T> {
        return this.table.getSelectedRowModel();
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

    setPageIndex(updater: Updater<number>) {
        this.table.setPageIndex(updater);
    }

    setPageSize(updater: Updater<number>) {
        this.table.setPageSize(updater);
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

    setColumnOrder(updater: Updater<string[]>) {
        this.table.setColumnOrder(updater);
    }

    resetColumnOrder() {
        this.table.resetColumnOrder();
    }

    // ============================================================================
    // DATA
    // ============================================================================

    setData(data: T[]) {
        this.updateOptions({data});
        this.table.setPageIndex(0);
    }

    setColumns(columns: ColumnDef<T, unknown>[]) {
        this.updateOptions({columns});
    }
}

// Type-level merge so engine instances expose full TanStack Table APIs.
// Runtime forwarding is handled by the constructor Proxy above.
export interface TanStackGridEngine<T extends RowData> extends Table<T> {
}
