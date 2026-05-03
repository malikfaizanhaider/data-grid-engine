- [core.ts](../grid/base/core.ts)
- [events.ts](../grid/base/events.ts)
- [faceting.ts](../grid/base/faceting.ts)
- [features.ts](../grid/base/features.ts)
- [engine.ts](../grid/base/engine.ts)
- [index.ts](../grid/base/index.ts)
- [mutations.ts](../grid/base/mutations.ts)
- [persistence.ts](../grid/base/persistence.ts)
- [plugins.ts](../grid/base/plugins.ts)
- [render-utils.ts](../grid/base/render-utils.ts)
- [rendering.ts](../grid/base/rendering.ts)
- [server.ts](../grid/base/server.ts)
- [types.ts](../grid/base/types.ts)

```typescript
// ============================================================================
// TanStack Grid Engine — core.ts (FINAL V4.7 ABSOLUTE HARD LOCK)
// Enterprise Unified Façade + Micro-Gap Refinement Pass
// Engine Authority + External Composition + Governance Polish
// ============================================================================

import type {
    ColumnDef,
    RowData,
    Table,
    TableState,
} from '@tanstack/table-core';

import type {
    GridFeatureConfig,
    GridPlugin,
} from './types';

import {
    TanStackGridEngine,
} from './engine';

import {
    GridRenderingManager,
    type GridRenderableCell,
    type GridRenderableFooter,
    type GridRenderableHeader,
    type GridRenderableRow,
} from './rendering';

import {
    GridMutationManager,
} from './mutations';

import {
    GridServerManager,
    type GridServerAdapter,
    type GridServerTransforms,
} from './server';

import {
    GridFacetingManager,
} from './faceting';

import {
    type GridPersistenceOptions,
} from './persistence';

// ============================================================================
// TYPES
// ============================================================================

type GridDestroyable = {
    destroy: () => void;
};

export interface GridCoreOptions<TData extends RowData> {
    readonly table: Table<TData>;
    readonly data: readonly TData[];
    readonly columns: readonly ColumnDef<TData, unknown>[];

    readonly getRowId: (
        row: TData,
    ) => string;

    readonly initialState?: Partial<TableState>;

    readonly features?: Partial<GridFeatureConfig>;

    readonly plugins?: readonly GridPlugin<TData>[];

    readonly server?: GridServerAdapter<TData>;

    readonly serverTransforms?: GridServerTransforms<TData>;

    readonly persistence?: GridPersistenceOptions;

    readonly strict?: boolean;

    readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface GridCoreDiagnostics<TData extends RowData> {
    readonly engine: ReturnType<
        TanStackGridEngine<TData>['diagnostics']
    >;

    readonly rendering: ReturnType<
        GridRenderingManager<TData>['diagnostics']
    >;

    readonly mutations: ReturnType<
        GridMutationManager<TData>['diagnostics']
    >;

    readonly faceting: ReturnType<
        GridFacetingManager<TData>['diagnostics']
    >;

    readonly persistence: ReturnType<
        TanStackGridEngine<TData>['persistenceDiagnostics']
    >;

    readonly plugins: ReturnType<
        TanStackGridEngine<TData>['pluginDiagnostics']
    >;

    readonly server?: ReturnType<
        GridServerManager<TData>['diagnostics']
    >;
}

// ============================================================================
// CORE
// ============================================================================

export class GridCore<TData extends RowData> {
    private static readonly EMPTY_ARRAY =
        Object.freeze(
            [],
        ) as readonly unknown[];

    private readonly engine: TanStackGridEngine<TData>;

    private readonly rendering: GridRenderingManager<TData>;

    private readonly mutations: GridMutationManager<TData>;

    private readonly faceting: GridFacetingManager<TData>;

    private readonly server?: GridServerManager<TData>;

    private readonly metadata?: Readonly<Record<string, unknown>>;

    private destroyed = false;

    constructor(
        options: GridCoreOptions<TData>,
    ) {
        this.metadata =
            options.metadata;

        // =========================================================================
        // ENGINE (CANONICAL AUTHORITY)
        // =========================================================================

        this.engine =
            new TanStackGridEngine<TData>(
                {
                    table:
                    options.table,

                    data:
                        this.freezeArray(
                            options.data,
                        ),

                    columns:
                        this.freezeArray(
                            options.columns,
                        ),

                    initialState:
                    options.initialState,

                    features:
                        options.features
                            ? {
                                features:
                                options.features,
                            }
                            : undefined,

                    plugins:
                        options.plugins,

                    persistence:
                        options.persistence,

                    pluginManager:
                        {
                            strict:
                                options.strict,
                        },
                },
            );

        // =========================================================================
        // RENDERING
        // =========================================================================

        this.rendering =
            new GridRenderingManager<TData>(
                this.engine.getTable(),
            );

        // =========================================================================
        // MUTATIONS
        // =========================================================================

        this.mutations =
            new GridMutationManager<TData>(
                {
                    engine:
                    this.engine,

                    getRowId:
                    options.getRowId,
                },
            );

        // =========================================================================
        // FACETING
        // =========================================================================

        this.faceting =
            new GridFacetingManager<TData>(
                {
                    engine:
                    this.engine,
                },
            );


        // =========================================================================
        // OPTIONAL SERVER
        // =========================================================================

        if (options.server) {
            this.server =
                new GridServerManager<TData>(
                    {
                        engine:
                        this.engine,

                        adapter:
                        options.server,

                        transformQuery:
                        options
                            .serverTransforms
                            ?.transformQuery,

                        transformResult:
                        options
                            .serverTransforms
                            ?.transformResult,
                    },
                );
        }
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    private emptyArray<T>(): readonly T[] {
        return GridCore.EMPTY_ARRAY as readonly T[];
    }

    private freezeArray<T>(
        values: readonly T[],
    ): readonly T[] {
        if (
            values.length ===
            0
        ) {
            return this.emptyArray();
        }

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

    private isDestroyable(
        value: unknown,
    ): value is GridDestroyable {
        return (
            typeof value ===
            'object' &&
            value !== null &&
            'destroy' in
            value &&
            typeof (
                value as {
                    destroy?: unknown;
                }
            ).destroy ===
            'function'
        );
    }

    private assertActive(): void {
        if (
            this.destroyed
        ) {
            throw new Error(
                'GridCore has been destroyed.',
            );
        }
    }

    private requireServer(): GridServerManager<TData> {
        if (
            !this.server
        ) {
            throw new Error(
                'Server subsystem is not configured.',
            );
        }

        return this.server;
    }

    // =========================================================================
    // GOVERNANCE
    // =========================================================================

    getTable(): Table<TData> {
        this.assertActive();

        return this.engine.getTable();
    }

    getEngine(): TanStackGridEngine<TData> {
        this.assertActive();

        return this.engine;
    }

    getFeatures():
        ReturnType<
            TanStackGridEngine<TData>['getFeatures']
        > {
        this.assertActive();

        return this.engine.getFeatures();
    }

    canUseFeature(
        feature: Parameters<
            TanStackGridEngine<TData>['canUseFeature']
        >[0],
    ): ReturnType<
        TanStackGridEngine<TData>['canUseFeature']
    > {
        this.assertActive();

        return this.engine.canUseFeature(
            feature,
        );
    }

    // =========================================================================
    // METADATA
    // =========================================================================

    getMetadata():
        | Readonly<Record<string, unknown>>
        | undefined {
        this.assertActive();

        return this.metadata;
    }

    // =========================================================================
    // ENGINE
    // =========================================================================

    getState(): Readonly<TableState> {
        this.assertActive();

        return this.engine.getState();
    }

    setState(
        state:
            | TableState
            | ((
            previous: Readonly<TableState>,
        ) => TableState),
    ): void {
        this.assertActive();

        this.engine.setState(
            state,
        );
    }

    getRows(): readonly TData[] {
        this.assertActive();

        return this.engine.getRows();
    }

    getColumns(): readonly ColumnDef<TData, unknown>[] {
        this.assertActive();

        return this.freezeArray(
            this.engine
                .getAllColumns()
                .map(
                    (
                        column,
                    ) =>
                        column.columnDef,
                ),
        );
    }

    getRecordCount(): number {
        this.assertActive();

        return this.engine.getRecordCount();
    }

    reset(): void {
        this.assertActive();

        this.engine.reset(
            'all',
        );

        this.server?.cancel();
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    getHeaderGroups():
        readonly (readonly GridRenderableHeader<TData>[])[] {
        this.assertActive();

        return this.rendering.getHeaderGroups();
    }

    getFooterGroups():
        readonly (readonly GridRenderableFooter<TData>[])[] {
        this.assertActive();

        return this.rendering.getFooterGroups();
    }

    getVisibleRows():
        readonly GridRenderableRow<TData>[] {
        this.assertActive();

        return this.rendering.getVisibleRows();
    }

    getVisibleCells(
        rowId: string,
    ): readonly GridRenderableCell<TData>[] {
        this.assertActive();

        return this.rendering.getVisibleCells(
            rowId,
        );
    }

    // =========================================================================
    // MUTATIONS
    // =========================================================================

    setData(
        rows: readonly TData[],
    ): void {
        this.assertActive();

        this.mutations.setData(
            rows,
        );
    }

    replaceRows(
        rows: readonly TData[],
    ): void {
        this.assertActive();

        this.mutations.replaceRows(
            rows,
        );
    }

    replaceRow(
        rowId: string,
        row: TData,
    ): boolean {
        this.assertActive();

        return this.mutations.replaceRow(
            rowId,
            row,
        );
    }

    patchRow(
        rowId: string,
        patch: Partial<TData>,
    ): boolean {
        this.assertActive();

        return this.mutations.patchRow(
            rowId,
            patch,
        );
    }

    updateRow(
        rowId: string,
        updater: (
            current: TData,
        ) => TData,
    ): boolean {
        this.assertActive();

        return this.mutations.updateRow(
            rowId,
            updater,
        );
    }

    insertRow(
        row: TData,
        index?: number,
    ): void {
        this.assertActive();

        this.mutations.insertRow(
            row,
            index,
        );
    }

    removeRow(
        rowId: string,
    ): boolean {
        this.assertActive();

        return this.mutations.removeRow(
            rowId,
        );
    }

    bulkPatch(
        rowIds: readonly string[],
        patch: Partial<TData>,
    ): number {
        this.assertActive();

        return this.mutations.bulkPatch(
            rowIds,
            patch,
        );
    }

    clear(): void {
        this.assertActive();

        this.mutations.clear();
    }

    beginOptimistic(): void {
        this.assertActive();

        this.mutations.beginOptimistic();
    }

    commitOptimistic(): void {
        this.assertActive();

        this.mutations.commitOptimistic();
    }

    rollback(): boolean {
        this.assertActive();

        return this.mutations.rollback();
    }

    // =========================================================================
    // SERVER
    // =========================================================================

    fetch():
        ReturnType<
            GridServerManager<TData>['fetch']
        > {
        this.assertActive();

        return this.requireServer().fetch();
    }

    refetch():
        ReturnType<
            GridServerManager<TData>['refetch']
        > {
        this.assertActive();

        return this.requireServer().refetch();
    }

    cancel(): void {
        this.assertActive();

        this.requireServer().cancel();
    }

    getServerStatus():
        | ReturnType<
        GridServerManager<TData>['getStatus']
    >
        | undefined {
        this.assertActive();

        return this.server?.getStatus();
    }

    // =========================================================================
    // FACETING
    // =========================================================================

    getUniqueValues(
        columnId: string,
    ) {
        this.assertActive();

        return this.faceting.getUniqueValues(
            columnId,
        );
    }

    getSortedUniqueValues(
        columnId: string,
    ) {
        this.assertActive();

        return this.faceting.getSortedUniqueValues(
            columnId,
        );
    }

    getMinMax(
        columnId: string,
    ) {
        this.assertActive();

        return this.faceting.getMinMax(
            columnId,
        );
    }

    getFacetedRows(
        columnId: string,
    ) {
        this.assertActive();

        return this.faceting.getFacetedRows(
            columnId,
        );
    }

    setServerFacets(
        facets: Parameters<
            GridFacetingManager<TData>['setServerFacets']
        >[0],
    ): void {
        this.assertActive();

        this.faceting.setServerFacets(
            facets,
        );
    }

    // =========================================================================
    // PERSISTENCE
    // =========================================================================

    exportSnapshot():
        ReturnType<
            TanStackGridEngine<TData>['exportState']
        > {
        this.assertActive();

        return this.engine.exportState();
    }

    importSnapshot(
        snapshot: Parameters<
            TanStackGridEngine<TData>['importState']
        >[0],
    ): void {
        this.assertActive();

        this.engine.importState(
            snapshot,
        );
    }

    // =========================================================================
    // PLUGINS
    // =========================================================================

    use(
        plugin: GridPlugin<TData>,
    ): void {
        this.assertActive();

        this.engine.registerPlugin(
            plugin,
        );
    }

    unuse(
        name: string,
    ): void {
        this.assertActive();

        this.engine.unregisterPlugin(
            name,
        );
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): Readonly<GridCoreDiagnostics<TData>> {
        this.assertActive();

        return Object.freeze(
            {
                engine:
                    this.engine.diagnostics(),

                rendering:
                    this.rendering.diagnostics(),

                mutations:
                    this.mutations.diagnostics(),

                faceting:
                    this.faceting.diagnostics(),

                persistence:
                    this.engine.persistenceDiagnostics(),

                plugins:
                    this.engine.pluginDiagnostics(),

                server:
                    this.server
                        ?.diagnostics(),
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

        this.faceting.destroy();

        this.server?.cancel();

        const engineRuntime: unknown =
            this.engine;

        if (
            this.isDestroyable(
                engineRuntime,
            )
        ) {
            engineRuntime.destroy();
        } else {
            this.engine.reset(
                'all',
            );
        }

        this.destroyed =
            true;
    }
}
```

