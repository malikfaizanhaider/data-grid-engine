// ============================================================================
// TanStack Grid Engine — engine.ts (FINAL V4.7 ABSOLUTE HARD LOCK)
// Canonical Runtime Authority + Contract Parity + Lifecycle Symmetry
// Event Governance + Reset Integrity + Mutation Safety + Diagnostics Final
// ============================================================================

import type {
    Column,
    ColumnDef,
    Header,
    HeaderGroup,
    Row,
    RowData,
    Table,
    TableOptions,
    TableState,
    Updater,
} from '@tanstack/table-core';

import type {
    GridEngine,
    GridEngineDiagnostics,
    GridEventHandler,
    GridEventKey,
    GridEventUnsubscribe,
    GridExportState,
    GridFeatureKey,
    GridFeatureSnapshot,
    GridFeatureUsage,
    GridMode,
    GridPlugin,
    GridResetScope,
} from './types';

import {GridEventBus} from './events';
import {GridFeaturesManager} from './features';
import {GridPersistenceManager} from './persistence';
import {GridPluginManager} from './plugins';

// ============================================================================
// OPTIONS
// ============================================================================

export interface GridEngineOptions<TData extends RowData> {
    readonly table: Table<TData>;
    readonly data: readonly TData[];
    readonly columns: readonly ColumnDef<TData, unknown>[];
    readonly initialState?: Partial<TableState>;
    readonly features?: ConstructorParameters<typeof GridFeaturesManager>[0];
    readonly plugins?: readonly GridPlugin<TData>[];
}

// ============================================================================
// ENGINE
// ============================================================================

