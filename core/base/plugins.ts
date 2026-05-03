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
