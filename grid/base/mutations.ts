// ============================================================================
// TanStack Grid Engine — mutations.ts (FINAL V4.3 HARD LOCK)
// Governance-Safe Data Mutation Runtime
// Immutable + Identity-Safe + Optimistic + Validation + Diagnostics
// ============================================================================

import type {RowData} from '@tanstack/table-core';

import type {
    GridEngine,
} from './types';

// ============================================================================
// MUTATION TYPES
// ============================================================================

export type GridMutationType =
    | 'setData'
    | 'replaceRows'
    | 'replaceRow'
    | 'insertRow'
    | 'removeRow'
    | 'updateRow'
    | 'patchRow'
    | 'bulkPatch'
    | 'clear'
    | 'rollback'
    | 'commitOptimistic';

// ============================================================================
// DIAGNOSTICS
// ============================================================================

export interface GridMutationDiagnostics {
    readonly rowCount: number;
    readonly mutationVersion: number;
    readonly optimisticActive: boolean;
    readonly optimisticVersion: number;
    readonly lastMutation?: GridMutationType;
}

// ============================================================================
// OPTIONS
// ============================================================================

export interface GridMutationManagerOptions<TData extends RowData> {
    readonly engine: GridEngine<TData>;

    readonly getRowId: (
        row: TData,
    ) => string;

    readonly onBeforeMutation?: (
        type: GridMutationType,
    ) => void;

    readonly onAfterMutation?: (
        type: GridMutationType,
    ) => void;
}

// ============================================================================
// MUTATION MANAGER
// ============================================================================

export class GridMutationManager<TData extends RowData> {
    private readonly engine: GridEngine<TData>;

    private readonly getRowId: (
        row: TData,
    ) => string;

    private readonly onBeforeMutation?: (
        type: GridMutationType,
    ) => void;

    private readonly onAfterMutation?: (
        type: GridMutationType,
    ) => void;

    private rowMap = new Map<
        string,
        TData
    >();

    private mutationVersion = 0;

    private optimisticVersion = 0;

    private lastMutation?: GridMutationType;

    private optimisticSnapshot?: readonly TData[];

