# Resumen de accesibilidad (axe-core, WCAG 2.0 A/AA)

Generado por `tests/accesibilidad.spec.ts` (`npx playwright test --grep "@a11y"`). Las reglas se agrupan por página y navegador.

## chromium

| Página | Violaciones | Critical | Serious | Moderate | Minor | Reglas principales (nodos afectados) |
|---|---|---|---|---|---|---|
| home | 3 | 1 | 2 | 0 | 0 | `color-contrast` (10), `image-alt` (1), `link-name` (1) |
| login | 2 | 0 | 2 | 0 | 0 | `color-contrast` (18), `link-name` (2) |
| registro | 3 | 0 | 3 | 0 | 0 | `color-contrast` (18), `link-name` (2), `link-in-text-block` (1) |
| producto | 6 | 2 | 4 | 0 | 0 | `color-contrast` (9), `aria-required-parent` (3), `listitem` (3) |

## firefox

| Página | Violaciones | Critical | Serious | Moderate | Minor | Reglas principales (nodos afectados) |
|---|---|---|---|---|---|---|
| home | 3 | 1 | 2 | 0 | 0 | `color-contrast` (11), `image-alt` (1), `link-name` (1) |
| login | 2 | 0 | 2 | 0 | 0 | `color-contrast` (19), `link-name` (2) |
| registro | 3 | 0 | 3 | 0 | 0 | `color-contrast` (19), `link-name` (2), `link-in-text-block` (1) |
| producto | 6 | 2 | 4 | 0 | 0 | `color-contrast` (11), `aria-required-parent` (3), `listitem` (3) |