```typescript
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
import {
    GridPersistenceManager,
    type GridPersistenceOptions,
} from './persistence';
import {
    GridPluginManager,
    type GridPluginManagerOptions,
} from './plugins';

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
    readonly persistence?: GridPersistenceOptions;
    readonly pluginManager?: GridPluginManagerOptions;
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
                options.persistence,
            );

        this.plugins =
            new GridPluginManager<TData>(
                this,
                options.pluginManager,
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
        const OPTION_ALLOWLIST: ReadonlySet<string> =
            new Set([
                'debugAll',
                'debugTable',
                'debugHeaders',
                'debugColumns',
                'debugRows',
                'renderFallbackValue',
                'autoResetAll',
                'mergeOptions',
                'meta',
                'getCoreRowModel',
                'getSubRows',
                'getRowId',
                'columns',
                'defaultColumn',
                'initialState',
                'onColumnVisibilityChange',
                'onColumnOrderChange',
                'onColumnPinningChange',
                'onColumnFiltersChange',
                'filterFromLeafRows',
                'maxLeafRowFilterDepth',
                'globalFilterFn',
                'onGlobalFilterChange',
                'getFilteredRowModel',
                'manualFiltering',
                'enableFilters',
                'enableColumnFilters',
                'enableGlobalFilter',
                'enableMultiRowSelection',
                'enableRowSelection',
                'enableSubRowSelection',
                'onRowSelectionChange',
                'onSortingChange',
                'isMultiSortEvent',
                'maxMultiSortColCount',
                'enableMultiRemove',
                'enableMultiSort',
                'sortDescFirst',
                'getSortedRowModel',
                'manualSorting',
                'enableSorting',
                'enableSortingRemoval',
                'enableRowPinning',
                'keepPinnedRows',
                'onRowPinningChange',
                'getPaginationRowModel',
                'onPaginationChange',
                'manualPagination',
                'pageCount',
                'rowCount',
                'autoResetPageIndex',
                'getFacetedRowModel',
                'getFacetedUniqueValues',
                'getFacetedMinMaxValues',
                'onGroupingChange',
                'enableGrouping',
                'getGroupedRowModel',
                'manualGrouping',
                'onExpandedChange',
                'autoResetExpanded',
                'enableExpanding',
                'paginateExpandedRows',
                'manualExpanding',
                'getExpandedRowModel',
                'columnResizeMode',
                'columnResizeDirection',
                'onColumnSizingChange',
                'onColumnSizingInfoChange',
            ]);

        const governanceLockedKeys: ReadonlySet<string> =
            new Set([
                'data',
                'columns',
                'state',
                'onStateChange',
            ]);

        const sanitized: Partial<TableOptions<TData>> = {};
        const blockedKeys: string[] = [];

        for (const [key, value] of Object.entries(override)) {
            if (governanceLockedKeys.has(key)) {
                continue;
            }

            if (!OPTION_ALLOWLIST.has(key)) {
                blockedKeys.push(key);
                continue;
            }

            (sanitized as Record<string, unknown>)[key] = value;
        }

        if (blockedKeys.length > 0) {
            throw new Error(
                `Unsupported option override keys: ${blockedKeys.join(', ')}.`,
            );
        }

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
                            : undefined;
                    const derivedIdentity =
                        columnId ??
                        ('accessorKey' in
                            column &&
                        typeof column.accessorKey ===
                            'string' &&
                        column.accessorKey.length > 0
                            ? column.accessorKey.replace(/\./g, '_')
                            : typeof column.header ===
                              'string'
                              ? column.header
                              : undefined);

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

                    if (derivedIdentity) {
                        if (
                            seenIds.has(
                                derivedIdentity,
                            )
                        ) {
                            throw new Error(
                                `Duplicate column identity detected: "${derivedIdentity}" from ${columnPath}.`,
                            );
                        }

                        seenIds.add(
                            derivedIdentity,
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
        try {
            mutate();

            this.state =
                this.table.getState();

            this.emitStateChange(
                previous,
            );
        } catch (error) {
            this.state = previous;
            this.syncTable();
            this.eventBus.emit(
                'error',
                {
                    message:
                        'Table state mutation failed.',
                    error,
                },
            );
            throw error;
        }
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

```

```
// ============================================================================
// TanStack Grid Engine — events.ts (FINAL V4.7 ABSOLUTE HARD LOCK)
// Canonical Event Authority + Subscription Governance + Lifecycle Finalization
// Re-entrancy Safe + Destroy Lock + Snapshot Integrity + Diagnostics Perfection
// ============================================================================

import type {
    GridEventDiagnostics,
    GridEventHandler,
    GridEventKey,
    GridEventMap,
    GridEventUnsubscribe,
} from './types';

import type {
    RowData,
} from '@tanstack/table-core';

// ============================================================================
// INTERNAL TYPES
// ============================================================================

type GridEventRegistry<
    TData extends RowData,
> = Map<
    GridEventKey<TData>,
    Set<
        GridEventHandler<
            TData,
            GridEventKey<TData>
        >
    >
>;

// ============================================================================
// EVENT BUS
// ============================================================================

export class GridEventBus<
    TData extends RowData,
> {
    private readonly listeners: GridEventRegistry<TData> =
        new Map();

    private destroyed = false;

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private assertActive(): void {
        if (
            this.destroyed
        ) {
            throw new Error(
                'GridEventBus has been destroyed.',
            );
        }
    }

    private getOrCreateHandlers<
        TEvent extends GridEventKey<TData>,
    >(
        event: TEvent,
    ): Set<
        GridEventHandler<
            TData,
            GridEventKey<TData>
        >
    > {
        const existing =
            this.listeners.get(
                event,
            );

        if (
            existing
        ) {
            return existing;
        }

        const created =
            new Set<
                GridEventHandler<
                    TData,
                    GridEventKey<TData>
                >
            >();

        this.listeners.set(
            event,
            created,
        );

        return created;
    }

    // =========================================================================
    // SUBSCRIBE
    // =========================================================================

    on<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): GridEventUnsubscribe {
        this.assertActive();

        const handlers =
            this.getOrCreateHandlers(
                event,
            );

        handlers.add(
            handler as GridEventHandler<
                TData,
                GridEventKey<TData>
            >,
        );

        let active =
            true;

        return (): void => {
            if (
                !active
            ) {
                return;
            }

            active =
                false;

            if (
                this.destroyed
            ) {
                return;
            }

            this.off(
                event,
                handler,
            );
        };
    }

    // =========================================================================
    // UNSUBSCRIBE
    // =========================================================================

    off<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): void {
        if (
            this.destroyed
        ) {
            return;
        }

        const handlers =
            this.listeners.get(
                event,
            );

        if (
            !handlers
        ) {
            return;
        }

        handlers.delete(
            handler as GridEventHandler<
                TData,
                GridEventKey<TData>
            >,
        );

        if (
            handlers.size ===
            0
        ) {
            this.listeners.delete(
                event,
            );
        }
    }

    // =========================================================================
    // ONCE
    // =========================================================================

    once<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): GridEventUnsubscribe {
        this.assertActive();

        let unsubscribe: GridEventUnsubscribe =
            (): void =>
                undefined;

        const onceHandler: GridEventHandler<
            TData,
            TEvent
        > = (
            payload: GridEventMap<TData>[TEvent],
        ): void => {
            unsubscribe();
            handler(
                payload,
            );
        };

        unsubscribe =
            this.on(
                event,
                onceHandler,
            );

        return unsubscribe;
    }

    // =========================================================================
    // EMIT
    // =========================================================================

    emit<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        payload: GridEventMap<TData>[TEvent],
    ): void {
        if (
            this.destroyed
        ) {
            return;
        }

        const handlers =
            this.listeners.get(
                event,
            );

        if (
            !handlers ||
            handlers.size ===
            0
        ) {
            return;
        }

        const snapshot =
            Object.freeze(
                [
                    ...handlers,
                ],
            ) as readonly GridEventHandler<
                TData,
                TEvent
            >[];

        for (const handler of snapshot) {
            handler(
                payload,
            );
        }
    }

    // =========================================================================
    // INSPECTION
    // =========================================================================

    hasListeners<TEvent extends GridEventKey<TData>>(
        event: TEvent,
    ): boolean {
        if (
            this.destroyed
        ) {
            return false;
        }

        const handlers =
            this.listeners.get(
                event,
            );

        return Boolean(
            handlers &&
            handlers.size >
            0,
        );
    }

    listenerCount<TEvent extends GridEventKey<TData>>(
        event: TEvent,
    ): number {
        if (
            this.destroyed
        ) {
            return 0;
        }

        return (
            this.listeners.get(
                event,
            )?.size ?? 0
        );
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridEventDiagnostics<TData> {
        const counts: Partial<
            Record<
                GridEventKey<TData>,
                number
            >
        > = {};

        if (
            this.destroyed
        ) {
            return Object.freeze(
                {
                    listeners:
                        Object.freeze(
                            counts,
                        ),
                },
            );
        }

        for (const [
            event,
            handlers,
        ] of this.listeners.entries()) {
            counts[
                event
                ] =
                handlers.size;
        }

        return Object.freeze({
            listeners:
                Object.freeze(
                    counts,
                ),
        });
    }

    // =========================================================================
    // RESET
    // =========================================================================

    reset(): void {
        if (
            this.destroyed
        ) {
            return;
        }

        this.listeners.clear();
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

        this.reset();

        this.destroyed =
            true;
    }
}
```

