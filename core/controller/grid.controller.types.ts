import type {TanStackGridEngine} from "../engine/tanstack-grid-engine";

export interface GridConfig<T> {
    engine: TanStackGridEngine<T>
    recordCount: number
    isLoading?: boolean
    loadingMode?: 'skeleton' | 'spinner'
    loadingMessage?: unknown
    emptyMessage?: unknown

    tableLayout?: {
        dense?: boolean
        cellBorder?: boolean
        rowBorder?: boolean
        rowRounded?: boolean
        stripped?: boolean
        headerBackground?: boolean
        headerBorder?: boolean
        headerSticky?: boolean
        width?: 'auto' | 'fixed'
        columnsVisibility?: boolean
        columnsResizable?: boolean
        columnsPinnable?: boolean
        columnsMovable?: boolean
        columnsDraggable?: boolean
        rowsDraggable?: boolean
    }

    tableClassNames?: {
        base?: string
        header?: string
        headerRow?: string
        headerSticky?: string
        body?: string
        bodyRow?: string
        footer?: string
        edgeCell?: string
    }

    onRowClick?: (row: T) => void
}
