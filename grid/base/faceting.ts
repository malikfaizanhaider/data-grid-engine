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