```
// ============================================================================
// TanStack Grid Engine — faceting.ts (FINAL V4.4 HARD LOCK)
// Analytical Governance Runtime
// Faceting + Unique Values + Min/Max + Server Injection + Full Cache +
// Column-Aware Extraction + Lifecycle Cleanup + Diagnostics
// ============================================================================

import type {RowData} from '@tanstack/table-core';

import type {
    GridEngine,
    GridEventUnsubscribe,
} from './types';

// ============================================================================
// CONTRACTS
// ============================================================================

export interface GridFacetValue {
    readonly value: unknown;
    readonly count: number;
}

export interface GridFacetingDiagnostics {
    readonly facetingEnabled: boolean;
    readonly cachedUniqueColumns: readonly string[];
    readonly cachedSortedColumns: readonly string[];
    readonly cachedMinMaxColumns: readonly string[];
    readonly cachedFacetedRowColumns: readonly string[];
    readonly serverFacetColumns: readonly string[];
}

export interface GridServerFacetMap {
    readonly [columnId: string]: ReadonlyMap<
        unknown,
        number
    >;
}

export interface GridFacetingManagerOptions<TData extends RowData> {
    readonly engine: GridEngine<TData>;
}

// ============================================================================
// FACETING MANAGER
// ============================================================================

export class GridFacetingManager<TData extends RowData> {
    private readonly engine: GridEngine<TData>;

    private readonly unsubscribers: GridEventUnsubscribe[] = [];

    private readonly uniqueCache =
        new Map<
            string,
            ReadonlyMap<
                unknown,
                number
            >
        >();

    private readonly sortedCache =
        new Map<
            string,
            readonly GridFacetValue[]
        >();

    private readonly minMaxCache =
        new Map<
            string,
            readonly [
                unknown,
                unknown,
            ]
        >();

    private readonly facetedRowsCache =
        new Map<
            string,
            readonly TData[]
        >();

    private readonly serverFacets =
        new Map<
            string,
            ReadonlyMap<
                unknown,
                number
            >
        >();

    constructor(
        options: GridFacetingManagerOptions<TData>,
    ) {
        this.engine =
            options.engine;

        this.unsubscribers.push(
            this.engine.on(
                'dataChange',
                () => {
                    this.clearCache();
                },
            ),
            this.engine.on(
                'stateChange',
                () => {
                    this.clearCache();
                },
            ),
            this.engine.on(
                'reset',
                () => {
                    this.reset();
                },
            ),
        );
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private emptyFacetValues(): readonly GridFacetValue[] {
        return Object.freeze(
            [],
        );
    }

    private emptyRows(): readonly TData[] {
        return Object.freeze(
            [],
        );
    }

    private emptyMap(): ReadonlyMap<
        unknown,
        number
    > {
        return new Map<
            unknown,
            number
        >() as ReadonlyMap<
            unknown,
            number
        >;
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

    private canFacet(): boolean {
        return this.engine
            .canUseFeature(
                'faceting',
            )
            .operational;
    }

    private getRows():
        readonly TData[] {
        return this.engine.getRows();
    }

    private getColumnValue(
        row: TData,
        columnId: string,
    ): unknown {
        const column =
            this.engine.getColumn(
                columnId,
            );

        if (
            column?.accessorFn
        ) {
            return column.accessorFn(
                row,
                0,
            );
        }

        const columnDef =
            column?.columnDef;

        if (
            columnDef &&
            'accessorKey' in
            columnDef
        ) {
            const accessorKey =
                columnDef.accessorKey;

            if (
                typeof accessorKey ===
                'string' &&
                typeof row ===
                'object' &&
                row !== null
            ) {
                return (
                    row as Record<
                        string,
                        unknown
                    >
                )[accessorKey];
            }
        }

        if (
            typeof row !==
            'object' ||
            row === null
        ) {
            return undefined;
        }

        return (
            row as Record<
                string,
                unknown
            >
        )[columnId];
    }

    private compareFacetValues(
        left: unknown,
        right: unknown,
    ): number {
        if (
            typeof left ===
            'number' &&
            typeof right ===
            'number'
        ) {
            return left - right;
        }

        if (
            left instanceof Date &&
            right instanceof Date
        ) {
            return (
                left.getTime() -
                right.getTime()
            );
        }

        if (
            typeof left ===
            'boolean' &&
            typeof right ===
            'boolean'
        ) {
            return Number(
                left,
            ) - Number(
                right,
            );
        }

        if (
            typeof left ===
            'string' &&
            typeof right ===
            'string'
        ) {
            return left.localeCompare(
                right,
            );
        }

        return String(
            left,
        ).localeCompare(
            String(
                right,
            ),
        );
    }

    private buildUniqueValues(
        columnId: string,
    ): ReadonlyMap<
        unknown,
        number
    > {
        if (
            this.serverFacets.has(
                columnId,
            )
        ) {
            return (
                this.serverFacets.get(
                    columnId,
                ) ??
                this.emptyMap()
            );
        }

        const cached =
            this.uniqueCache.get(
                columnId,
            );

        if (cached) {
            return cached;
        }

        const valueMap =
            new Map<
                unknown,
                number
            >();

        for (const row of this.getRows()) {
            const value =
                this.getColumnValue(
                    row,
                    columnId,
                );

            valueMap.set(
                value,
                (
                    valueMap.get(
                        value,
                    ) ?? 0
                ) + 1,
            );
        }

        this.uniqueCache.set(
            columnId,
            valueMap,
        );

        return valueMap;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    getUniqueValues(
        columnId: string,
    ): ReadonlyMap<
        unknown,
        number
    > {
        if (
            !this.canFacet()
        ) {
            return this.emptyMap();
        }

        return this.buildUniqueValues(
            columnId,
        );
    }

    getSortedUniqueValues(
        columnId: string,
    ): readonly GridFacetValue[] {
        if (
            !this.canFacet()
        ) {
            return this.emptyFacetValues();
        }

        const cached =
            this.sortedCache.get(
                columnId,
            );

        if (cached) {
            return cached;
        }

        const sorted =
            this.freezeArray(
                [
                    ...this.buildUniqueValues(
                        columnId,
                    ).entries(),
                ]
                    .map(
                        ([
                             value,
                             count,
                         ]) =>
                            Object.freeze(
                                {
                                    value,
                                    count,
                                },
                            ),
                    )
                    .sort(
                        (
                            left,
                            right,
                        ) =>
                            this.compareFacetValues(
                                left.value,
                                right.value,
                            ),
                    ),
            );

        this.sortedCache.set(
            columnId,
            sorted,
        );

        return sorted;
    }

    getMinMax(
        columnId: string,
    ):
        | readonly [
        unknown,
        unknown,
    ]
        | undefined {
        if (
            !this.canFacet()
        ) {
            return undefined;
        }

        const cached =
            this.minMaxCache.get(
                columnId,
            );

        if (cached) {
            return cached;
        }

        const values =
            this.getRows()
                .map(
                    (
                        row,
                    ) =>
                        this.getColumnValue(
                            row,
                            columnId,
                        ),
                )
                .filter(
                    (
                        value,
                    ) =>
                        value !==
                        undefined &&
                        value !==
                        null,
                );

        if (
            values.length ===
            0
        ) {
            return undefined;
        }

        let min =
            values[0];

        let max =
            values[0];

        for (const value of values) {
            if (
                this.compareFacetValues(
                    value,
                    min,
                ) < 0
            ) {
                min =
                    value;
            }

            if (
                this.compareFacetValues(
                    value,
                    max,
                ) > 0
            ) {
                max =
                    value;
            }
        }

        const result =
            Object.freeze(
                [
                    min,
                    max,
                ] as const,
            );

        this.minMaxCache.set(
            columnId,
            result,
        );

        return result;
    }

    getFacetedRows(
        columnId: string,
    ): readonly TData[] {
        if (
            !this.canFacet()
        ) {
            return this.emptyRows();
        }

        const cached =
            this.facetedRowsCache.get(
                columnId,
            );

        if (cached) {
            return cached;
        }

        const rows =
            this.freezeArray(
                this.getRows().filter(
                    (
                        row,
                    ) =>
                        this.getColumnValue(
                            row,
                            columnId,
                        ) !==
                        undefined,
                ),
            );

        this.facetedRowsCache.set(
            columnId,
            rows,
        );

        return rows;
    }

    // =========================================================================
    // SERVER FACETS
    // =========================================================================

    setServerFacets(
        facets: GridServerFacetMap,
    ): void {
        this.serverFacets.clear();

        for (const [
            columnId,
            values,
        ] of Object.entries(
            facets,
        )) {
            for (const count of values.values()) {
                if (
                    count < 0
                ) {
                    throw new Error(
                        `Invalid server facet count for column "${columnId}". Counts cannot be negative.`,
                    );
                }
            }

            this.serverFacets.set(
                columnId,
                values,
            );
        }

        this.clearCache();
    }

    // =========================================================================
    // CACHE CONTROL
    // =========================================================================

    clearCache(): void {
        this.uniqueCache.clear();

        this.sortedCache.clear();

        this.minMaxCache.clear();

        this.facetedRowsCache.clear();
    }

    reset(): void {
        this.clearCache();

        this.serverFacets.clear();
    }

    destroy(): void {
        for (const unsubscribe of this.unsubscribers) {
            unsubscribe();
        }

        this.unsubscribers.length = 0;

        this.reset();
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridFacetingDiagnostics {
        return Object.freeze({
            facetingEnabled:
                this.canFacet(),

            cachedUniqueColumns:
                this.freezeArray(
                    [
                        ...this.uniqueCache.keys(),
                    ],
                ),

            cachedSortedColumns:
                this.freezeArray(
                    [
                        ...this.sortedCache.keys(),
                    ],
                ),

            cachedMinMaxColumns:
                this.freezeArray(
                    [
                        ...this.minMaxCache.keys(),
                    ],
                ),

            cachedFacetedRowColumns:
                this.freezeArray(
                    [
                        ...this.facetedRowsCache.keys(),
                    ],
                ),

            serverFacetColumns:
                this.freezeArray(
                    [
                        ...this.serverFacets.keys(),
                    ],
                ),
        });
    }
}

```

