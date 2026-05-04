// ============================================================================
// TanStack Grid Engine — factory.ts (FINAL V2 ABSOLUTE HARD LOCK)
// Canonical Productization Layer + Preset Governance + Builder Composition
// Misconfiguration-Hardened + Readonly-Safe + Dependency-Validated
// ============================================================================

import type {
    ColumnDef,
    RowData,
    Table,
} from '@tanstack/table-core';

import {
    GridCore,
    type GridCoreOptions,
} from './core';

import type {
    GridFeatureConfig,
    GridPlugin,
} from './types';

import type {
    GridPersistenceOptions,
} from './persistence';

import type {
    GridServerAdapter,
    GridServerTransforms,
} from './server';

// ============================================================================
// PRESET TYPES
// ============================================================================

export type GridFactoryPreset =
    | 'client'
    | 'server'
    | 'analytics'
    | 'headless';

export interface GridFactoryOptions<
    TData extends RowData,
> extends Omit<
    GridCoreOptions<TData>,
    'features'
> {
    readonly preset?: GridFactoryPreset;
    readonly features?: Partial<GridFeatureConfig>;
}

// ============================================================================
// INTERNAL BUILDER STATE
// ============================================================================

type GridBuilderState<
    TData extends RowData,
> = {
    table?: Table<TData>;
    data?: readonly TData[];
    columns?: readonly ColumnDef<TData, unknown>[];
    getRowId?: (
        row: TData,
    ) => string;
    initialState?: GridCoreOptions<TData>['initialState'];
    preset?: GridFactoryPreset;
    features?: Partial<GridFeatureConfig>;
    plugins?: readonly GridPlugin<TData>[];
    persistence?: GridPersistenceOptions;
    server?: GridServerAdapter<TData>;
    serverTransforms?: GridServerTransforms<TData>;
    strict?: boolean;
    metadata?: Readonly<Record<string, unknown>>;
};

// ============================================================================
// FEATURE PRESETS
// ============================================================================

const CLIENT_PRESET: Readonly<
    Partial<GridFeatureConfig>
> = Object.freeze({
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
});

const SERVER_PRESET: Readonly<
    Partial<GridFeatureConfig>
> = Object.freeze({
    ...CLIENT_PRESET,
});

const ANALYTICS_PRESET: Readonly<
    Partial<GridFeatureConfig>
> = Object.freeze({
    ...CLIENT_PRESET,
    grouping: true,
    faceting: true,
});

const HEADLESS_PRESET: Readonly<
    Partial<GridFeatureConfig>
> = Object.freeze({
    sorting: true,
    filtering: true,
    globalFilter: true,
    pagination: true,
    rowSelection: false,
    columnVisibility: true,
    columnPinning: false,
    rowPinning: false,
    grouping: true,
    expanding: true,
    columnSizing: false,
    columnOrdering: true,
    faceting: true,
});

// ============================================================================
// INTERNAL UTILITIES
// ============================================================================

function freezeObject<T extends object>(
    value: T,
): Readonly<T> {
    if (
        Object.isFrozen(
            value,
        )
    ) {
        return value;
    }

    return Object.freeze({
        ...value,
    });
}

function resolvePreset(
    preset: GridFactoryPreset,
): Partial<GridFeatureConfig> {
    switch (preset) {
        case 'client':
            return CLIENT_PRESET;

        case 'server':
            return SERVER_PRESET;

        case 'analytics':
            return ANALYTICS_PRESET;

        case 'headless':
            return HEADLESS_PRESET;

        default:
            return CLIENT_PRESET;
    }
}

function mergeFeatures(
    preset: Partial<GridFeatureConfig>,
    overrides?: Partial<GridFeatureConfig>,
): Partial<GridFeatureConfig> {
    return freezeObject({
        ...preset,
        ...overrides,
    });
}

function validateServerCompatibility<
    TData extends RowData,
>(
    preset: GridFactoryPreset,
    server?: GridServerAdapter<TData>,
): void {
    if (
        preset === 'server' &&
        !server
    ) {
        throw new Error(
            'Server preset requires a server adapter.',
        );
    }

    if (
        preset !== 'server' &&
        server
    ) {
        throw new Error(
            `Preset "${preset}" does not support server adapter.`,
        );
    }
}

function validateRequiredOptions<
    TData extends RowData,
>(
    options: GridFactoryOptions<TData>,
): void {
    if (
        !options.table
    ) {
        throw new Error(
            'GridFactory requires table.',
        );
    }

    if (
        !options.data
    ) {
        throw new Error(
            'GridFactory requires data.',
        );
    }

    if (
        !options.columns
    ) {
        throw new Error(
            'GridFactory requires columns.',
        );
    }

    if (
        !options.getRowId
    ) {
        throw new Error(
            'GridFactory requires getRowId.',
        );
    }
}

function dedupePlugins<
    TData extends RowData,
