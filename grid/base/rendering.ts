// ============================================================================
// TanStack Grid Engine — rendering.ts (FINAL V4.3 HARD LOCK)
// Adapter-Neutral Rendering Runtime + Direct Table Injection + Diagnostics
// ============================================================================

import type {
    Cell,
    Column,
    Header,
    Row,
    RowData,
    Table,
} from '@tanstack/table-core';

import {
    gridFlexRender,
    type GridRenderable,
} from './render-utils';

// ============================================================================
// NORMALIZED RENDER CONTRACTS
// ============================================================================

export interface GridRenderableHeader<TData extends RowData> {
    readonly id: string;
    readonly columnId: string;
    readonly depth: number;
    readonly index: number;
    readonly colSpan: number;
    readonly rowSpan: number;
    readonly isPlaceholder: boolean;
    readonly isPinned: false | 'left' | 'right';
    readonly size: number;
    readonly column: Column<TData, unknown>;
    readonly header: Header<TData, unknown>;
    readonly rendered: unknown;
}

export interface GridRenderableCell<TData extends RowData> {
    readonly id: string;
    readonly rowId: string;
    readonly columnId: string;
    readonly value: unknown;
    readonly rendered: unknown;
    readonly size: number;
    readonly isPinned: false | 'left' | 'right';
    readonly column: Column<TData, unknown>;
    readonly cell: Cell<TData, unknown>;
    readonly row: Row<TData>;
}

export interface GridRenderableRow<TData extends RowData> {
    readonly id: string;
    readonly index: number;
    readonly depth: number;
    readonly isSelected: boolean;
    readonly isExpanded: boolean;
    readonly isPinned: false | 'top' | 'bottom';
    readonly original: TData;
    readonly row: Row<TData>;
    readonly cells: readonly GridRenderableCell<TData>[];
}

export interface GridRenderableFooter<TData extends RowData> {
    readonly id: string;
    readonly columnId: string;
    readonly depth: number;
    readonly colSpan: number;
    readonly rowSpan: number;
    readonly isPlaceholder: boolean;
    readonly isPinned: false | 'left' | 'right';
    readonly size: number;
    readonly column: Column<TData, unknown>;
    readonly header: Header<TData, unknown>;
    readonly rendered: unknown;
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

export interface GridRenderingDiagnostics {
    readonly headerGroups: number;
    readonly flatHeaders: number;
    readonly leafHeaders: number;
    readonly footerGroups: number;
    readonly visibleRows: number;
    readonly coreRows: number;
}

// ============================================================================
// RENDERING MANAGER
// ============================================================================

export class GridRenderingManager<TData extends RowData> {
    private readonly table: Table<TData>;

    constructor(
        table: Table<TData>,
    ) {
        this.table = table;
    }

    // =========================================================================
    // INTERNALS
    // =========================================================================

    private emptyArray<T>(): readonly T[] {
        return Object.freeze(
            [],
        );
    }

    private freezeArray<T>(
        values: readonly T[]
    ): readonly T[] {
        if (
            Object.isFrozen(
                values,
            )
        ) {
            return values;
        }

        return Object.freeze(
            values,
        );
    }

    private renderTemplate<TProps>(
        template: GridRenderable<TProps>,
        props: TProps,
    ): unknown {
        return gridFlexRender(
            template,
            props,
        );
    }

    private getColumnPinState(
        column: Column<TData, unknown>,
    ): false | 'left' | 'right' {
        if (
            typeof column.getIsPinned ===
            'function'
        ) {
            return column.getIsPinned();
        }

        return false;
    }

    private getRowPinState(
        row: Row<TData>,
    ): false | 'top' | 'bottom' {
        if (
            typeof row.getIsPinned ===
            'function'
        ) {
            return row.getIsPinned();
        }

        return false;
    }

    // =========================================================================
    // HEADERS
    // =========================================================================

    private mapHeader(
        header: Header<TData, unknown>,
    ): GridRenderableHeader<TData> {
        return Object.freeze({
            id: header.id,
            columnId:
            header.column.id,
            depth:
            header.depth,
            index:
            header.index,
            colSpan:
            header.colSpan,
            rowSpan:
                header.rowSpan ??
                1,
            isPlaceholder:
            header.isPlaceholder,
            isPinned:
                this.getColumnPinState(
                    header.column,
                ),
            size:
                header.getSize(),
            column:
            header.column,
            header,
            rendered:
                header.isPlaceholder
                    ? null
                    : this.renderTemplate(
                        header.column
                            .columnDef
                            .header as GridRenderable<
                            ReturnType<
                                typeof header.getContext
                            >
                        >,
                        header.getContext(),
                    ),
        });
    }