export class TanStackGridEngine<TData extends RowData>
    implements GridEngine<TData> {
    private readonly table: Table<TData>;

    private state: TableState;

    private rows: readonly TData[];

    private columns: readonly ColumnDef<TData, unknown>[];

    private recordCount: number;

    private readonly eventBus: GridEventBus<TData>;

    private readonly features: GridFeaturesManager;

    private readonly persistence: GridPersistenceManager<TData>;

    private readonly plugins: GridPluginManager<TData>;

    private destroyed = false;

    constructor(options: GridEngineOptions<TData>) {
        this.table = options.table;

        this.rows = this.freezeArray(
            options.data,
        );

        this.columns = this.freezeArray(
            options.columns,
        );

        this.recordCount =
            options.data.length;

        this.state = {
            ...this.table.getState(),
            ...options.initialState,
        };

        this.eventBus =
            new GridEventBus<TData>();

        this.features =
            new GridFeaturesManager(
                options.features,
            );

        this.persistence =
            new GridPersistenceManager<TData>(
                this,
            );

        this.plugins =
            new GridPluginManager<TData>(
                this,
            );

        this.syncTable();

        if (
            options.plugins
                ?.length
        ) {
            this.plugins.registerMany(
                options.plugins,
            );
        }
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private assertNotDestroyed(): void {
        if (
            this.destroyed
        ) {
            throw new Error(
                'Grid engine has been destroyed.',
            );
        }
    }

    private freezeArray<T>(
        values: readonly T[],
    ): readonly T[] {
        if (
            Object.isFrozen(
                values,
            )
        ) {
            return values;
        }

        return Object.freeze(
            [
                ...values,
            ],
        );
    }

    private syncTable(
        options?: {
            readonly override?: Partial<TableOptions<TData>>;
        },
    ): void {
        this.table.setOptions(
            (
                previous,
            ) => ({
                ...previous,
                ...options?.override,
                data: this.rows as TData[],
                columns: this.columns as ColumnDef<TData, unknown>[],
                state: this.state,
            }),
        );
    }

    private sanitizeOptionsOverride(
        override: Partial<TableOptions<TData>>,
    ): Partial<TableOptions<TData>> {
        const sanitized = {
            ...override,
        };

        delete sanitized.data;
        delete sanitized.columns;
        delete sanitized.state;
        delete sanitized.onStateChange;

        return sanitized;
    }

    private validateColumns(
        columns: readonly ColumnDef<TData, unknown>[],
    ): readonly ColumnDef<TData, unknown>[] {
        const seenIds = new Set<string>();

        const validateList = (
            defs: readonly ColumnDef<TData, unknown>[],
            path: string,
        ): void => {
            defs.forEach(
                (
                    column,
                    index,
                ) => {
                    const columnPath = `${path}[${index}]`;
                    const nestedColumns =
                        'columns' in column &&
                        Array.isArray(
                            column.columns,
                        )
                            ? (
                                column.columns as readonly ColumnDef<TData, unknown>[]
                            )
                            : undefined;

                    const columnId =
                        typeof column.id ===
                        'string' &&
                        column.id.length > 0
                            ? column.id
                            : 'accessorKey' in
                                      column &&
                                  typeof column.accessorKey ===
                                      'string' &&
                                  column.accessorKey.length > 0
                              ? column.accessorKey
                              : undefined;

                    const hasAccessorFn =
                        'accessorFn' in
                            column &&
                        typeof column.accessorFn ===
                            'function';

                    if (
                        nestedColumns &&
                        hasAccessorFn
                    ) {
                        throw new Error(
                            `Column ${columnPath} cannot define both accessorFn and nested columns.`,
                        );
                    }

                    if (
                        !nestedColumns &&
                        hasAccessorFn &&
                        !columnId
                    ) {
                        throw new Error(
                            `Column ${columnPath} with accessorFn requires a stable id.`,
                        );
                    }

                    if (
                        columnId
                    ) {
                        if (
                            seenIds.has(
                                columnId,
                            )
                        ) {
                            throw new Error(
                                `Duplicate column id detected: "${columnId}".`,
                            );
                        }

                        seenIds.add(
                            columnId,
                        );
                    }

                    if (
                        nestedColumns
                    ) {
                        validateList(
                            nestedColumns,
                            `${columnPath}.columns`,
                        );
                    }
                },
            );
        };

        validateList(
            columns,
            'columns',
        );

        return columns;
    }

    private emitStateChange(
        previous: TableState,
    ): void {
        this.eventBus.emit(
            'stateChange',
            {
                previous,
                current:
                this.state,
            },
        );
    }

    private updateState(
        updater:
            | TableState
            | ((
            previous: Readonly<TableState>,
        ) => TableState),
    ): void {
        const previous =
            this.state;

        this.state =
            typeof updater ===
            'function'
                ? updater(
                    previous,
                )
                : updater;

        this.syncTable();

        this.emitStateChange(
            previous,
        );
    }

    private updateRows(
        nextRows: readonly TData[],
    ): void {
        this.rows =
            this.freezeArray(
                nextRows,
            );

        this.recordCount =
            this.rows.length;

        this.syncTable();

        this.eventBus.emit(
            'dataChange',
            {
                recordCount:
                this.recordCount,
                rows: this.rows,
            },
        );
    }

    private applyTableStateMutation(
        mutate: () => void,
    ): void {
        const previous =
            this.state;

        mutate();

        this.state =
            this.table.getState();

        this.emitStateChange(
            previous,
        );
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    on<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): GridEventUnsubscribe {
        this.assertNotDestroyed();

        return this.eventBus.on(
            event,
            handler,
        );
    }

    off<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): void {
        this.eventBus.off(
            event,
            handler,
        );
    }

    once<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): GridEventUnsubscribe {
        this.assertNotDestroyed();

        return this.eventBus.once(
            event,
            handler,
        );
    }

    // =========================================================================
    // OPTIONS
    // =========================================================================

    getTable(): Table<TData> {
        this.assertNotDestroyed();

        return this.table;
    }

    getOptions(): TableOptions<TData> {
        this.assertNotDestroyed();

        return this.table.options;
    }

    updateOptions(
        updater: Partial<TableOptions<TData>>,
    ): void {
        this.assertNotDestroyed();

        const nextRows =
            updater.data
                ? this.freezeArray(
                    updater.data,
                )
                : undefined;

        const nextColumns =
            updater.columns
                ? this.freezeArray(
                    this.validateColumns(
                        updater.columns,
                    ),
                )
                : undefined;

        const sanitizedUpdater =
            this.sanitizeOptionsOverride(
                updater,
            );

        if ( nextRows ) {
            this.rows =
                nextRows;

            this.recordCount =
                nextRows.length;
        }

        if ( nextColumns ) {
            this.columns =
                nextColumns;
        }

        this.syncTable(
            {
                override:
                    sanitizedUpdater,
            },
        );
    }

    setData(
        data: readonly TData[],
    ): void {
        this.assertNotDestroyed();

        this.updateRows(
            data,
        );
    }

    setColumns(
        columns: readonly ColumnDef<TData, unknown>[],
    ): void {
        this.assertNotDestroyed();

        this.columns =
            this.freezeArray(
                this.validateColumns(
                    columns,
                ),
            );

        this.syncTable();
    }

    // =========================================================================
    // STATE
    // =========================================================================

    getState(): Readonly<TableState> {
        this.assertNotDestroyed();

        return this.state;
    }

    setState(
        updater:
            | TableState
            | ((
            previous: Readonly<TableState>,
        ) => TableState),
    ): void {
        this.assertNotDestroyed();

        this.updateState(
            updater,
        );
    }

    // =========================================================================
    // FEATURE WRAPPERS
    // =========================================================================

    setSorting = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setSorting(
                    updater,
                );
            },
        );

    setColumnFilters = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setColumnFilters(
                    updater,
                );
            },
        );

    setGlobalFilter = (
        value: unknown,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setGlobalFilter(
                    value,
                );
            },
        );

    setPagination = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setPagination(
                    updater,
                );
            },
        );

    setPageIndex = (
        updater: Updater<number>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setPageIndex(
                    updater,
                );
            },
        );

    setPageSize = (
        updater: Updater<number>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setPageSize(
                    updater,
                );
            },
        );

    setRowSelection = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setRowSelection(
                    updater,
                );
            },
        );

    setColumnVisibility = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setColumnVisibility(
                    updater,
                );
            },
        );

    setColumnPinning = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setColumnPinning(
                    updater,
                );
            },
        );

    setRowPinning = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setRowPinning(
                    updater,
                );
            },
        );

    setGrouping = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setGrouping(
                    updater,
                );
            },
        );

    setExpanded = (
        updater: Updater<any>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setExpanded(
                    updater,
                );
            },
        );

    setColumnOrder = (
        updater: Updater<string[]>,
    ) =>
        this.applyTableStateMutation(
            () => {
                this.table.setColumnOrder(
                    updater,
                );
            },
        );

    // =========================================================================
    // FEATURES GOVERNANCE
    // =========================================================================

    getFeatures() {
        return this.features.getFeatures();
    }

    getMode(): GridMode {
        return this.features.getMode();
    }

    getServerConfig() {
        return this.features.getServerConfig();
    }

    isFeatureEnabled(
        feature: GridFeatureKey,
    ): boolean {
        return this.features.isFeatureEnabled(
            feature,
        );
    }

    canUseFeature(
        feature: GridFeatureKey,
    ): GridFeatureUsage {
        return this.features.canUseFeature(
            feature,
        );
    }

    importSnapshot(
        snapshot: Partial<GridFeatureSnapshot>,
    ): void {
        this.assertNotDestroyed();

        const previous =
            this.features.snapshot();

        this.features.importSnapshot(
            snapshot,
        );

        this.eventBus.emit(
            'featureChange',
            {
                previous,
                current:
                    this.features.snapshot(),
            },
        );
    }

    replaceSnapshot(
        snapshot: GridFeatureSnapshot,
    ): void {
        this.assertNotDestroyed();

        const previous =
            this.features.snapshot();

        this.features.replaceSnapshot(
            snapshot,
        );

        this.eventBus.emit(
            'featureChange',
            {
                previous,
                current:
                    this.features.snapshot(),
            },
        );
    }

    // =========================================================================
    // ROW MODELS
    // =========================================================================

    getRows(): readonly TData[] {
        return this.rows;
    }

    getRecordCount(): number {
        return this.recordCount;
    }

    setRecordCount(
        count: number,
    ): void {
        this.recordCount =
            count;
    }

    getRowModel(): readonly Row<TData>[] {
        return this.table.getRowModel()
            .rows;
    }

    getCoreRowModel() {
        return this.table.getCoreRowModel();
    }

    getFilteredRowModel() {
        return this.table.getFilteredRowModel();
    }

    getSortedRowModel() {
        return this.table.getSortedRowModel();
    }

    getGroupedRowModel() {
        return this.table.getGroupedRowModel();
    }

    getExpandedRowModel() {
        return this.table.getExpandedRowModel();
    }

    getPaginationRowModel() {
        return this.table.getPaginationRowModel();
    }

    getSelectedRowModel() {
        return this.table.getSelectedRowModel();
    }

    // =========================================================================
    // RENDERING CONTRACT
    // =========================================================================

    getHeaderGroups(): readonly HeaderGroup<TData>[] {
        return this.table.getHeaderGroups();
    }

    getFooterGroups(): readonly HeaderGroup<TData>[] {
        return this.table.getFooterGroups();
    }

    getFlatHeaders(): readonly Header<TData, unknown>[] {
        return this.table.getFlatHeaders();
    }

    getAllColumns(): readonly Column<TData, unknown>[] {
        return this.table.getAllColumns();
    }

    getAllLeafColumns(): readonly Column<TData, unknown>[] {
        return this.table.getAllLeafColumns();
    }

    getVisibleLeafColumns(): readonly Column<TData, unknown>[] {
        return this.table.getVisibleLeafColumns();
    }

    getColumn(
        columnId: string,
    ): Column<TData, unknown> | undefined {
        return this.table.getColumn(
            columnId,
        );
    }

    getRow(
        rowId: string,
    ): Row<TData> | undefined {
        return this.table.getRowModel()
            .rowsById[
            rowId
            ];
    }

    // =========================================================================
    // MUTATIONS
    // =========================================================================

    addRow(
        row: TData,
    ): void {
        this.updateRows(
            [
                ...this.rows,
                row,
            ],
        );
    }

    updateRow(
        rowId: string,
        updater: (
            currentRow: TData,
        ) => TData,
    ): void {
        this.updateRows(
            this.rows.map(
                (
                    row,
                    index,
                ) =>
                    String(
                        index,
                    ) === rowId
                        ? updater(
                            row,
                        )
                        : row,
            ),
        );
    }

    // Replace ONLY this patchRow body:

    patchRow(
        rowId: string,
        patch: Partial<TData>,
    ): void {
        this.updateRow(
            rowId,
            (
                current,
            ) => {
                if (
                    typeof current !==
                    'object' ||
                    current === null
                ) {
                    throw new Error(
                        'patchRow requires object-compatible row data.',
                    );
                }

                return {
                    ...(current as Record<
                        string,
                        unknown
                    >),
                    ...(patch as Record<
                        string,
                        unknown
                    >),
                } as TData;
            },
        );
    }

    removeRow(
        rowId: string,
    ): void {
        this.updateRows(
            this.rows.filter(
                (
                    _,
                    index,
                ) =>
                    String(
                        index,
                    ) !== rowId,
            ),
        );
    }

    replaceRow(
        rowId: string,
        row: TData,
    ): void {
        this.updateRows(
            this.rows.map(
                (
                    current,
                    index,
                ) =>
                    String(
                        index,
                    ) === rowId
                        ? row
                        : current,
            ),
        );
    }

    // =========================================================================
    // RESET
    // =========================================================================

    reset(
        scope: GridResetScope = 'all',
    ): void {
        this.assertNotDestroyed();

        switch (scope) {
            case 'all':
                this.table.reset();
                this.features.reset();
                this.plugins.reset();
                this.state =
                    this.table.getState();
                this.eventBus.emit(
                    'reset',
                    {
                        scope,
                    },
                );
                break;

            case 'state':
                this.table.reset();
                this.state =
                    this.table.getState();
                this.eventBus.emit(
                    'reset',
                    {
                        scope,
                    },
                );
                break;

            case 'features':
                this.features.reset();
                this.eventBus.emit(
                    'reset',
                    {
                        scope,
                    },
                );
                break;

            case 'plugins':
                this.plugins.reset();
                this.eventBus.emit(
                    'reset',
                    {
                        scope,
                    },
                );
                break;

            case 'events':
                this.eventBus.reset();
                break;
        }

        this.syncTable();
    }

    // =========================================================================
    // PERSISTENCE
    // =========================================================================

    exportState(): GridExportState {
        return this.persistence.exportState();
    }

    importState(
        snapshot: Parameters<
            GridPersistenceManager<TData>['importState']
        >[0],
    ): void {
        this.assertNotDestroyed();

        this.persistence.importState(
            snapshot,
        );
    }

    registerPlugin(
        plugin: GridPlugin<TData>,
    ): void {
        this.assertNotDestroyed();

        this.plugins.register(
            plugin,
        );
    }

    unregisterPlugin(
        name: string,
    ): void {
        this.assertNotDestroyed();

        this.plugins.unregister(
            name,
        );
    }

    persistenceDiagnostics(): ReturnType<
        GridPersistenceManager<TData>['diagnostics']
    > {
        this.assertNotDestroyed();

        return this.persistence.diagnostics();
    }

    pluginDiagnostics(): ReturnType<
        GridPluginManager<TData>['diagnostics']
    > {
        this.assertNotDestroyed();

        return this.plugins.diagnostics();
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridEngineDiagnostics<TData> {
        return Object.freeze(
            {
                mode:
                    this.getMode(),
                recordCount:
                    this.getRecordCount(),
                features:
                    this.features.diagnostics(),
                plugins:
                    this.plugins.diagnostics(),
                events:
                    this.eventBus.diagnostics(),
            },
        );
    }

    // =========================================================================
    // DESTROY
    // =========================================================================

    destroy(): void {
        if (
            this.destroyed
        ) {
            return;
        }

        this.plugins.destroy();

        this.eventBus.emit(
            'reset',
            {
                scope: 'all',
            },
        );

        this.eventBus.destroy();

        this.destroyed =
            true;
    }
}