```typescript
// ============================================================================
// TanStack Grid Engine — features.ts (FINAL V4.7 ABSOLUTE HARD LOCK)
// Canonical Governance Authority + Dependency Perfection + Server Policy Lock
// Snapshot Integrity + Drift Elimination + Lifecycle Governance Final
// ============================================================================

import type {
    GridFeatureConfig,
    GridFeatureDiagnostics,
    GridFeatureKey,
    GridFeatureSnapshot,
    GridFeatureUsage,
    GridMode,
    GridServerConfig,
} from './types';

import {
    DEFAULT_GRID_FEATURES,
    DEFAULT_GRID_SERVER_CONFIG,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const FEATURE_DEPENDENCIES: Readonly<
    Partial<
        Record<
            GridFeatureKey,
            readonly GridFeatureKey[]
        >
    >
> = {
    faceting: [
        'filtering',
    ] as const satisfies readonly GridFeatureKey[],

    globalFilter: [
        'filtering',
    ] as const satisfies readonly GridFeatureKey[],
};

const MANUAL_SERVER_RULES: Readonly<
    Partial<
        Record<
            GridFeatureKey,
            keyof GridServerConfig
        >
    >
> = Object.freeze({
    sorting: 'manualSorting',
    filtering: 'manualFiltering',
    globalFilter: 'manualFiltering',
    faceting: 'manualFiltering',
    pagination: 'manualPagination',
    grouping: 'manualGrouping',
});

// ============================================================================
// TYPES
// ============================================================================

export interface GridFeaturesManagerOptions {
    readonly strictDependencies?: boolean;
}

// ============================================================================
// FEATURE MANAGER
// ============================================================================

export class GridFeaturesManager {
    private mode: GridMode;

    private features: GridFeatureConfig;

    private server: GridServerConfig;

    private readonly strictDependencies: boolean;

    constructor(config?: {
        readonly mode?: GridMode;
        readonly features?: Partial<GridFeatureConfig>;
        readonly server?: Partial<GridServerConfig>;
        readonly options?: GridFeaturesManagerOptions;
    }) {
        this.mode =
            config?.mode ??
            'client';

        this.features = {
            ...DEFAULT_GRID_FEATURES,
            ...config?.features,
        };

        this.server = {
            ...DEFAULT_GRID_SERVER_CONFIG,
            ...config?.server,
        };

        this.strictDependencies =
            config?.options
                ?.strictDependencies ??
            false;

        this.reconcile();
        this.validate();
    }

    // =========================================================================
    // MODE
    // =========================================================================

    getMode(): GridMode {
        return this.mode;
    }

    setMode(
        mode: GridMode,
    ): void {
        if (
            this.mode === mode
        ) {
            return;
        }

        this.mode = mode;

        if (
            mode ===
            'client'
        ) {
            this.server = {
                ...DEFAULT_GRID_SERVER_CONFIG,
            };
        } else {
            this.server = {
                ...this.server,
                enabled: true,
            };
        }

        this.reconcile();
        this.validate();
    }

    // =========================================================================
    // FEATURES
    // =========================================================================

    getFeatures(): Readonly<GridFeatureConfig> {
        return Object.freeze({
            ...this.features,
        });
    }

    setFeatures(
        updates: Partial<GridFeatureConfig>,
    ): void {
        this.features = {
            ...this.features,
            ...updates,
        };

        this.reconcile();
        this.validate();
    }

    isFeatureEnabled(
        feature: GridFeatureKey,
    ): boolean {
        return Boolean(
            this.features[
                feature
                ],
        );
    }

    // =========================================================================
    // SERVER
    // =========================================================================

    getServerConfig(): Readonly<GridServerConfig> {
        return Object.freeze({
            ...this.server,
        });
    }

    setServerConfig(
        updates: Partial<GridServerConfig>,
    ): void {
        this.server = {
            ...this.server,
            ...updates,
        };

        this.mode =
            this.server.enabled
                ? 'server'
                : 'client';

        this.reconcile();
        this.validate();
    }

    // =========================================================================
    // SNAPSHOTS
    // =========================================================================

    importSnapshot(
        snapshot: Partial<GridFeatureSnapshot>,
    ): void {
        if (
            snapshot.mode
        ) {
            this.mode =
                snapshot.mode;
        }

        if (
            snapshot.features
        ) {
            this.features = {
                ...this.features,
                ...snapshot.features,
            };
        }

        if (
            snapshot.server
        ) {
            this.server = {
                ...this.server,
                ...snapshot.server,
            };
        }

        this.reconcile();
        this.validate();
    }

    replaceSnapshot(
        snapshot: GridFeatureSnapshot,
    ): void {
        this.mode =
            snapshot.mode;

        this.features = {
            ...DEFAULT_GRID_FEATURES,
            ...snapshot.features,
        };

        this.server = {
            ...DEFAULT_GRID_SERVER_CONFIG,
            ...snapshot.server,
        };

        this.reconcile();
        this.validate();
    }

    snapshot(): GridFeatureSnapshot {
        return Object.freeze({
            mode: this.mode,
            features:
                Object.freeze({
                    ...this.features,
                }),
            server:
                Object.freeze({
                    ...this.server,
                }),
        });
    }

    // =========================================================================
    // FEATURE STATUS
    // =========================================================================

    isManual(
        feature: GridFeatureKey,
    ): boolean {
        if (
            this.mode !==
            'server'
        ) {
            return false;
        }

        const manualKey =
            MANUAL_SERVER_RULES[
                feature
                ];

        if (
            !manualKey
        ) {
            return false;
        }

        return Boolean(
            this.server[
                manualKey
                ],
        );
    }

    canUseFeature(
        feature: GridFeatureKey,
    ): GridFeatureUsage {
        const enabled =
            this.isFeatureEnabled(
                feature,
            );

        if (
            !enabled
        ) {
            return Object.freeze({
                enabled: false,
                operational: false,
            });
        }

        if (
            this.isManual(
                feature,
            )
        ) {
            return Object.freeze({
                enabled: true,
                operational: false,
            });
        }

        return Object.freeze({
            enabled: true,
            operational: true,
        });
    }

    // =========================================================================
    // ASSERTIONS
    // =========================================================================

    assert(
        feature: GridFeatureKey,
    ): void {
        if (
            !this.isFeatureEnabled(
                feature,
            )
        ) {
            throw new Error(
                `Feature "${feature}" is disabled.`,
            );
        }
    }

    assertOperational(
        feature: GridFeatureKey,
    ): void {
        this.assert(
            feature,
        );

        if (
            this.isManual(
                feature,
            )
        ) {
            throw new Error(
                `Feature "${feature}" is enabled but manually controlled in server mode.`,
            );
        }
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    validate(): void {
        for (const [
            feature,
            dependencies,
        ] of Object.entries(
            FEATURE_DEPENDENCIES,
        ) as Array<
            [
                GridFeatureKey,
                readonly GridFeatureKey[],
            ]
        >) {
            if (
                !this.features[
                    feature
                    ]
            ) {
                continue;
            }

            for (const dependency of dependencies) {
                if (
                    !this.features[
                        dependency
                        ]
                ) {
                    throw new Error(
                        `Feature "${feature}" requires "${dependency}".`,
                    );
                }
            }
        }

        if (
            this.mode ===
            'client' &&
            this.server.enabled
        ) {
            throw new Error(
                'Client mode cannot have server enabled.',
            );
        }
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridFeatureDiagnostics {
        const disabled: GridFeatureKey[] =
            [];

        const manual: GridFeatureKey[] =
            [];

        for (const feature of Object.keys(
            this.features,
        ) as GridFeatureKey[]) {
            if (
                !this.features[
                    feature
                    ]
            ) {
                disabled.push(
                    feature,
                );
            }

            if (
                this.isManual(
                    feature,
                )
            ) {
                manual.push(
                    feature,
                );
            }
        }

        return Object.freeze({
            mode: this.mode,
            disabled:
                Object.freeze(
                    disabled,
                ),
            manual:
                Object.freeze(
                    manual,
                ),
        });
    }

    // =========================================================================
    // RESET
    // =========================================================================

    reset(): void {
        this.mode =
            'client';

        this.features = {
            ...DEFAULT_GRID_FEATURES,
        };

        this.server = {
            ...DEFAULT_GRID_SERVER_CONFIG,
        };

        this.reconcile();
        this.validate();
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private reconcile(): void {
        let nextFeatures: GridFeatureConfig =
            {
                ...this.features,
            };

        let nextServer: GridServerConfig =
            {
                ...this.server,
            };

        // ---------------------------------------------------------------------
        // Dependency enforcement
        // ---------------------------------------------------------------------

        for (const [
            feature,
            dependencies,
        ] of Object.entries(
            FEATURE_DEPENDENCIES,
        ) as Array<
            [
                GridFeatureKey,
                readonly GridFeatureKey[],
            ]
        >) {
            if (
                !nextFeatures[
                    feature
                    ]
            ) {
                continue;
            }

            for (const dependency of dependencies) {
                if (
                    nextFeatures[
                        dependency
                        ]
                ) {
                    continue;
                }

                if (
                    this.strictDependencies
                ) {
                    throw new Error(
                        `Feature "${feature}" requires "${dependency}".`,
                    );
                }

                nextFeatures = {
                    ...nextFeatures,
                    [feature]: false,
                };
            }
        }

        // ---------------------------------------------------------------------
        // Client mode hard reset
        // ---------------------------------------------------------------------

        if (
            this.mode ===
            'client'
        ) {
            nextServer = {
                ...DEFAULT_GRID_SERVER_CONFIG,
            };
        }

        // ---------------------------------------------------------------------
        // Server mode hard enable
        // ---------------------------------------------------------------------

        if (
            this.mode ===
            'server'
        ) {
            nextServer = {
                ...nextServer,
                enabled: true,
            };
        }

        // ---------------------------------------------------------------------
        // Invalid manual governance cleanup
        // ---------------------------------------------------------------------

        if (
            !nextFeatures.sorting
        ) {
            nextServer = {
                ...nextServer,
                manualSorting: false,
            };
        }

        if (
            !nextFeatures.filtering
        ) {
            nextServer = {
                ...nextServer,
                manualFiltering: false,
            };
        }

        if (
            !nextFeatures.pagination
        ) {
            nextServer = {
                ...nextServer,
                manualPagination: false,
            };
        }

        if (
            !nextFeatures.grouping
        ) {
            nextServer = {
                ...nextServer,
                manualGrouping: false,
            };
        }

        this.features =
            nextFeatures;

        this.server =
            nextServer;
    }
}

```
```typescript
// ============================================================================
// TanStack Grid Engine — mutations.ts (FINAL V4.3 HARD LOCK)
// Governance-Safe Data Mutation Runtime
// Immutable + Identity-Safe + Optimistic + Validation + Diagnostics
// ============================================================================

import type {RowData} from '@tanstack/table-core';

import type {
    GridEngine,
} from './types';

// ============================================================================
// MUTATION TYPES
// ============================================================================

export type GridMutationType =
    | 'setData'
    | 'replaceRows'
    | 'replaceRow'
    | 'insertRow'
    | 'removeRow'
    | 'updateRow'
    | 'patchRow'
    | 'bulkPatch'
    | 'clear'
    | 'rollback'
    | 'commitOptimistic';

// ============================================================================
// DIAGNOSTICS
// ============================================================================

export interface GridMutationDiagnostics {
    readonly rowCount: number;
    readonly mutationVersion: number;
    readonly optimisticActive: boolean;
    readonly optimisticVersion: number;
    readonly lastMutation?: GridMutationType;
}

// ============================================================================
// OPTIONS
// ============================================================================

export interface GridMutationManagerOptions<TData extends RowData> {
    readonly engine: GridEngine<TData>;

    readonly getRowId: (
        row: TData,
    ) => string;

    readonly onBeforeMutation?: (
        type: GridMutationType,
    ) => void;

    readonly onAfterMutation?: (
        type: GridMutationType,
    ) => void;
}

// ============================================================================
// MUTATION MANAGER
// ============================================================================

export class GridMutationManager<TData extends RowData> {
    private readonly engine: GridEngine<TData>;

    private readonly getRowId: (
        row: TData,
    ) => string;

    private readonly onBeforeMutation?: (
        type: GridMutationType,
    ) => void;

    private readonly onAfterMutation?: (
        type: GridMutationType,
    ) => void;

    private rowMap = new Map<
        string,
        TData
    >();

    private mutationVersion = 0;

    private optimisticVersion = 0;

    private lastMutation?: GridMutationType;

    private optimisticSnapshot?: readonly TData[];

    constructor(
        options: GridMutationManagerOptions<TData>,
    ) {
        this.engine =
            options.engine;

        this.getRowId =
            options.getRowId;

        this.onBeforeMutation =
            options.onBeforeMutation;

        this.onAfterMutation =
            options.onAfterMutation;

        this.rebuildRowMap(
            this.engine.getRows(),
        );
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private emptyRows(): readonly TData[] {
        return Object.freeze(
            [],
        );
    }

    private freezeRows(
        rows: readonly TData[],
    ): readonly TData[] {
        if (
            Object.isFrozen(
                rows,
            )
        ) {
            return rows;
        }

        return Object.freeze(
            [
                ...rows,
            ],
        );
    }

    private validateUniqueRows(
        rows: readonly TData[],
    ): Map<string, TData> {
        const nextMap =
            new Map<
                string,
                TData
            >();

        for (const row of rows) {
            const rowId =
                this.getRowId(
                    row,
                );

            if (
                nextMap.has(
                    rowId,
                )
            ) {
                throw new Error(
                    `Duplicate row id detected: ${rowId}`,
                );
            }

            nextMap.set(
                rowId,
                row,
            );
        }

        return nextMap;
    }

    private commitMutation(
        type: GridMutationType,
        nextRows: readonly TData[],
    ): void {
        this.onBeforeMutation?.(
            type,
        );

        const frozenRows =
            this.freezeRows(
                nextRows,
            );

        const validatedMap =
            this.validateUniqueRows(
                frozenRows,
            );

        this.engine.setData(
            frozenRows,
        );

        this.engine.setRecordCount(
            frozenRows.length,
        );

        this.rowMap =
            validatedMap;

        this.mutationVersion++;

        this.lastMutation =
            type;

        this.onAfterMutation?.(
            type,
        );
    }

    private rebuildRowMap(
        rows: readonly TData[],
    ): void {
        this.rowMap =
            this.validateUniqueRows(
                rows,
            );
    }

    private getRows():
        readonly TData[] {
        return this.engine.getRows();
    }

    private createPatchedRow(
        current: TData,
        patch: Partial<TData>,
    ): TData {
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
            ...current,
            ...patch,
        } as TData;
    }

    // =========================================================================
    // CORE
    // =========================================================================

    setData(
        rows: readonly TData[],
    ): void {
        this.commitMutation(
            'setData',
            rows,
        );
    }

    clear(): void {
        this.commitMutation(
            'clear',
            this.emptyRows(),
        );
    }

    replaceRows(
        rows: readonly TData[],
    ): void {
        this.commitMutation(
            'replaceRows',
            rows,
        );
    }

    replaceRow(
        rowId: string,
        nextRow: TData,
    ): boolean {
        let found =
            false;

        const nextRows =
            this.getRows().map(
                (
                    row,
                ) => {
                    if (
                        this.getRowId(
                            row,
                        ) !== rowId
                    ) {
                        return row;
                    }

                    found =
                        true;

                    return nextRow;
                },
            );

        if (!found) {
            return false;
        }

        this.commitMutation(
            'replaceRow',
            nextRows,
        );

        return true;
    }

    insertRow(
        row: TData,
        index?: number,
    ): void {
        const rows =
            this.getRows();

        const rowId =
            this.getRowId(
                row,
            );

        if (
            this.rowMap.has(
                rowId,
            )
        ) {
            throw new Error(
                `Duplicate row id detected: ${rowId}`,
            );
        }

        if (
            typeof index !==
            'number' ||
            index < 0 ||
            index >
            rows.length
        ) {
            this.commitMutation(
                'insertRow',
                [
                    ...rows,
                    row,
                ],
            );

            return;
        }

        this.commitMutation(
            'insertRow',
            [
                ...rows.slice(
                    0,
                    index,
                ),
                row,
                ...rows.slice(
                    index,
                ),
            ],
        );
    }

    removeRow(
        rowId: string,
    ): boolean {
        const rows =
            this.getRows();

        const nextRows =
            rows.filter(
                (
                    row,
                ) =>
                    this.getRowId(
                        row,
                    ) !== rowId,
            );

        if (
            nextRows.length ===
            rows.length
        ) {
            return false;
        }

        this.commitMutation(
            'removeRow',
            nextRows,
        );

        return true;
    }

    updateRow(
        rowId: string,
        updater: (
            current: TData,
        ) => TData,
    ): boolean {
        let found =
            false;

        const nextRows =
            this.getRows().map(
                (
                    row,
                ) => {
                    if (
                        this.getRowId(
                            row,
                        ) !== rowId
                    ) {
                        return row;
                    }

                    found =
                        true;

                    return updater(
                        row,
                    );
                },
            );

        if (!found) {
            return false;
        }

        this.commitMutation(
            'updateRow',
            nextRows,
        );

        return true;
    }

    patchRow(
        rowId: string,
        patch: Partial<TData>,
    ): boolean {
        return this.updateRow(
            rowId,
            (
                current,
            ) =>
                this.createPatchedRow(
                    current,
                    patch,
                ),
        );
    }

    bulkPatch(
        rowIds: readonly string[],
        patch: Partial<TData>,
    ): number {
        const idSet =
            new Set(
                rowIds,
            );

        let patchedCount =
            0;

        const nextRows =
            this.getRows().map(
                (
                    row,
                ) => {
                    const currentId =
                        this.getRowId(
                            row,
                        );

                    if (
                        !idSet.has(
                            currentId,
                        )
                    ) {
                        return row;
                    }

                    patchedCount++;

                    return this.createPatchedRow(
                        row,
                        patch,
                    );
                },
            );

        if (
            patchedCount ===
            0
        ) {
            return 0;
        }

        this.commitMutation(
            'bulkPatch',
            nextRows,
        );

        return patchedCount;
    }

    // =========================================================================
    // OPTIMISTIC
    // =========================================================================

    beginOptimistic(): void {
        if (
            this.optimisticSnapshot
        ) {
            this.optimisticVersion++;

            return;
        }

        this.optimisticSnapshot =
            this.freezeRows(
                this.getRows(),
            );

        this.optimisticVersion = 1;
    }

    commitOptimistic(): void {
        this.optimisticSnapshot =
            undefined;

        this.optimisticVersion = 0;

        this.lastMutation =
            'commitOptimistic';
    }

    rollback(): boolean {
        if (
            !this.optimisticSnapshot
        ) {
            return false;
        }

        this.commitMutation(
            'rollback',
            this.optimisticSnapshot,
        );

        this.optimisticSnapshot =
            undefined;

        this.optimisticVersion = 0;

        return true;
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridMutationDiagnostics {
        return Object.freeze({
            rowCount:
                this.engine
                    .getRecordCount(),
            mutationVersion:
            this.mutationVersion,
            optimisticActive:
                Boolean(
                    this.optimisticSnapshot,
                ),
            optimisticVersion:
            this.optimisticVersion,
            lastMutation:
            this.lastMutation,
        });
    }
}

```