    getHeaderGroups(): readonly (readonly GridRenderableHeader<TData>[])[] {
        return this.freezeArray(
            this.table
                .getHeaderGroups()
                .map(
                    (
                        group,
                    ) =>
                        this.freezeArray(
                            group.headers.map(
                                (
                                    header,
                                ) =>
                                    this.mapHeader(
                                        header,
                                    ),
                            ),
                        ),
                ),
        );
    }

    getFlatHeaders(): readonly GridRenderableHeader<TData>[] {
        return this.freezeArray(
            this.table
                .getFlatHeaders()
                .map(
                    (
                        header,
                    ) =>
                        this.mapHeader(
                            header,
                        ),
                ),
        );
    }

    getLeafHeaders(): readonly GridRenderableHeader<TData>[] {
        return this.freezeArray(
            this.table
                .getLeafHeaders()
                .map(
                    (
                        header,
                    ) =>
                        this.mapHeader(
                            header,
                        ),
                ),
        );
    }

    // =========================================================================
    // FOOTERS
    // =========================================================================

    private mapFooter(
        header: Header<TData, unknown>,
    ): GridRenderableFooter<TData> {
        return Object.freeze({
            id: header.id,
            columnId:
            header.column.id,
            depth:
            header.depth,
            colSpan:
            header.colSpan,
            rowSpan:
                header.rowSpan ??
                1,
            isPlaceholder:
            header.isPlaceholder,
            isPinned:
                this.getColumnPinState(
                    header.column,
                ),
            size:
                header.getSize(),
            column:
            header.column,
            header,
            rendered:
                header.isPlaceholder
                    ? null
                    : this.renderTemplate(
                        header.column
                            .columnDef
                            .footer as GridRenderable<
                            ReturnType<
                                typeof header.getContext
                            >
                        >,
                        header.getContext(),
                    ),
        });
    }

    getFooterGroups(): readonly (readonly GridRenderableFooter<TData>[])[] {
        return this.freezeArray(
            this.table
                .getFooterGroups()
                .map(
                    (
                        group,
                    ) =>
                        this.freezeArray(
                            group.headers.map(
                                (
                                    header,
                                ) =>
                                    this.mapFooter(
                                        header,
                                    ),
                            ),
                        ),
                ),
        );
    }

    // =========================================================================
    // CELLS
    // =========================================================================

    private mapCell(
        cell: Cell<TData, unknown>,
    ): GridRenderableCell<TData> {
        return Object.freeze({
            id: cell.id,
            rowId:
            cell.row.id,
            columnId:
            cell.column.id,
            value:
                cell.getValue(),
            rendered:
                this.renderTemplate(
                    cell.column
                        .columnDef
                        .cell as GridRenderable<
                        ReturnType<
                            typeof cell.getContext
                        >
                    >,
                    cell.getContext(),
                ),
            size:
                cell.column.getSize(),
            isPinned:
                this.getColumnPinState(
                    cell.column,
                ),
            column:
            cell.column,
            cell,
            row:
            cell.row,
        });
    }

    getVisibleCells(
        rowId: string,
    ): readonly GridRenderableCell<TData>[] {
        const row =
            this.table
                .getRowModel()
                .rowsById[
                rowId
                ];

        if (!row) {
            return this.emptyArray();
        }

        return this.freezeArray(
            row
                .getVisibleCells()
                .map(
                    (
                        cell,
                    ) =>
                        this.mapCell(
                            cell,
                        ),
                ),
        );
    }

    getAllCells(
        rowId: string,
    ): readonly GridRenderableCell<TData>[] {
        const row =
            this.table
                .getRowModel()
                .rowsById[
                rowId
                ];

        if (!row) {
            return this.emptyArray();
        }

        return this.freezeArray(
            row
                .getAllCells()
                .map(
                    (
                        cell,
                    ) =>
                        this.mapCell(
                            cell,
                        ),
                ),
        );
    }

    // =========================================================================
    // ROWS
    // =========================================================================

    private mapRow(
        row: Row<TData>,
    ): GridRenderableRow<TData> {
        return Object.freeze({
            id: row.id,
            index:
            row.index,
            depth:
            row.depth,
            isSelected:
                typeof row.getIsSelected ===
                'function'
                    ? row.getIsSelected()
                    : false,
            isExpanded:
                typeof row.getIsExpanded ===
                'function'
                    ? row.getIsExpanded()
                    : false,
            isPinned:
                this.getRowPinState(
                    row,
                ),
            original:
            row.original,
            row,
            cells:
                this.freezeArray(
                    row
                        .getVisibleCells()
                        .map(
                            (
                                cell,
                            ) =>
                                this.mapCell(
                                    cell,
                                ),
                        ),
                ),
        });
    }

