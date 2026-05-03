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
