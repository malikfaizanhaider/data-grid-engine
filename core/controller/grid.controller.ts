import type {
    TableState,
    SortingState,
    ColumnFiltersState,
    PaginationState,
    Updater,
    Column,
} from '@tanstack/table-core'
import type {GridConfig} from './grid.controller.types'
import type {GridRow} from "../engine/tanstack-grid-engine.types";
import type {TanStackGridEngine} from "../engine/tanstack-grid-engine";

// ---------------------------------------------
// Controller
// ---------------------------------------------

export class GridController<T extends object> {
    private readonly listeners = new Set<() => void>()
    private unsubscribeFromEngine: (() => void) | null = null
    private version = 0

    // memoization
    private cachedRows: GridRow<T>[] = []
    private lastVersion = -1

    constructor(
        private readonly engine: TanStackGridEngine<T>,
        private readonly config: GridConfig<T>
    ) {
    }

    // =============================================
    // SUBSCRIPTION
    // =============================================

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener)

        if (!this.unsubscribeFromEngine) {
            this.unsubscribeFromEngine = this.engine.subscribe(() => {
                this.invalidateRowsCache()
                this.notify()
            })
        }

        return () => {
            this.listeners.delete(listener)

            if (!this.listeners.size && this.unsubscribeFromEngine) {
                this.unsubscribeFromEngine()
                this.unsubscribeFromEngine = null
            }
        }
    }

    private notify() {
        this.listeners.forEach((l) => l())
    }

    private invalidateRowsCache() {
        this.version++
    }

    // =============================================
    // SNAPSHOT (READ API)
    // =============================================

    getState(): TableState {
        return this.engine.getState()
    }

    getRows(): GridRow<T>[] {
        if (this.lastVersion !== this.version) {
            this.cachedRows = this.engine.getRows()
            this.lastVersion = this.version
        }
        return this.cachedRows
    }

    getColumns(): Column<T, unknown>[] {
        return this.engine.getAllLeafColumns()
    }

    getConfig(): GridConfig<T> {
        return this.config
    }

    // =============================================
    // DERIVED HELPERS
    // =============================================

    getVisibleColumns(): Column<T, unknown>[] {
        return this.getColumns().filter((c) => c.getIsVisible())
    }

    getRowCount(): number {
        return this.getRows().length
    }

    isEmpty(): boolean {
        return this.getRowCount() === 0
    }

    isLoading(): boolean {
        return !!this.config.isLoading
    }

    // =============================================
    // FEATURE FLAGS (from config)
    // =============================================

    isResizable(): boolean {
        return !!this.config.tableLayout?.columnsResizable
    }

    isPinnable(): boolean {
        return !!this.config.tableLayout?.columnsPinnable
    }

    isDraggableColumns(): boolean {
        return !!this.config.tableLayout?.columnsDraggable
    }

    isDraggableRows(): boolean {
        return !!this.config.tableLayout?.rowsDraggable
    }

    isStriped(): boolean {
        return !!this.config.tableLayout?.stripped
    }

    isDense(): boolean {
        return !!this.config.tableLayout?.dense
    }

    // =============================================
    // ACTIONS (WRITE API)
    // =============================================

    setSorting(updater: Updater<SortingState>) {
        this.engine.setSorting(updater)
        this.invalidateRowsCache()
    }

    resetSorting() {
        this.engine.resetSorting()
        this.invalidateRowsCache()
    }

    setFilters(updater: Updater<ColumnFiltersState>) {
        this.engine.setColumnFilters(updater)
        this.invalidateRowsCache()
    }

    resetFilters() {
        this.engine.resetColumnFilters()
        this.invalidateRowsCache()
    }

    setGlobalFilter(value: unknown) {
        this.engine.setGlobalFilter(value)
        this.invalidateRowsCache()
    }

    resetGlobalFilter() {
        this.engine.resetGlobalFilter()
        this.invalidateRowsCache()
    }

    setPagination(updater: Updater<PaginationState>) {
        this.engine.setPagination(updater)
        this.invalidateRowsCache()
    }

    setPageIndex(updater: Updater<number>) {
        this.engine.setPageIndex(updater)
        this.invalidateRowsCache()
    }

    setPageSize(updater: Updater<number>) {
        this.engine.setPageSize(updater)
        this.invalidateRowsCache()
    }

    resetPagination() {
        this.engine.resetPagination()
        this.invalidateRowsCache()
    }

    // =============================================
    // COLUMN CONTROL
    // =============================================

    setColumnVisibility(updater: any) {
        this.engine.setColumnVisibility(updater)
        this.invalidateRowsCache()
    }

    setColumnOrder(updater: Updater<string[]>) {
        this.engine.setColumnOrder(updater)
        this.invalidateRowsCache()
    }

    resetColumnOrder() {
        this.engine.resetColumnOrder()
        this.invalidateRowsCache()
    }

    // =============================================
    // ROW SELECTION
    // =============================================

    setRowSelection(updater: any) {
        this.engine.setRowSelection(updater)
        this.invalidateRowsCache()
    }

    getSelectedRows() {
        return this.engine.getSelectedRowModel().rows
    }

    resetRowSelection() {
        this.engine.resetRowSelection()
        this.invalidateRowsCache()
    }

    // =============================================
    // EVENTS (UI triggers → config callbacks)
    // =============================================

    onRowClick(row: T) {
        this.config.onRowClick?.(row)
    }

    // =============================================
    // SERVER MODE (OPTIONAL BUT READY)
    // =============================================

    async fetchData(
        fetcher: (params: {
            pageIndex: number
            pageSize: number
            sorting?: SortingState
            filters?: ColumnFiltersState
        }) => Promise<{
            data: T[]
            total: number
        }>
    ) {
        const state = this.getState()

        const result = await fetcher({
            pageIndex: state.pagination.pageIndex,
            pageSize: state.pagination.pageSize,
            sorting: state.sorting,
            filters: state.columnFilters,
        })

        this.engine.updateOptions({
            data: result.data,
        })
        this.invalidateRowsCache()
    }
}