    getVisibleRows(): readonly GridRenderableRow<TData>[] {
        return this.freezeArray(
            this.table
                .getRowModel()
                .rows.map(
                (
                    row,
                ) =>
                    this.mapRow(
                        row,
                    ),
            ),
        );
    }

    getCoreRows(): readonly GridRenderableRow<TData>[] {
        return this.freezeArray(
            this.table
                .getCoreRowModel()
                .rows.map(
                (
                    row,
                ) =>
                    this.mapRow(
                        row,
                    ),
            ),
        );
    }

    getPinnedTopRows(): readonly GridRenderableRow<TData>[] {
        if (
            typeof this.table
                .getTopRows !==
            'function'
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            this.table
                .getTopRows()
                .map(
                    (
                        row,
                    ) =>
                        this.mapRow(
                            row,
                        ),
                ),
        );
    }

    getPinnedBottomRows(): readonly GridRenderableRow<TData>[] {
        if (
            typeof this.table
                .getBottomRows !==
            'function'
        ) {
            return this.emptyArray();
        }

        return this.freezeArray(
            this.table
                .getBottomRows()
                .map(
                    (
                        row,
                    ) =>
                        this.mapRow(
                            row,
                        ),
                ),
        );
    }

    getRow(
        rowId: string,
    ): GridRenderableRow<TData> | undefined {
        const row =
            this.table
                .getRowModel()
                .rowsById[
                rowId
                ];

        return row
            ? this.mapRow(
                row,
            )
            : undefined;
    }

    // =========================================================================
    // COLUMNS
    // =========================================================================

    getAllColumns(): readonly Column<TData, unknown>[] {
        return this.table.getAllColumns();
    }

    getAllLeafColumns(): readonly Column<TData, unknown>[] {
        return this.table.getAllLeafColumns();
    }

    getVisibleLeafColumns(): readonly Column<TData, unknown>[] {
        return this.table.getVisibleLeafColumns();
    }

    getColumn(
        columnId: string,
    ): Column<TData, unknown> | undefined {
        return this.table.getColumn(
            columnId,
        );
    }

    // =========================================================================
    // DIRECT RENDER HELPERS
    // =========================================================================

    renderHeader(
        header: Header<TData, unknown>,
    ): unknown {
        if (
            header.isPlaceholder
        ) {
            return null;
        }

        return this.renderTemplate(
            header.column
                .columnDef
                .header as GridRenderable<
                ReturnType<
                    typeof header.getContext
                >
            >,
            header.getContext(),
        );
    }

    renderCell(
        cell: Cell<TData, unknown>,
    ): unknown {
        return this.renderTemplate(
            cell.column
                .columnDef
                .cell as GridRenderable<
                ReturnType<
                    typeof cell.getContext
                >
            >,
            cell.getContext(),
        );
    }

    renderFooter(
        header: Header<TData, unknown>,
    ): unknown {
        if (
            header.isPlaceholder
        ) {
            return null;
        }

        return this.renderTemplate(
            header.column
                .columnDef
                .footer as GridRenderable<
                ReturnType<
                    typeof header.getContext
                >
            >,
            header.getContext(),
        );
    }

    // =========================================================================
    // DIAGNOSTICS
    // =========================================================================

    diagnostics(): GridRenderingDiagnostics {
        return Object.freeze({
            headerGroups:
            this.table
                .getHeaderGroups()
                .length,
            flatHeaders:
            this.table
                .getFlatHeaders()
                .length,
            leafHeaders:
            this.table
                .getLeafHeaders()
                .length,
            footerGroups:
            this.table
                .getFooterGroups()
                .length,
            visibleRows:
            this.table
                .getRowModel()
                .rows.length,
            coreRows:
            this.table
                .getCoreRowModel()
                .rows.length,
        });
    }

    isEmpty(): boolean {
        return (
            this.table
                .getRowModel()
                .rows.length === 0
        );
    }

    getVisibleColumnCount(): number {
        return this.table
            .getVisibleLeafColumns()
            .length;
    }

    getVisibleRowCount(): number {
        return this.table
            .getRowModel()
            .rows.length;
    }

    getTotalColumnWidth(): number {
        return this.table
            .getVisibleLeafColumns()
            .reduce(
                (
                    total,
                    column,
                ) =>
                    total +
                    column.getSize(),
                0,
            );
    }
}
