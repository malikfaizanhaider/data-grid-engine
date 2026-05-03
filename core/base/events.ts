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