```typescript
// ============================================================================
// TanStack Grid Engine — persistence.ts (FINAL V4 LOCK)
// Migration-Safe + Validation-Safe + Governance-Aligned Persistence Runtime
// ============================================================================

import type {
    GridEngine,
    GridMode,
    GridPersistenceSnapshot,
} from './types';

import type {
    RowData,
    TableState,
} from '@tanstack/table-core';

// ============================================================================
// TYPES
// ============================================================================

export interface GridPersistenceOptions {
    readonly version?: number;

    readonly migrate?: (
        snapshot: GridPersistenceSnapshot,
        targetVersion: number,
    ) => GridPersistenceSnapshot;
}

export interface GridPersistenceImportOptions {
    readonly state?: boolean;

    readonly features?: boolean;

    readonly server?: boolean;

    readonly mode?: boolean;

    readonly recordCount?: boolean;
}

export interface GridPersistenceDiagnostics {
    readonly version: number;

    readonly mode: GridMode;

    readonly recordCount: number;

    readonly timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GRID_PERSISTENCE_VERSION =
    1;

// ============================================================================
// PERSISTENCE MANAGER
// ============================================================================

export class GridPersistenceManager<
    TData extends RowData,
> {
    private readonly engine: GridEngine<TData>;

    private readonly version: number;

    private readonly migrate?;

    constructor(
        engine: GridEngine<TData>,
        options?: GridPersistenceOptions,
    ) {
        this.engine = engine;

        this.version =
            options?.version ??
            GRID_PERSISTENCE_VERSION;

        this.migrate =
            options?.migrate;
    }

    // =========================================================================
    // EXPORT
    // =========================================================================

    exportState(): GridPersistenceSnapshot {
        return Object.freeze({
            version:
            this.version,

            timestamp:
                Date.now(),

            state: this.cloneTableState(
                this.engine.getState(),
            ),

            features:
                this.engine.getFeatures(),

            server:
                this.engine.getServerConfig(),

            recordCount:
                this.engine.getRecordCount(),

            mode: this.engine.getMode(),
        });
    }

    snapshot(): GridPersistenceSnapshot {
        return this.exportState();
    }

    // =========================================================================
    // IMPORT
    // =========================================================================

    importState(
        snapshot: Partial<GridPersistenceSnapshot>,
        options?: GridPersistenceImportOptions,
    ): void {
        const validated =
            this.validateAndPrepareSnapshot(
                snapshot,
            );

        const importOptions: Required<GridPersistenceImportOptions> =
            {
                state:
                    options?.state ??
                    true,

                features:
                    options?.features ??
                    true,

                server:
                    options?.server ??
                    true,

                mode:
                    options?.mode ??
                    true,

                recordCount:
                    options?.recordCount ??
                    true,
            };

        // ---------------------------------------------------------------------
        // Governance first
        // ---------------------------------------------------------------------

        if (
            importOptions.mode ||
            importOptions.features ||
            importOptions.server
        ) {
            this.engine.importSnapshot(
                {
                    mode:
                        importOptions.mode
                            ? validated.mode
                            : undefined,

                    features:
                        importOptions.features
                            ? validated.features
                            : undefined,

                    server:
                        importOptions.server
                            ? validated.server
                            : undefined,
                },
            );
        }

        // ---------------------------------------------------------------------
        // Record count
        // ---------------------------------------------------------------------

        if (
            importOptions.recordCount &&
            typeof validated.recordCount ===
            'number'
        ) {
            this.engine.setRecordCount(
                validated.recordCount,
            );
        }

        // ---------------------------------------------------------------------
        // Table state
        // ---------------------------------------------------------------------

        if (
            importOptions.state &&
            validated.state
        ) {
            const mergedState =
                this.mergeTableState(
                    this.engine.getState(),
                    validated.state,
                );

            this.engine.setState(
                mergedState,
            );
        }
    }

    replaceState(
        snapshot: GridPersistenceSnapshot,
    ): void {
        const validated =
            this.validateAndPrepareSnapshot(
                snapshot,
            );

        this.engine.replaceSnapshot(
            {
                mode: validated.mode,
                features:
                validated.features,
                server:
                validated.server,
            },
        );

        this.engine.setRecordCount(
            validated.recordCount,
        );

        this.engine.setState(
            this.cloneTableState(
                validated.state,
            ),
        );
    }

    // =========================================================================
    // SERIALIZATION
    // =========================================================================

    serialize(): string {
        return JSON.stringify(
            this.exportState(),
        );
    }

    deserialize(
        serialized: string,
        options?: GridPersistenceImportOptions,
    ): void {
        const parsed: unknown =
            JSON.parse(
                serialized,
            );

        if (
            !this.isValidSnapshotShape(
                parsed,
            )
        ) {
            throw new Error(
                'Invalid persistence payload.',
            );
        }

        this.importState(
            parsed,
            options,
        );
    }

    tryDeserialize(
        serialized: string,
        options?: GridPersistenceImportOptions,
    ): boolean {
        try {
            this.deserialize(
                serialized,
                options,
            );

            return true;
        } catch {
            return false;
        }
    }

    // =========================================================================
    // RESET
    // =========================================================================

    reset(): void {
        this.engine.reset(
            'all',
        );
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridPersistenceDiagnostics {
        const snapshot =
            this.exportState();

        return Object.freeze({
            version:
            snapshot.version,

            mode: snapshot.mode,

            recordCount:
            snapshot.recordCount,

            timestamp:
            snapshot.timestamp,
        });
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private validateAndPrepareSnapshot(
        snapshot: Partial<GridPersistenceSnapshot>,
    ): GridPersistenceSnapshot {
        if (
            !this.isValidSnapshotShape(
                snapshot,
            )
        ) {
            throw new Error(
                'Persistence snapshot validation failed.',
            );
        }

        let prepared =
            snapshot as GridPersistenceSnapshot;

        if (
            prepared.version !==
            this.version
        ) {
            if (
                !this.migrate
            ) {
                throw new Error(
                    `Persistence version mismatch. Expected "${this.version}", received "${prepared.version}".`,
                );
            }

            prepared =
                this.migrate(
                    prepared,
                    this.version,
                );
        }

        return prepared;
    }

    private isValidSnapshotShape(
        value: unknown,
    ): value is Partial<GridPersistenceSnapshot> {
        if (
            !value ||
            typeof value !==
            'object'
        ) {
            return false;
        }

        const candidate =
            value as Partial<GridPersistenceSnapshot>;

        if (
            candidate.version !==
            undefined &&
            typeof candidate.version !==
            'number'
        ) {
            return false;
        }

        if (
            candidate.timestamp !==
            undefined &&
            typeof candidate.timestamp !==
            'number'
        ) {
            return false;
        }

        if (
            candidate.recordCount !==
            undefined &&
            typeof candidate.recordCount !==
            'number'
        ) {
            return false;
        }

        if (
            candidate.mode !==
            undefined &&
            candidate.mode !==
            'client' &&
            candidate.mode !==
            'server'
        ) {
            return false;
        }

        return true;
    }

    private mergeTableState(
        current: TableState,
        incoming: Partial<TableState>,
    ): TableState {
        return {
            ...current,
            ...incoming,
        };
    }

    private cloneTableState(
        state: TableState,
    ): TableState {
        return {
            ...state,

            pagination:
                state.pagination
                    ? {
                        ...state.pagination,
                    }
                    : state.pagination,

            sorting:
                state.sorting
                    ? [
                        ...state.sorting,
                    ]
                    : state.sorting,

            columnFilters:
                state.columnFilters
                    ? [
                        ...state.columnFilters,
                    ]
                    : state.columnFilters,

            grouping:
                state.grouping
                    ? [
                        ...state.grouping,
                    ]
                    : state.grouping,

            expanded:
                typeof state.expanded ===
                'object' &&
                state.expanded !==
                null
                    ? {
                        ...state.expanded,
                    }
                    : state.expanded,

            rowSelection:
                state.rowSelection
                    ? {
                        ...state.rowSelection,
                    }
                    : state.rowSelection,

            columnVisibility:
                state.columnVisibility
                    ? {
                        ...state.columnVisibility,
                    }
                    : state.columnVisibility,

            columnPinning:
                state.columnPinning
                    ? {
                        ...state.columnPinning,

                        left:
                            state
                                .columnPinning
                                .left
                                ? [
                                    ...state
                                        .columnPinning
                                        .left,
                                ]
                                : state
                                    .columnPinning
                                    .left,

                        right:
                            state
                                .columnPinning
                                .right
                                ? [
                                    ...state
                                        .columnPinning
                                        .right,
                                ]
                                : state
                                    .columnPinning
                                    .right,
                    }
                    : state.columnPinning,

            rowPinning:
                state.rowPinning
                    ? {
                        ...state.rowPinning,

                        top:
                            state
                                .rowPinning
                                .top
                                ? [
                                    ...state
                                        .rowPinning
                                        .top,
                                ]
                                : state
                                    .rowPinning
                                    .top,

                        bottom:
                            state
                                .rowPinning
                                .bottom
                                ? [
                                    ...state
                                        .rowPinning
                                        .bottom,
                                ]
                                : state
                                    .rowPinning
                                    .bottom,
                    }
                    : state.rowPinning,

            columnSizing:
                state.columnSizing
                    ? {
                        ...state.columnSizing,
                    }
                    : state.columnSizing,

            columnOrder:
                state.columnOrder
                    ? [
                        ...state.columnOrder,
                    ]
                    : state.columnOrder,
        };
    }
}

```

