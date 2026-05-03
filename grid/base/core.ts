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