>(
    plugins?: readonly GridPlugin<TData>[],
): readonly GridPlugin<TData>[] | undefined {
    if (
        !plugins?.length
    ) {
        return undefined;
    }

    const registry =
        new Map<
            string,
            GridPlugin<TData>
        >();

    for (const plugin of plugins) {
        if (
            registry.has(
                plugin.name,
            )
        ) {
            throw new Error(
                `Duplicate plugin detected: "${plugin.name}".`,
            );
        }

        registry.set(
            plugin.name,
            plugin,
        );
    }

    return Object.freeze(
        [
            ...registry.values(),
        ],
    );
}

// ============================================================================
// CORE FACTORY
// ============================================================================

export function createGrid<
    TData extends RowData,
>(
    options: GridFactoryOptions<TData>,
): GridCore<TData> {
    validateRequiredOptions(
        options,
    );

    const preset =
        options.preset ??
        (
            options.server
                ? 'server'
                : 'client'
        );

    validateServerCompatibility(
        preset,
        options.server,
    );

    const normalizedFeatures =
        mergeFeatures(
            resolvePreset(
                preset,
            ),
            options.features,
        );

    return new GridCore<TData>(
        {
            ...options,
            features:
            normalizedFeatures,
            plugins:
                dedupePlugins(
                    options.plugins,
                ),
            strict:
                options.strict ??
                true,
        },
    );
}

// ============================================================================
// SPECIALIZED FACTORIES
// ============================================================================

export function createClientGrid<
    TData extends RowData,
>(
    options: Omit<
        GridFactoryOptions<TData>,
        'preset' | 'server' | 'serverTransforms'
    >,
): GridCore<TData> {
    return createGrid({
        ...options,
        preset:
            'client',
    });
}

export function createServerGrid<
    TData extends RowData,
>(
    options: Omit<
        GridFactoryOptions<TData>,
        'preset'
    > & {
        readonly server: GridServerAdapter<TData>;
    },
): GridCore<TData> {
    return createGrid({
        ...options,
        preset:
            'server',
    });
}

export function createAnalyticsGrid<
    TData extends RowData,
>(
    options: Omit<
        GridFactoryOptions<TData>,
        'preset' | 'server' | 'serverTransforms'
    >,
): GridCore<TData> {
    return createGrid({
        ...options,
        preset:
            'analytics',
    });
}

export function createHeadlessGrid<
    TData extends RowData,
>(
    options: Omit<
        GridFactoryOptions<TData>,
        'preset' | 'server' | 'serverTransforms'
    >,
): GridCore<TData> {
    return createGrid({
        ...options,
        preset:
            'headless',
    });
}

// ============================================================================
// BUILDER
// ============================================================================

export class GridBuilder<
    TData extends RowData,
> {
    private readonly state: GridBuilderState<TData> =
        {};

    withTable(
        table: Table<TData>,
    ): this {
        this.state.table =
            table;
        return this;
    }

    withData(
        data: readonly TData[],
    ): this {
        this.state.data =
            data;
        return this;
    }

    withColumns(
        columns: readonly ColumnDef<TData, unknown>[],
    ): this {
        this.state.columns =
            columns;
        return this;
    }

    withRowId(
        getRowId: (
            row: TData,
        ) => string,
    ): this {
        this.state.getRowId =
            getRowId;
        return this;
    }

    withInitialState(
        initialState: NonNullable<
            GridCoreOptions<TData>['initialState']
        >,
    ): this {
        this.state.initialState =
            initialState;
        return this;
    }

    withPreset(
        preset: GridFactoryPreset,
    ): this {
        this.state.preset =
            preset;
        return this;
    }

    withFeatures(
        features: Partial<GridFeatureConfig>,
    ): this {
        this.state.features =
            features;
        return this;
    }

    withPlugins(
        plugins: readonly GridPlugin<TData>[],
    ): this {
        this.state.plugins =
            plugins;
        return this;
    }

    withPersistence(
        persistence: GridPersistenceOptions,
    ): this {
        this.state.persistence =
            persistence;
        return this;
    }

    withServer(
        server: GridServerAdapter<TData>,
        transforms?: GridServerTransforms<TData>,
    ): this {
        this.state.server =
            server;
        this.state.serverTransforms =
            transforms;
        return this;
    }

    withStrict(
        strict: boolean,
    ): this {
        this.state.strict =
            strict;
        return this;
    }

    withMetadata(
        metadata: Readonly<Record<string, unknown>>,
    ): this {
        this.state.metadata =
            metadata;
        return this;
    }

    build(): GridCore<TData> {
        const {
            table,
            data,
            columns,
            getRowId,
        } = this.state;

        if (
            !table ||
            !data ||
            !columns ||
            !getRowId
        ) {
            throw new Error(
                'GridBuilder requires table, data, columns, and getRowId before build().',
            );
        }

        return createGrid(
            {
                ...this.state,
                table,
                data,
                columns,
                getRowId,
            },
        );
    }
}