```typescript
// ============================================================================
// TanStack Grid Engine — plugins.ts (FINAL V4 LOCK)
// Governed Plugin Runtime + Readonly Engine Façade + Dependency Graph
// ============================================================================

import type {
    GridEngine,
    GridPlugin,
    GridPluginContext,
    GridPluginDiagnostics,
} from './types';

import type {RowData} from '@tanstack/table-core';

// ============================================================================
// TYPES
// ============================================================================

export interface GridPluginManagerOptions {
    readonly strict?: boolean;

    readonly logger?: {
        error(
            message: string,
            error?: unknown,
        ): void;
    };
}

interface RegisteredPlugin<
    TData extends RowData,
> {
    readonly plugin: GridPlugin<TData>;

    readonly cleanup?: () => void;
}

// ============================================================================
// PLUGIN MANAGER
// ============================================================================

export class GridPluginManager<
    TData extends RowData,
> {
    private readonly engine: GridEngine<TData>;

    private readonly facade: GridPluginContext<TData>;

    private readonly registry = new Map<
        string,
        RegisteredPlugin<TData>
    >();

    private readonly strict: boolean;

    private readonly logger: Required<
        NonNullable<
            GridPluginManagerOptions['logger']
        >
    >;

    private destroyed = false;

    constructor(
        engine: GridEngine<TData>,
        options?: GridPluginManagerOptions,
    ) {
        this.engine = engine;

        this.strict =
            options?.strict ??
            true;

        // Sonar-safe default logger
        this.logger =
            options?.logger ??
            {
                error: (): void =>
                    undefined,
            };

        this.facade = {
            engine: this.createReadonlyEngineFacade(),
        };
    }

    // =========================================================================
    // REGISTER
    // =========================================================================

    register(
        plugin: GridPlugin<TData>,
    ): void {
        this.assertNotDestroyed();

        try {
            this.registerInternal(
                plugin,
            );
        } catch (error) {
            if (
                this.strict
            ) {
                throw error;
            }

            this.logger.error(
                `Plugin "${plugin.name}" registration failed.`,
                error,
            );
        }
    }

    registerMany(
        plugins: readonly GridPlugin<TData>[],
    ): void {
        const sorted =
            this.resolveDependencyOrder(
                plugins,
            );

        for (const plugin of sorted) {
            this.register(
                plugin,
            );
        }
    }

    private registerInternal(
        plugin: GridPlugin<TData>,
    ): void {
        if (
            this.registry.has(
                plugin.name,
            )
        ) {
            throw new Error(
                `Plugin "${plugin.name}" is already registered.`,
            );
        }

        this.validateDependencies(
            plugin,
        );

        const setupResult =
            plugin.setup(
                this.facade,
            );

        const cleanup =
            typeof setupResult ===
            'function'
                ? setupResult
                : undefined;

        this.registry.set(
            plugin.name,
            {
                plugin,
                cleanup,
            },
        );
    }

    // =========================================================================
    // UNREGISTER
    // =========================================================================

    unregister(
        name: string,
    ): void {
        this.assertNotDestroyed();

        const registered =
            this.registry.get(
                name,
            );

        if (
            !registered
        ) {
            return;
        }

        try {
            registered.cleanup?.();

            registered.plugin.destroy?.(
                this.facade,
            );
        } catch (error) {
            this.logger.error(
                `Plugin "${name}" destroy failed.`,
                error,
            );
        }

        this.registry.delete(
            name,
        );
    }

    // =========================================================================
    // ACCESS
    // =========================================================================

    has(
        name: string,
    ): boolean {
        return this.registry.has(
            name,
        );
    }

    getPlugin(
        name: string,
    ):
        | Readonly<
        GridPlugin<TData>
    >
        | undefined {
        return this.registry.get(
            name,
        )?.plugin;
    }

    getRegisteredNames(): readonly string[] {
        return Object.freeze(
            [
                ...this.registry.keys(),
            ],
        );
    }

    snapshot(): readonly string[] {
        return this.getRegisteredNames();
    }

    diagnostics(): GridPluginDiagnostics {
        const names = [
            ...this.registry.keys(),
        ];

        return Object.freeze(
            {
                registered:
                    Object.freeze(
                        names,
                    ),
                count: names.length,
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

        // LIFO teardown
        const names = [
            ...this.registry.keys(),
        ].reverse();

        for (const name of names) {
            this.unregister(
                name,
            );
        }

        this.destroyed = true;
    }

    reset(): void {
        this.destroy();
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private validateDependencies(
        plugin: GridPlugin<TData>,
    ): void {
        if (
            !plugin
                .dependencies
                ?.length
        ) {
            return;
        }

        for (const dependency of plugin.dependencies) {
            if (
                !this.registry.has(
                    dependency,
                )
            ) {
                throw new Error(
                    `Plugin "${plugin.name}" requires missing dependency "${dependency}".`,
                );
            }
        }
    }

    private resolveDependencyOrder(
        plugins: readonly GridPlugin<TData>[],
    ): readonly GridPlugin<TData>[] {
        const pluginMap =
            new Map<
                string,
                GridPlugin<TData>
            >();

        for (const plugin of plugins) {
            if (
                pluginMap.has(
                    plugin.name,
                )
            ) {
                throw new Error(
                    `Duplicate plugin "${plugin.name}" in bulk registration.`,
                );
            }

            pluginMap.set(
                plugin.name,
                plugin,
            );
        }

        const visited =
            new Set<string>();

        const visiting =
            new Set<string>();

        const sorted: GridPlugin<TData>[] =
            [];

        const visit = (
            plugin: GridPlugin<TData>,
        ): void => {
            if (
                visited.has(
                    plugin.name,
                )
            ) {
                return;
            }

            if (
                visiting.has(
                    plugin.name,
                )
            ) {
                throw new Error(
                    `Circular plugin dependency detected at "${plugin.name}".`,
                );
            }

            visiting.add(
                plugin.name,
            );

            for (const dependency of plugin.dependencies ??
            []) {
                const dependencyPlugin =
                    pluginMap.get(
                        dependency,
                    );

                if (
                    dependencyPlugin
                ) {
                    visit(
                        dependencyPlugin,
                    );
                }
            }

            visiting.delete(
                plugin.name,
            );

            visited.add(
                plugin.name,
            );

            sorted.push(
                plugin,
            );
        };

        for (const plugin of plugins) {
            visit(
                plugin,
            );
        }

        return Object.freeze(
            sorted,
        );
    }

    private createReadonlyEngineFacade(): GridPluginContext<TData>['engine'] {
        return {
            on: this.engine.on.bind(
                this.engine,
            ),

            off: this.engine.off.bind(
                this.engine,
            ),

            once: this.engine.once.bind(
                this.engine,
            ),

            getState:
                this.engine.getState.bind(
                    this.engine,
                ),

            setState:
                this.engine.setState.bind(
                    this.engine,
                ),

            getFeatures:
                this.engine.getFeatures.bind(
                    this.engine,
                ),

            isFeatureEnabled:
                this.engine.isFeatureEnabled.bind(
                    this.engine,
                ),

            canUseFeature:
                this.engine.canUseFeature.bind(
                    this.engine,
                ),

            getMode:
                this.engine.getMode.bind(
                    this.engine,
                ),

            getServerConfig:
                this.engine.getServerConfig.bind(
                    this.engine,
                ),

            getRecordCount:
                this.engine.getRecordCount.bind(
                    this.engine,
                ),

            getRows:
                this.engine.getRows.bind(
                    this.engine,
                ),

            getRowModel:
                this.engine.getRowModel.bind(
                    this.engine,
                ),

            getColumn:
                this.engine.getColumn.bind(
                    this.engine,
                ),

            getAllColumns:
                this.engine.getAllColumns.bind(
                    this.engine,
                ),

            getVisibleLeafColumns:
                this.engine.getVisibleLeafColumns.bind(
                    this.engine,
                ),

            diagnostics:
                this.engine.diagnostics.bind(
                    this.engine,
                ),
        };
    }

    private assertNotDestroyed(): void {
        if (
            this.destroyed
        ) {
            throw new Error(
                'Plugin manager has been destroyed.',
            );
        }
    }
}

```

```
// ============================================================================
// TanStack Grid Engine — render-utils.ts (FINAL V4.2 LOCK)
// Adapter-Neutral flexRender Replacement
// Headless-Safe + SSR-Safe + Primitive + Function Template Runtime
// ============================================================================

export type GridRenderable<TProps> =
    | string
    | number
    | boolean
    | null
    | undefined
    | ((props: TProps) => any);

/**
 * Adapter-neutral render runtime.
 *
 * Compatible with:
 * - String headers
 * - Numeric values
 * - Boolean templates
 * - Null / undefined
 * - Function renderers (TanStack style)
 *
 * Intentionally does NOT depend on framework adapters
 * like React/Vue/Solid.
 */
export function gridFlexRender<TProps>(
    template: GridRenderable<TProps>,
    props: TProps,
): unknown {
    if (template == null) {
        return null;
    }

    if (typeof template === 'function') {
        return (template as (props: TProps) => any)(
            props,
        );
    }

    return template;
}

```

```javascript
// ============================================================================
// TanStack Grid Engine — rendering.ts (FINAL V4.3 HARD LOCK)
// Adapter-Neutral Rendering Runtime + Direct Table Injection + Diagnostics
// ============================================================================

import type {
    Cell,
    Column,
    Header,
    Row,
    RowData,
    Table,
} from '@tanstack/table-core';

import {
    gridFlexRender,
    type GridRenderable,
} from './render-utils';

// ============================================================================
// NORMALIZED RENDER CONTRACTS
// ============================================================================

export interface GridRenderableHeader<TData extends RowData> {
    readonly id: string;
    readonly columnId: string;
    readonly depth: number;
    readonly index: number;
    readonly colSpan: number;
    readonly rowSpan: number;
    readonly isPlaceholder: boolean;
    readonly isPinned: false | 'left' | 'right';
    readonly size: number;
    readonly column: Column<TData, unknown>;
    readonly header: Header<TData, unknown>;
    readonly rendered: unknown;
}

export interface GridRenderableCell<TData extends RowData> {
    readonly id: string;
    readonly rowId: string;
    readonly columnId: string;
    readonly value: unknown;
    readonly rendered: unknown;
    readonly size: number;
    readonly isPinned: false | 'left' | 'right';
    readonly column: Column<TData, unknown>;
    readonly cell: Cell<TData, unknown>;
    readonly row: Row<TData>;
}

export interface GridRenderableRow<TData extends RowData> {
    readonly id: string;
    readonly index: number;
    readonly depth: number;
    readonly isSelected: boolean;
    readonly isExpanded: boolean;
    readonly isPinned: false | 'top' | 'bottom';
    readonly original: TData;
    readonly row: Row<TData>;
    readonly cells: readonly GridRenderableCell<TData>[];
}

export interface GridRenderableFooter<TData extends RowData> {
    readonly id: string;
    readonly columnId: string;
    readonly depth: number;
    readonly colSpan: number;
    readonly rowSpan: number;
    readonly isPlaceholder: boolean;
    readonly isPinned: false | 'left' | 'right';
    readonly size: number;
    readonly column: Column<TData, unknown>;
    readonly header: Header<TData, unknown>;
    readonly rendered: unknown;
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

export interface GridRenderingDiagnostics {
    readonly headerGroups: number;
    readonly flatHeaders: number;
    readonly leafHeaders: number;
    readonly footerGroups: number;
    readonly visibleRows: number;
    readonly coreRows: number;
}

// ============================================================================
// RENDERING MANAGER
// ============================================================================

export class GridRenderingManager<TData extends RowData> {
    private readonly table: Table<TData>;

    constructor(
        table: Table<TData>,
    ) {
        this.table = table;
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private emptyArray<T>(): readonly T[] {
        return Object.freeze(
            [],
        );
    }

    private freezeArray<T>(
        values: readonly T[]
    ): readonly T[] {
        if (
            Object.isFrozen(
                values,
            )
        ) {
            return values;
        }

        return Object.freeze(
            values,
        );
    }

    private renderTemplate<TProps>(
        template: GridRenderable<TProps>,
        props: TProps,
    ): unknown {
        return gridFlexRender(
            template,
            props,
        );
    }

    private getColumnPinState(
        column: Column<TData, unknown>,
    ): false | 'left' | 'right' {
        if (
            typeof column.getIsPinned ===
            'function'
        ) {
            return column.getIsPinned();
        }

        return false;
    }

    private getRowPinState(
        row: Row<TData>,
    ): false | 'top' | 'bottom' {
        if (
            typeof row.getIsPinned ===
            'function'
        ) {
            return row.getIsPinned();
        }

        return false;
    }

    // =========================================================================
    // HEADERS
    // =========================================================================

    private mapHeader(
        header: Header<TData, unknown>,
    ): GridRenderableHeader<TData> {
        return Object.freeze({
            id: header.id,
            columnId:
            header.column.id,
            depth:
            header.depth,
            index:
            header.index,
            colSpan:
            header.colSpan,
            rowSpan:
                header.rowSpan ??
                1,
            isPlaceholder:
            header.isPlaceholder,
            isPinned:
                this.getColumnPinState(
                    header.column,
                ),
            size:
                header.getSize(),
            column:
            header.column,
            header,
            rendered:
                header.isPlaceholder
                    ? null
                    : this.renderTemplate(
                        header.column
                            .columnDef
                            .header as GridRenderable<
                            ReturnType<
                                typeof header.getContext
                            >
                        >,
                        header.getContext(),
                    ),
        });
    }

    getHeaderGroups(): readonly (readonly GridRenderableHeader<TData>[])[] {
        return this.freezeArray(
            this.table
                .getHeaderGroups()
                .map(
                    (
                        group,
                    ) =>
                        this.freezeArray(
                            group.headers.map(
                                (
                                    header,
                                ) =>
                                    this.mapHeader(
                                        header,
                                    ),
                            ),
                        ),
                ),
        );
    }

    getFlatHeaders(): readonly GridRenderableHeader<TData>[] {
        return this.freezeArray(
            this.table
                .getFlatHeaders()
                .map(
                    (
                        header,
                    ) =>
                        this.mapHeader(
                            header,
                        ),
                ),
        );
    }

    getLeafHeaders(): readonly GridRenderableHeader<TData>[] {
        return this.freezeArray(
            this.table
                .getLeafHeaders()
                .map(
                    (
                        header,
                    ) =>
                        this.mapHeader(
                            header,
                        ),
                ),
        );
    }

    // =========================================================================
    // FOOTERS
    // =========================================================================

    private mapFooter(
        header: Header<TData, unknown>,
    ): GridRenderableFooter<TData> {
        return Object.freeze({
            id: header.id,
            columnId:
            header.column.id,
            depth:
            header.depth,
            colSpan:
            header.colSpan,
            rowSpan:
                header.rowSpan ??
                1,
            isPlaceholder:
            header.isPlaceholder,
            isPinned:
                this.getColumnPinState(
                    header.column,
                ),
            size:
                header.getSize(),
            column:
            header.column,
            header,
            rendered:
                header.isPlaceholder
                    ? null
                    : this.renderTemplate(
                        header.column
                            .columnDef
                            .footer as GridRenderable<
                            ReturnType<
                                typeof header.getContext
                            >
                        >,
                        header.getContext(),
                    ),
        });
    }

    getFooterGroups(): readonly (readonly GridRenderableFooter<TData>[])[] {
        return this.freezeArray(
            this.table
                .getFooterGroups()
                .map(
                    (
                        group,
                    ) =>
                        this.freezeArray(
                            group.headers.map(
                                (
                                    header,
                                ) =>
                                    this.mapFooter(
                                        header,
                                    ),
                            ),
                        ),
                ),
        );
    }

    // =========================================================================
    // CELLS
    // =========================================================================

    private mapCell(
        cell: Cell<TData, unknown>,
    ): GridRenderableCell<TData> {
        return Object.freeze({
            id: cell.id,
            rowId:
            cell.row.id,
            columnId:
            cell.column.id,
            value:
                cell.getValue(),
            rendered:
                this.renderTemplate(
                    cell.column
                        .columnDef
                        .cell as GridRenderable<
                        ReturnType<
                            typeof cell.getContext
                        >
                    >,
                    cell.getContext(),
                ),
            size:
                cell.column.getSize(),
            isPinned:
                this.getColumnPinState(
                    cell.column,
                ),
            column:
            cell.column,
            cell,
            row:
            cell.row,
        });
    }

    getVisibleCells(
        rowId: string,
    ): readonly GridRenderableCell<TData>[] {
        const row =
            this.table
                .getRowModel()
                .rowsById[
                rowId
                ];

        if (!row) {
            return this.emptyArray();
        }

        return this.freezeArray(
            row
                .getVisibleCells()
                .map(
                    (
                        cell,
                    ) =>
                        this.mapCell(
                            cell,
                        ),
                ),
        );
    }

    getAllCells(
        rowId: string,
    ): readonly GridRenderableCell<TData>[] {
        const row =
            this.table
                .getRowModel()
                .rowsById[
                rowId
                ];

        if (!row) {
            return this.emptyArray();
        }

        return this.freezeArray(
            row
                .getAllCells()
                .map(
                    (
                        cell,
                    ) =>
                        this.mapCell(
                            cell,
                        ),
                ),
        );
    }

    // =========================================================================
    // ROWS
    // =========================================================================

    private mapRow(
        row: Row<TData>,
    ): GridRenderableRow<TData> {
        return Object.freeze({
            id: row.id,
            index:
            row.index,
            depth:
            row.depth,
            isSelected:
                typeof row.getIsSelected ===
                'function'
                    ? row.getIsSelected()
                    : false,
            isExpanded:
                typeof row.getIsExpanded ===
                'function'
                    ? row.getIsExpanded()
                    : false,
            isPinned:
                this.getRowPinState(
                    row,
                ),
            original:
            row.original,
            row,
            cells:
                this.freezeArray(
                    row
                        .getVisibleCells()
                        .map(
                            (
                                cell,
                            ) =>
                                this.mapCell(
                                    cell,
                                ),
                        ),
                ),
        });
    }

    getVisibleRows(): readonly GridRenderableRow<TData>[] {
        return this.freezeArray(
            this.table
                .getRowModel()
                .rows.map(
                (
                    row,
                ) =>
                    this.mapRow(
                        row,
                    ),
            ),
        );
    }

    getCoreRows(): readonly GridRenderableRow<TData>[] {
        return this.freezeArray(
            this.table
                .getCoreRowModel()
                .rows.map(
                (
                    row,
                ) =>
                    this.mapRow(
                        row,
                    ),
            ),
        );
    }

    getPinnedTopRows(): readonly GridRenderableRow<TData>[] {
        if (
            typeof this.table
                .getTopRows !==
            'function'
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            this.table
                .getTopRows()
                .map(
                    (
                        row,
                    ) =>
                        this.mapRow(
                            row,
                        ),
                ),
        );
    }

    getPinnedBottomRows(): readonly GridRenderableRow<TData>[] {
        if (
            typeof this.table
                .getBottomRows !==
            'function'
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            this.table
                .getBottomRows()
                .map(
                    (
                        row,
                    ) =>
                        this.mapRow(
                            row,
                        ),
                ),
        );
    }

    getRow(
        rowId: string,
    ): GridRenderableRow<TData> | undefined {
        const row =
            this.table
                .getRowModel()
                .rowsById[
                rowId
                ];

        return row
            ? this.mapRow(
                row,
            )
            : undefined;
    }

    // =========================================================================
    // COLUMNS
    // =========================================================================

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

    // =========================================================================
    // DIRECT RENDER HELPERS
    // =========================================================================

    renderHeader(
        header: Header<TData, unknown>,
    ): unknown {
        if (
            header.isPlaceholder
        ) {
            return null;
        }

        return this.renderTemplate(
            header.column
                .columnDef
                .header as GridRenderable<
                ReturnType<
                    typeof header.getContext
                >
            >,
            header.getContext(),
        );
    }

    renderCell(
        cell: Cell<TData, unknown>,
    ): unknown {
        return this.renderTemplate(
            cell.column
                .columnDef
                .cell as GridRenderable<
                ReturnType<
                    typeof cell.getContext
                >
            >,
            cell.getContext(),
        );
    }

    renderFooter(
        header: Header<TData, unknown>,
    ): unknown {
        if (
            header.isPlaceholder
        ) {
            return null;
        }

        return this.renderTemplate(
            header.column
                .columnDef
                .footer as GridRenderable<
                ReturnType<
                    typeof header.getContext
                >
            >,
            header.getContext(),
        );
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridRenderingDiagnostics {
        return Object.freeze({
            headerGroups:
            this.table
                .getHeaderGroups()
                .length,
            flatHeaders:
            this.table
                .getFlatHeaders()
                .length,
            leafHeaders:
            this.table
                .getLeafHeaders()
                .length,
            footerGroups:
            this.table
                .getFooterGroups()
                .length,
            visibleRows:
            this.table
                .getRowModel()
                .rows.length,
            coreRows:
            this.table
                .getCoreRowModel()
                .rows.length,
        });
    }

    isEmpty(): boolean {
        return (
            this.table
                .getRowModel()
                .rows.length === 0
        );
    }

    getVisibleColumnCount(): number {
        return this.table
            .getVisibleLeafColumns()
            .length;
    }

    getVisibleRowCount(): number {
        return this.table
            .getRowModel()
            .rows.length;
    }

    getTotalColumnWidth(): number {
        return this.table
            .getVisibleLeafColumns()
            .reduce(
                (
                    total,
                    column,
                ) =>
                    total +
                    column.getSize(),
                0,
            );
    }
}

```

