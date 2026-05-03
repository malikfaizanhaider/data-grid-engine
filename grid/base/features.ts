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
