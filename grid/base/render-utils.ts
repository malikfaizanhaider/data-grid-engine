// ============================================================================
// TanStack Grid Engine — render-utils.ts (FINAL V4.2 LOCK)
// Adapter-Neutral flexRender Replacement
// Headless-Safe + SSR-Safe + Primitive + Function Template Runtime
// ============================================================================

export type GridRenderable<TProps> =
    | string
    | number
    | boolean
    | null
    | undefined
    | ((props: TProps) => any);

/**
 * Adapter-neutral render runtime.
 *
 * Compatible with:
 * - String headers
 * - Numeric values
 * - Boolean templates
 * - Null / undefined
 * - Function renderers (TanStack style)
 *
 * Intentionally does NOT depend on framework adapters
 * like React/Vue/Solid.
 */
export function gridFlexRender<TProps>(
    template: GridRenderable<TProps>,
    props: TProps,
): unknown {
    if (template == null) {
        return null;
    }

    if (typeof template === 'function') {
        return (template as (props: TProps) => any)(
            props,
        );
    }

    return template;
}
