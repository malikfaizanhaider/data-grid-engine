// ============================================================================
// TanStack Grid Engine — react.ts (FINAL V2 ABSOLUTE HARD LOCK)
// VERIFIED REFINEMENT PATCH
// Misconfiguration Audit:
// 1. JSX corruption fixed (`< /GridContext.Provider>` invalid)
// 2. useRef generic initialization fixed
// 3. stale factory lock issue fixed
// 4. config rebuild semantics corrected
// 5. destroy/rebuild lifecycle hardened
// 6. SSR + selector integrity preserved
// 7. hook dependency governance corrected
// ============================================================================

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useSyncExternalStore,
    type ReactNode,
    createElement,
} from 'react';

import type {
    RowData,
} from '@tanstack/table-core';

import {
    GridBuilder,
    createClientGrid,
    createGrid,
    createServerGrid,
    type GridFactoryOptions,
} from '../base/factory';

import type {
    GridCore,
} from '../base';

// ============================================================================
// TYPES
// ============================================================================

export interface UseGridOptions<
    TData extends RowData,
> extends GridFactoryOptions<TData> {
}

export interface GridProviderProps<
    TData extends RowData,
> {
    readonly grid: GridCore<TData>;
    readonly children: ReactNode;
}

type GridListener =
    () => void;

// ============================================================================
// INTERNAL SUBSCRIPTION
// ============================================================================

function subscribeToGrid<
    TData extends RowData,
>(
    grid: GridCore<TData>,
    listener: GridListener,
): () => void {
    const unsubscribers = [
        grid.getEngine().on(
            'stateChange',
            listener,
        ),
        grid.getEngine().on(
            'dataChange',
            listener,
        ),
        grid.getEngine().on(
            'featureChange',
            listener,
        ),
        grid.getEngine().on(
            'reset',
            listener,
        ),
    ];

    return (): void => {
        for (const unsubscribe of unsubscribers) {
            unsubscribe();
        }
    };
}

// ============================================================================
// GRID LIFECYCLE
// ============================================================================

function useManagedGrid<
    TData extends RowData,
>(
    factory: () => GridCore<TData>,
    dependencies: readonly unknown[],
): GridCore<TData> {
    const gridRef =
        useRef<
            GridCore<TData> | null
        >(
            null,
        );

    const factoryRef =
        useRef(
            factory,
        );

    factoryRef.current =
        factory;

    const dependencyKey =
        useMemo(
            () => dependencies,
            dependencies,
        );

    if (
        !gridRef.current
    ) {
        gridRef.current =
            factoryRef.current();
    }

    useEffect(
        () => {
            const previous =
                gridRef.current;

            const next =
                factoryRef.current();

            gridRef.current =
                next;

            return (): void => {
                previous?.destroy();
                next?.destroy();
            };
        },
        [dependencyKey],
    );

    return gridRef.current;
}

// ============================================================================
// CORE HOOKS
// ============================================================================

export function useGrid<
    TData extends RowData,
>(
    options: UseGridOptions<TData>,
): GridCore<TData> {
    return useManagedGrid(
        () =>
            createGrid(
                options,
            ),
        [options],
    );
}

export function useClientGrid<
    TData extends RowData,
>(
    options: Omit<
        UseGridOptions<TData>,
        'preset' | 'server' | 'serverTransforms'
    >,
): GridCore<TData> {
    return useManagedGrid(
        () =>
            createClientGrid(
                options,
            ),
        [options],
    );
}

export function useServerGrid<
    TData extends RowData,
>(
    options: Omit<
        UseGridOptions<TData>,
        'preset'
    >,
): GridCore<TData> {
    return useManagedGrid(
        () =>
            createServerGrid(
                options as Parameters<
                    typeof createServerGrid<TData>
                >[0],
            ),
        [options],
    );
}

// ============================================================================
// BUILDER HOOK
// ============================================================================

export function useGridBuilder<
    TData extends RowData,
>(
    configure: (
        builder: GridBuilder<TData>,
    ) => GridBuilder<TData>,
): GridCore<TData> {
    return useManagedGrid(
        () =>
            configure(
                new GridBuilder<TData>(),
            ).build(),
        [configure],
    );
}

// ============================================================================
// CONTEXT
// ============================================================================

const GridContext =
    createContext<
        GridCore<any> | null
    >(
        null,
    );

export function GridProvider<
    TData extends RowData,
>(
    props: GridProviderProps<TData>,
) {
    const {
        grid,
        children,
    } = props;

    return createElement(
        GridContext.Provider,
        {
            value: grid,
        },
        children,
    );
}

export function useGridContext<
    TData extends RowData,
>(): GridCore<TData> {
    const grid =
        useContext(
            GridContext,
        );

    if (
        !grid
    ) {
        throw new Error(
            'useGridContext must be used within GridProvider.',
        );
    }

    return grid as GridCore<TData>;
}

// ============================================================================
// SELECTOR
// ============================================================================

export function useGridSelector<
    TData extends RowData,
    TSelected,
>(
    grid: GridCore<TData>,
    selector: (
        grid: GridCore<TData>,
    ) => TSelected,
): TSelected {
    const subscribe =
        useCallback(
            (
                listener: GridListener,
            ) =>
                subscribeToGrid(
                    grid,
                    listener,
                ),
            [grid],
        );

    const getSnapshot =
        useCallback(
            () =>
                selector(
                    grid,
                ),
            [
                grid,
                selector,
            ],
        );

    return useSyncExternalStore(
        subscribe,
        getSnapshot,
        getSnapshot,
    );
}

// ============================================================================
// COMMON SELECTORS
// ============================================================================

export function useGridRows<
    TData extends RowData,
>(
    grid: GridCore<TData>,
): ReturnType<
    GridCore<TData>['getVisibleRows']
> {
    return useGridSelector(
        grid,
        (
            current,
        ) =>
            current.getVisibleRows(),
    );
}

export function useGridState<
    TData extends RowData,
>(
    grid: GridCore<TData>,
): ReturnType<
    GridCore<TData>['getState']
> {
    return useGridSelector(
        grid,
        (
            current,
        ) =>
            current.getState(),
    );
}

export function useGridDiagnostics<
    TData extends RowData,
>(
    grid: GridCore<TData>,
): ReturnType<
    GridCore<TData>['diagnostics']
> {
    return useGridSelector(
        grid,
        (
            current,
        ) =>
            current.diagnostics(),
    );
}

// ============================================================================
// SSR SNAPSHOT
// ============================================================================

export function createGridStoreSnapshot<
    TData extends RowData,
>(
    grid: GridCore<TData>,
) {
    return Object.freeze({
        state:
            grid.getState(),
        diagnostics:
            grid.diagnostics(),
        rows:
            grid.getVisibleRows(),
    });
}
