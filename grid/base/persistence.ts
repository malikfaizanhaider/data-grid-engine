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