```typescript
// ============================================================================
// TanStack Grid Engine — server.ts (FINAL V4.3 HARD LOCK)
// Governance-Safe Server Orchestration Runtime
// Normalized Query + Manual Mode + Race Protection + Validation + Diagnostics
// ============================================================================

import type {RowData} from '@tanstack/table-core';

import type {
    GridEngine,
    GridFeatureKey,
} from './types';

// ============================================================================
// SERVER STATUS
// ============================================================================

export type GridServerStatus =
    | 'idle'
    | 'loading'
    | 'success'
    | 'error';

// ============================================================================
// QUERY CONTRACTS
// ============================================================================

export interface GridServerSorting {
    readonly id: string;
    readonly desc: boolean;
}

export interface GridServerFilter {
    readonly id: string;
    readonly value: unknown;
}

export interface GridServerPagination {
    readonly pageIndex: number;
    readonly pageSize: number;
}

export interface GridServerQuery {
    readonly pagination: GridServerPagination;
    readonly sorting: readonly GridServerSorting[];
    readonly filters: readonly GridServerFilter[];
    readonly globalFilter?: unknown;
    readonly grouping: readonly string[];
    readonly expanded?: unknown;
    readonly visibleColumns: readonly string[];
}

// ============================================================================
// RESPONSE CONTRACT
// ============================================================================

export interface GridServerResult<TData extends RowData> {
    readonly rows: readonly TData[];
    readonly recordCount: number;
    readonly meta?: Readonly<Record<string, unknown>>;
}

// ============================================================================
// ADAPTER
// ============================================================================

export type GridServerAdapter<TData extends RowData> = (
    query: GridServerQuery,
) => Promise<GridServerResult<TData>>;

// ============================================================================
// TRANSFORMS
// ============================================================================

export interface GridServerTransforms<TData extends RowData> {
    readonly transformQuery?: (
        query: GridServerQuery,
    ) => GridServerQuery;

    readonly transformResult?: (
        result: GridServerResult<TData>,
    ) => GridServerResult<TData>;
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

export interface GridServerDiagnostics<TData extends RowData> {
    readonly status: GridServerStatus;
    readonly lastQuery?: GridServerQuery;
    readonly lastResult?: GridServerResult<TData>;
    readonly error?: unknown;
    readonly requestId: number;
    readonly activeRequestId: number;
}

// ============================================================================
// OPTIONS
// ============================================================================

export interface GridServerManagerOptions<TData extends RowData>
    extends GridServerTransforms<TData> {
    readonly engine: GridEngine<TData>;
    readonly adapter: GridServerAdapter<TData>;
}

// ============================================================================
// SERVER MANAGER
// ============================================================================

export class GridServerManager<TData extends RowData> {
    private readonly engine: GridEngine<TData>;

    private adapter: GridServerAdapter<TData>;

    private readonly transformQuery?: GridServerTransforms<TData>['transformQuery'];

    private readonly transformResult?: GridServerTransforms<TData>['transformResult'];

    readonly lastMeta?: Readonly<Record<string, unknown>>;

    private status: GridServerStatus = 'idle';

    private lastQuery?: GridServerQuery;

    private lastResult?: GridServerResult<TData>;

    private error?: unknown;

    private requestId = 0;

    private activeRequestId = 0;

    constructor(
        options: GridServerManagerOptions<TData>,
    ) {
        this.engine = options.engine;
        this.adapter = options.adapter;
        this.transformQuery =
            options.transformQuery;
        this.transformResult =
            options.transformResult;
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

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

    private emptyArray<T>(): readonly T[] {
        return Object.freeze(
            [],
        );
    }

    private canSerialize(
        feature: GridFeatureKey,
    ): boolean {
        return this.engine
            .canUseFeature(
                feature,
            )
            .operational;
    }

    private buildPagination(): GridServerPagination {
        const state =
            this.engine.getState();

        if (
            this.canSerialize(
                'pagination',
            ) &&
            state.pagination
        ) {
            return {
                pageIndex:
                state.pagination
                    .pageIndex,
                pageSize:
                state.pagination
                    .pageSize,
            };
        }

        return {
            pageIndex: 0,
            pageSize:
                this.engine
                    .getRecordCount(),
        };
    }

    private buildSorting(): readonly GridServerSorting[] {
        const state =
            this.engine.getState();

        if (
            !this.canSerialize(
                'sorting',
            ) ||
            !Array.isArray(
                state.sorting,
            )
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            state.sorting.map(
                (
                    sort,
                ) => ({
                    id: sort.id,
                    desc: sort.desc,
                }),
            ),
        );
    }

    private buildFilters(): readonly GridServerFilter[] {
        const state =
            this.engine.getState();

        if (
            !this.canSerialize(
                'filtering',
            ) ||
            !Array.isArray(
                state.columnFilters,
            )
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            state.columnFilters.map(
                (
                    filter,
                ) => ({
                    id: filter.id,
                    value:
                    filter.value,
                }),
            ),
        );
    }

    private buildGlobalFilter():
        | unknown
        | undefined {
        const state =
            this.engine.getState();

        if (
            !this.canSerialize(
                'globalFilter',
            )
        ) {
            return undefined;
        }

        return state.globalFilter;
    }

    private buildGrouping(): readonly string[] {
        const state =
            this.engine.getState();

        if (
            !this.canSerialize(
                'grouping',
            ) ||
            !Array.isArray(
                state.grouping,
            )
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            state.grouping,
        );
    }

    private buildExpanded():
        | unknown
        | undefined {
        const state =
            this.engine.getState();

        if (
            !this.canSerialize(
                'expanding',
            )
        ) {
            return undefined;
        }

        return state.expanded;
    }

    private buildVisibleColumns(): readonly string[] {
        if (
            typeof this.engine
                .getVisibleLeafColumns !==
            'function'
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            this.engine
                .getVisibleLeafColumns()
                .map(
                    (
                        column,
                    ) =>
                        column.id,
                ),
        );
    }

    private validateResult(
        result: GridServerResult<TData>,
    ): void {
        if (
            !Array.isArray(
                result.rows,
            )
        ) {
            throw new Error(
                'Server result rows must be an array.',
            );
        }

        if (
            typeof result.recordCount !==
            'number' ||
            !Number.isFinite(
                result.recordCount,
            )
        ) {
            throw new Error(
                'Server result recordCount must be a finite number.',
            );
        }

        if (
            result.recordCount < 0
        ) {
            throw new Error(
                'Server result recordCount cannot be negative.',
            );
        }
    }

    // =========================================================================
    // QUERY
    // =========================================================================

    buildQuery(): GridServerQuery {
        const query: GridServerQuery =
            {
                pagination:
                    this.buildPagination(),
                sorting:
                    this.buildSorting(),
                filters:
                    this.buildFilters(),
                globalFilter:
                    this.buildGlobalFilter(),
                grouping:
                    this.buildGrouping(),
                expanded:
                    this.buildExpanded(),
                visibleColumns:
                    this.buildVisibleColumns(),
            };

        return this.transformQuery
            ? this.transformQuery(
                query,
            )
            : query;
    }

    // =========================================================================
    // FETCH
    // =========================================================================

    async fetch(): Promise<
        GridServerResult<TData>
    > {
        const requestId =
            ++this.requestId;

        this.activeRequestId =
            requestId;

        this.status =
            'loading';

        this.error =
            undefined;

        const query =
            this.buildQuery();

        this.lastQuery =
            query;

        try {
            const rawResult =
                await this.adapter(
                    query,
                );

            if (
                requestId !==
                this.activeRequestId
            ) {
                return (
                    this.lastResult ??
                    {
                        rows: [],
                        recordCount: 0,
                    }
                );
            }

            this.validateResult(
                rawResult,
            );

            const result =
                this.transformResult
                    ? this.transformResult(
                        rawResult,
                    )
                    : rawResult;

            this.engine.setData(
                result.rows,
            );

            this.engine.setRecordCount(
                result.recordCount,
            );

            this.lastResult =
                result;

            this.status =
                'success';

            return result;
        } catch (error) {
            if (
                requestId !==
                this.activeRequestId
            ) {
                return (
                    this.lastResult ??
                    {
                        rows: [],
                        recordCount: 0,
                    }
                );
            }

            this.status =
                'error';

            this.error =
                error;

            return Promise.reject(
                error,
            );
        }
    }

    async refetch(): Promise<
        GridServerResult<TData>
    > {
        return this.fetch();
    }

    // =========================================================================
    // CONTROL
    // =========================================================================

    setAdapter(
        adapter: GridServerAdapter<TData>,
    ): void {
        this.adapter =
            adapter;
    }

    cancel(): void {
        this.activeRequestId++;

        this.status =
            'idle';

        this.error =
            undefined;
    }

    reset(
        options?: {
            readonly clearRows?: boolean;
        },
    ): void {
        this.status =
            'idle';

        this.lastQuery =
            undefined;

        this.lastResult =
            undefined;

        this.error =
            undefined;

        this.requestId = 0;

        this.activeRequestId = 0;

        if (
            options?.clearRows
        ) {
            this.engine.setData(
                [],
            );

            this.engine.setRecordCount(
                0,
            );
        }
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    getStatus(): GridServerStatus {
        return this.status;
    }

    getLastQuery():
        | GridServerQuery
        | undefined {
        return this.lastQuery;
    }

    getLastResult():
        | GridServerResult<TData>
        | undefined {
        return this.lastResult;
    }

    getError():
        | unknown
        | undefined {
        return this.error;
    }

    diagnostics(): GridServerDiagnostics<TData> {
        return Object.freeze(
            {
                status:
                this.status,
                lastQuery:
                this.lastQuery,
                lastResult:
                this.lastResult,
                lastMeta:
                this.lastResult
                    ?.meta,
                error:
                this.error,
                requestId:
                this.requestId,
                activeRequestId:
                this.activeRequestId,
            },
        );
    }

    getLastMeta():
        | Readonly<Record<string, unknown>>
        | undefined {
        return this.lastResult
            ?.meta;
    }
}

```