    constructor(
        options: GridMutationManagerOptions<TData>,
    ) {
        this.engine =
            options.engine;

        this.getRowId =
            options.getRowId;

        this.onBeforeMutation =
            options.onBeforeMutation;

        this.onAfterMutation =
            options.onAfterMutation;

        this.rebuildRowMap(
            this.engine.getRows(),
        );
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private emptyRows(): readonly TData[] {
        return Object.freeze(
            [],
        );
    }

    private freezeRows(
        rows: readonly TData[],
    ): readonly TData[] {
        if (
            Object.isFrozen(
                rows,
            )
        ) {
            return rows;
        }

        return Object.freeze(
            [
                ...rows,
            ],
        );
    }

    private validateUniqueRows(
        rows: readonly TData[],
    ): Map<string, TData> {
        const nextMap =
            new Map<
                string,
                TData
            >();

        for (const row of rows) {
            const rowId =
                this.getRowId(
                    row,
                );

            if (
                nextMap.has(
                    rowId,
                )
            ) {
                throw new Error(
                    `Duplicate row id detected: ${rowId}`,
                );
            }

            nextMap.set(
                rowId,
                row,
            );
        }

        return nextMap;
    }

    private commitMutation(
        type: GridMutationType,
        nextRows: readonly TData[],
    ): void {
        this.onBeforeMutation?.(
            type,
        );

        const frozenRows =
            this.freezeRows(
                nextRows,
            );

        const validatedMap =
            this.validateUniqueRows(
                frozenRows,
            );

        this.engine.setData(
            frozenRows,
        );

        this.engine.setRecordCount(
            frozenRows.length,
        );

        this.rowMap =
            validatedMap;

        this.mutationVersion++;

        this.lastMutation =
            type;

        this.onAfterMutation?.(
            type,
        );
    }

    private rebuildRowMap(
        rows: readonly TData[],
    ): void {
        this.rowMap =
            this.validateUniqueRows(
                rows,
            );
    }

    private getRows():
        readonly TData[] {
        return this.engine.getRows();
    }

    private createPatchedRow(
        current: TData,
        patch: Partial<TData>,
    ): TData {
        if (
            typeof current !==
            'object' ||
            current === null
        ) {
            throw new Error(
                'patchRow requires object-compatible row data.',
            );
        }

        return {
            ...current,
            ...patch,
        } as TData;
    }

    // =========================================================================
    // CORE
    // =========================================================================

    setData(
        rows: readonly TData[],
    ): void {
        this.commitMutation(
            'setData',
            rows,
        );
    }

    clear(): void {
        this.commitMutation(
            'clear',
            this.emptyRows(),
        );
    }

    replaceRows(
        rows: readonly TData[],
    ): void {
        this.commitMutation(
            'replaceRows',
            rows,
        );
    }

    replaceRow(
        rowId: string,
        nextRow: TData,
    ): boolean {
        let found =
            false;

        const nextRows =
            this.getRows().map(
                (
                    row,
                ) => {
                    if (
                        this.getRowId(
                            row,
                        ) !== rowId
                    ) {
                        return row;
                    }

                    found =
                        true;

                    return nextRow;
                },
            );

        if (!found) {
            return false;
        }

        this.commitMutation(
            'replaceRow',
            nextRows,
        );

        return true;
    }

    insertRow(
        row: TData,
        index?: number,
    ): void {
        const rows =
            this.getRows();

        const rowId =
            this.getRowId(
                row,
            );

        if (
            this.rowMap.has(
                rowId,
            )
        ) {
            throw new Error(
                `Duplicate row id detected: ${rowId}`,
            );
        }

        if (
            typeof index !==
            'number' ||
            index < 0 ||
            index >
            rows.length
        ) {
            this.commitMutation(
                'insertRow',
                [
                    ...rows,
                    row,
                ],
            );

            return;
        }

        this.commitMutation(
            'insertRow',
            [
                ...rows.slice(
                    0,
                    index,
                ),
                row,
                ...rows.slice(
                    index,
                ),
            ],
        );
    }

    removeRow(
        rowId: string,
    ): boolean {
        const rows =
            this.getRows();

        const nextRows =
            rows.filter(
                (
                    row,
                ) =>
                    this.getRowId(
                        row,
                    ) !== rowId,
            );

        if (
            nextRows.length ===
            rows.length
        ) {
            return false;
        }

        this.commitMutation(
            'removeRow',
            nextRows,
        );

        return true;
    }

    updateRow(
        rowId: string,
        updater: (
            current: TData,
        ) => TData,
    ): boolean {
        let found =
            false;

        const nextRows =
            this.getRows().map(
                (
                    row,
                ) => {
                    if (
                        this.getRowId(
                            row,
                        ) !== rowId
                    ) {
                        return row;
                    }

                    found =
                        true;

                    return updater(
                        row,
                    );
                },
            );

        if (!found) {
            return false;
        }

        this.commitMutation(
            'updateRow',
            nextRows,
        );

        return true;
    }

    patchRow(
        rowId: string,
        patch: Partial<TData>,
    ): boolean {
        return this.updateRow(
            rowId,
            (
                current,
            ) =>
                this.createPatchedRow(
                    current,
                    patch,
                ),
        );
    }

    bulkPatch(
        rowIds: readonly string[],
        patch: Partial<TData>,
    ): number {
        const idSet =
            new Set(
                rowIds,
            );

        let patchedCount =
            0;

        const nextRows =
            this.getRows().map(
                (
                    row,
                ) => {
                    const currentId =
                        this.getRowId(
                            row,
                        );

                    if (
                        !idSet.has(
                            currentId,
                        )
                    ) {
                        return row;
                    }

                    patchedCount++;

                    return this.createPatchedRow(
                        row,
                        patch,
                    );
                },
            );

        if (
            patchedCount ===
            0
        ) {
            return 0;
        }

        this.commitMutation(
            'bulkPatch',
            nextRows,
        );

        return patchedCount;
    }

    // =========================================================================
    // OPTIMISTIC
    // =========================================================================

    beginOptimistic(): void {
        if (
            this.optimisticSnapshot
        ) {
            this.optimisticVersion++;

            return;
        }

        this.optimisticSnapshot =
            this.freezeRows(
                this.getRows(),
            );

        this.optimisticVersion = 1;
    }

    commitOptimistic(): void {
        this.optimisticSnapshot =
            undefined;

        this.optimisticVersion = 0;

        this.lastMutation =
            'commitOptimistic';
    }

    rollback(): boolean {
        if (
            !this.optimisticSnapshot
        ) {
            return false;
        }

        this.commitMutation(
            'rollback',
            this.optimisticSnapshot,
        );

        this.optimisticSnapshot =
            undefined;

        this.optimisticVersion = 0;

        return true;
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridMutationDiagnostics {
        return Object.freeze({
            rowCount:
                this.engine
                    .getRecordCount(),
            mutationVersion:
            this.mutationVersion,
            optimisticActive:
                Boolean(
                    this.optimisticSnapshot,
                ),
            optimisticVersion:
            this.optimisticVersion,
            lastMutation:
            this.lastMutation,
        });
    }
}
