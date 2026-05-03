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