```typescript
// ============================================================================
// TanStack Grid Engine — types.ts (FINAL V4.7 ABSOLUTE HARD LOCK)
// Canonical Contract Authority + Engine/Core Parity + Lifecycle Governance
// Event Symmetry + Rendering + Mutation + Persistence + Plugin Finalization
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

// ============================================================================
// CORE MODES
// ============================================================================

export type GridMode =
    | 'client'
    | 'server';

// ============================================================================
// FEATURE KEYS
// ============================================================================

export type GridFeatureKey =
    | 'sorting'
    | 'filtering'
    | 'globalFilter'
    | 'pagination'
    | 'rowSelection'
    | 'columnVisibility'
    | 'columnPinning'
    | 'rowPinning'
    | 'grouping'
    | 'expanding'
    | 'columnSizing'
    | 'columnOrdering'
    | 'faceting';

// ============================================================================
// FEATURE CONFIG
// ============================================================================

export interface GridFeatureConfig {
    readonly sorting: boolean;
    readonly filtering: boolean;
    readonly globalFilter: boolean;
    readonly pagination: boolean;
    readonly rowSelection: boolean;
    readonly columnVisibility: boolean;
    readonly columnPinning: boolean;
    readonly rowPinning: boolean;
    readonly grouping: boolean;
    readonly expanding: boolean;
    readonly columnSizing: boolean;
    readonly columnOrdering: boolean;
    readonly faceting: boolean;
}

// ============================================================================
// SERVER CONFIG
// ============================================================================

export interface GridServerConfig {
    readonly enabled: boolean;
    readonly manualSorting: boolean;
    readonly manualFiltering: boolean;
    readonly manualPagination: boolean;
    readonly manualGrouping: boolean;
}

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_GRID_FEATURES: GridFeatureConfig = {
    sorting: true,
    filtering: true,
    globalFilter: true,
    pagination: true,
    rowSelection: true,
    columnVisibility: true,
    columnPinning: true,
    rowPinning: true,
    grouping: true,
    expanding: true,
    columnSizing: true,
    columnOrdering: true,
    faceting: true,
};

export const DEFAULT_GRID_SERVER_CONFIG: GridServerConfig = {
    enabled: false,
    manualSorting: false,
    manualFiltering: false,
    manualPagination: false,
    manualGrouping: false,
};

// ============================================================================
// FEATURE SNAPSHOTS
// ============================================================================

export interface GridFeatureSnapshot {
    readonly mode: GridMode;
    readonly features: Readonly<GridFeatureConfig>;
    readonly server: Readonly<GridServerConfig>;
}

export interface GridFeatureUsage {
    readonly enabled: boolean;
    readonly operational: boolean;
}

export interface GridFeatureDiagnostics {
    readonly mode: GridMode;
    readonly disabled: readonly GridFeatureKey[];
    readonly manual: readonly GridFeatureKey[];
}

// ============================================================================
// EXPORT / PERSISTENCE
// ============================================================================

export interface GridExportState {
    readonly state: TableState;
    readonly features: Readonly<GridFeatureConfig>;
    readonly server: Readonly<GridServerConfig>;
    readonly recordCount: number;
    readonly mode: GridMode;
}

export interface GridPersistenceSnapshot
    extends GridExportState {
    readonly version: number;
    readonly timestamp: number;
}

// ============================================================================
// RESET
// ============================================================================

export type GridResetScope =
    | 'all'
    | 'state'
    | 'features'
    | 'plugins'
    | 'events';

// ============================================================================
// EVENTS
// ============================================================================

export interface GridEventMap<TData extends RowData> {
    readonly stateChange: {
        readonly previous: TableState;
        readonly current: TableState;
    };

    readonly featureChange: {
        readonly previous: GridFeatureSnapshot;
        readonly current: GridFeatureSnapshot;
    };

    readonly dataChange: {
        readonly recordCount: number;
        readonly rows: readonly TData[];
    };

    readonly pluginRegistered: {
        readonly name: string;
    };

    readonly pluginUnregistered: {
        readonly name: string;
    };

    readonly reset: {
        readonly scope: GridResetScope;
    };

    readonly error: {
        readonly message: string;
        readonly error?: unknown;
    };
}

export type GridEventKey<TData extends RowData> =
    keyof GridEventMap<TData>;

export type GridEventHandler<
    TData extends RowData,
    TEvent extends GridEventKey<TData>,
> = (
    payload: GridEventMap<TData>[TEvent],
) => void;

export type GridEventUnsubscribe =
    () => void;

export interface GridEventDiagnostics<
    TData extends RowData,
> {
    readonly listeners: Readonly<
        Partial<
            Record<
                GridEventKey<TData>,
                number
            >
        >
    >;
}

// ============================================================================
// PLUGINS
// ============================================================================

export interface GridPluginDiagnostics {
    readonly registered: readonly string[];
    readonly count: number;
}

export interface GridPluginReadonlyContext<
    TData extends RowData,
> {
    readonly engine: Pick<
        GridEngine<TData>,
        | 'on'
        | 'off'
        | 'once'
        | 'getState'
        | 'setState'
        | 'getFeatures'
        | 'isFeatureEnabled'
        | 'canUseFeature'
        | 'getMode'
        | 'getServerConfig'
        | 'getRecordCount'
        | 'getRows'
        | 'getRowModel'
        | 'getColumn'
        | 'getAllColumns'
        | 'getVisibleLeafColumns'
        | 'diagnostics'
    >;
}

export type GridPluginContext<
    TData extends RowData,
> = GridPluginReadonlyContext<TData>;

export interface GridPlugin<
    TData extends RowData,
> {
    readonly name: string;
    readonly version?: string;
    readonly dependencies?: readonly string[];

    setup(
        context: GridPluginReadonlyContext<TData>,
    ): void | (() => void);

    destroy?(
        context: GridPluginReadonlyContext<TData>,
    ): void;
}

// ============================================================================
// ENGINE DIAGNOSTICS
// ============================================================================

export interface GridEngineDiagnostics<
    TData extends RowData,
> {
    readonly mode: GridMode;
    readonly recordCount: number;
    readonly features: GridFeatureDiagnostics;
    readonly plugins: GridPluginDiagnostics;
    readonly events: GridEventDiagnostics<TData>;
}

// ============================================================================
// ENGINE CONTRACT
// ============================================================================

export interface GridEngine<
    TData extends RowData,
> {
    // =========================================================================
    // EVENTS
    // =========================================================================

    on<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): GridEventUnsubscribe;

    off<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): void;

    once<TEvent extends GridEventKey<TData>>(
        event: TEvent,
        handler: GridEventHandler<TData, TEvent>,
    ): GridEventUnsubscribe;

    // =========================================================================
    // TABLE / OPTIONS
    // =========================================================================

    getTable(): Table<TData>;

    getOptions(): TableOptions<TData>;

    updateOptions(
        updater: Partial<TableOptions<TData>>,
    ): void;

    // =========================================================================
    // STATE
    // =========================================================================

    getState(): Readonly<TableState>;

    setState(
        state:
            | TableState
            | ((
            previous: Readonly<TableState>,
        ) => TableState),
    ): void;

    // =========================================================================
    // FEATURES
    // =========================================================================

    getFeatures(): Readonly<GridFeatureConfig>;

    getMode(): GridMode;

    getServerConfig(): Readonly<GridServerConfig>;

    isFeatureEnabled(
        feature: GridFeatureKey,
    ): boolean;

    canUseFeature(
        feature: GridFeatureKey,
    ): GridFeatureUsage;

    importSnapshot(
        snapshot: Partial<GridFeatureSnapshot>,
    ): void;

    replaceSnapshot(
        snapshot: GridFeatureSnapshot,
    ): void;

    // =========================================================================
    // DATA
    // =========================================================================

    getRows(): readonly TData[];

    getRecordCount(): number;

    setRecordCount(
        count: number,
    ): void;

    setData(
        rows: readonly TData[],
    ): void;

    setColumns(
        columns: readonly ColumnDef<
            TData,
            unknown
        >[],
    ): void;

    addRow?(
        row: TData,
    ): void;

    updateRow?(
        rowId: string,
        updater: (
            currentRow: TData,
        ) => TData,
    ): void;

    patchRow?(
        rowId: string,
        patch: Partial<TData>,
    ): void;

    removeRow?(
        rowId: string,
    ): void;

    replaceRow?(
        rowId: string,
        row: TData,
    ): void;

    // =========================================================================
    // ROW MODELS
    // =========================================================================

    getRowModel(): readonly Row<TData>[];

    getCoreRowModel(): {
        readonly rows: readonly Row<TData>[];
    };

    getFilteredRowModel?(): {
        readonly rows: readonly Row<TData>[];
    };

    getSortedRowModel?(): {
        readonly rows: readonly Row<TData>[];
    };

    getGroupedRowModel?(): {
        readonly rows: readonly Row<TData>[];
    };

    getExpandedRowModel?(): {
        readonly rows: readonly Row<TData>[];
    };

    getPaginationRowModel?(): {
        readonly rows: readonly Row<TData>[];
    };

    getSelectedRowModel?(): {
        readonly rows: readonly Row<TData>[];
    };

    // =========================================================================
    // RENDERING
    // =========================================================================

    getHeaderGroups(): readonly HeaderGroup<TData>[];

    getFooterGroups(): readonly HeaderGroup<TData>[];

    getFlatHeaders(): readonly Header<
        TData,
        unknown
    >[];

    getColumn(
        columnId: string,
    ): Column<TData, unknown> | undefined;

    getRow?(
        rowId: string,
    ): Row<TData> | undefined;

    getAllColumns(): readonly Column<
        TData,
        unknown
    >[];

    getAllLeafColumns?(): readonly Column<
        TData,
        unknown
    >[];

    getVisibleLeafColumns(): readonly Column<
        TData,
        unknown
    >[];

    // =========================================================================
    // FEATURE WRAPPERS
    // =========================================================================

    setSorting?(
        updater: Updater<any>,
    ): void;

    setColumnFilters?(
        updater: Updater<any>,
    ): void;

    setGlobalFilter?(
        value: unknown,
    ): void;

    setPagination?(
        updater: Updater<any>,
    ): void;

    setPageIndex?(
        updater: Updater<number>,
    ): void;

    setPageSize?(
        updater: Updater<number>,
    ): void;

    setRowSelection?(
        updater: Updater<any>,
    ): void;

    setColumnVisibility?(
        updater: Updater<any>,
    ): void;

    setColumnPinning?(
        updater: Updater<any>,
    ): void;

    setRowPinning?(
        updater: Updater<any>,
    ): void;

    setGrouping?(
        updater: Updater<any>,
    ): void;

    setExpanded?(
        updater: Updater<any>,
    ): void;

    setColumnOrder?(
        updater: Updater<string[]>,
    ): void;

    // =========================================================================
    // RESET / LIFECYCLE
    // =========================================================================

    reset(
        scope?: GridResetScope,
    ): void;

    destroy?(): void;

    // =========================================================================
    // SNAPSHOT / DIAGNOSTICS
    // =========================================================================

    exportState(): GridExportState;

    diagnostics(): GridEngineDiagnostics<TData>;
}

```

```typescript
// ============================================================================
// TanStack Grid Engine — index.ts (FINAL VISION HARD LOCK)
// Canonical Public Entry Surface + Zero-Gap Barrel + Type/Runtime Unification
// ============================================================================

// ============================================================================
// CORE RUNTIME
// ============================================================================

export * from './core';
export * from './engine';

// ============================================================================
// SUBSYSTEMS
// ============================================================================

export * from './events';
export * from './features';
export * from './mutations';
export * from './faceting';
export * from './server';
export * from './rendering';
export * from './render-utils';
export * from './persistence';
export * from './plugins';

// ============================================================================
// CANONICAL TYPES (LAST EXPORT WINS FOR SHARED CONTRACT AUTHORITY)
// ============================================================================

export * from './types';

```
