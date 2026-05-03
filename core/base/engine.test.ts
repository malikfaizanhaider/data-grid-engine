import {describe, expect, it} from 'vitest';
import type {Table, TableOptions, TableState} from '@tanstack/table-core';
import {TanStackGridEngine} from "./engine";

type Row = { id: number; name: string };

function createMockTable(initialState: TableState = {} as TableState): Table<Row> {
    let state = initialState;
    let options: TableOptions<Row> = {} as TableOptions<Row>;

    const table = {
        options,
        getState: () => state,
        setOptions: (updater: any) => {
            options = updater(options);
            (table as any).options = options;
        },
        setSorting: () => {
        },
    } as unknown as Table<Row>;

    return table;
}

describe('TanStackGridEngine governance hardening', () => {
    it('rejects non-allowlisted updateOptions keys', () => {
        const engine = new TanStackGridEngine<Row>({
            table: createMockTable(),
            data: [],
            columns: [],
        });

        expect(() =>
            engine.updateOptions({
                // @ts-expect-error test unsupported key rejection path
                customUnsafeKey: true,
            }),
        ).toThrow(/Unsupported option override keys/);
    });

    it('rejects normalized column identity collisions across accessorKey/header/id', () => {
        const engine = new TanStackGridEngine<Row>({
            table: createMockTable(),
            data: [],
            columns: [],
        });

        expect(() =>
            engine.setColumns([
                {accessorKey: 'name.first', header: 'First Name'},
                {id: 'name_first', header: 'Another'},
            ]),
        ).toThrow(/Duplicate normalized column identity detected/);
    });

    it('emits error event and rolls back state when table mutation throws', () => {
        const table = createMockTable({sorting: []} as unknown as TableState);
        const engine = new TanStackGridEngine<Row>({
            table,
            data: [],
            columns: [],
        });

        let payload: { message: string; error?: unknown } | undefined;
        engine.on('error', (event) => {
            payload = event;
        });

        const expectedError = new Error('boom');
        (table as any).setSorting = () => {
            throw expectedError;
        };

        expect(() => engine.setSorting([])).toThrow(expectedError);
        expect(engine.getState()).toEqual({sorting: []});
        expect(payload?.message).toBe('Table state mutation failed.');
        expect(payload?.error).toBe(expectedError);
    });
});
