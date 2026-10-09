# proyecto-qa-tienda

Proyecto Final de Aseguramiento de la Calidad del Software — pruebas automatizadas end-to-end con Playwright y TypeScript.

## Integrantes

| Nombre | Carné |
|---|---|
| Wilson Eduardo Hernández López | 1790-22-7315 |
| Marvin Alexander Vasquez López | 1790-22-12802 |

- **Grupo:** 5
- **Variante:** 1 — LambdaTest E-commerce Playground
- **URL bajo prueba:** <https://ecommerce-playground.lambdatest.io>

## Descripción

Proyecto Final del curso de Aseguramiento de la Calidad del Software. Consiste en un plan de aseguramiento de la calidad completo para una tienda en línea de práctica basada en **OpenCart**: el *LambdaTest E-commerce Playground* (Variante 1, asignada al Grupo 5). El sitio ofrece catálogo de productos, registro e inicio de sesión de cuentas, edición de perfil, calificación de productos por estrellas y reseñas de texto.

El proyecto abarca:

- **Casos de prueba manuales** (mínimo 20), diseñados con partición de equivalencia, valores en la frontera y tablas de decisión, más al menos 30 minutos de pruebas exploratorias.
- **Suite de automatización** con **Playwright y TypeScript**, siguiendo el patrón **Page Object Model**, con fixtures reutilizables (sesión iniciada), datos de prueba separados, helpers de autenticación y evidencias automáticas (screenshots, video y trace en caso de fallo).
- **Pruebas de humo (`@smoke`) y de regresión (`@regression`)**, ejecutables de forma selectiva, en **Chromium** y **Firefox** (WebKit solo aplica al Grupo 10).
- **Gestión de defectos**: mínimo 5 defectos reales, clasificados por severidad y prioridad y registrados también como GitHub Issues.
- **Diagnóstico y corrección de al menos un test inestable (flaky)**, dejando constancia del proceso.

### Funcionalidades en alcance

| ID | Funcionalidad |
|---|---|
| F01 | Registro de usuario |
| F02 | Inicio de sesión |
| F03 | Cierre de sesión |
| F04 | Edición de perfil (nombre, apellido, email, teléfono) |
| F05 | Cambio de contraseña |
| F06 | Calificación de producto (1 a 5 estrellas) |
| F07 | Reseña de producto (comentario de texto) |
| F08 | Navegación y búsqueda de productos |
| F09 | Manejo de errores y validaciones |

**Fuera de alcance:** pruebas de rendimiento, seguridad o penetración, infraestructura del servidor, proceso de compra/checkout completo y funcionalidad administrativa.

> Cada grupo usa sus propios usuarios de prueba; no se comparten cuentas, no se modifican datos ajenos ni se intenta explotar vulnerabilidades del sitio.

## Requisitos

- [Node.js](https://nodejs.org/) (versión LTS recomendada) con npm
- [Visual Studio Code](https://code.visualstudio.com/) (recomendado; opcional la extensión *Playwright Test for VS Code*)
- Git
- Playwright y TypeScript (se instalan con `npm install`)
- Conexión a internet (el sitio bajo prueba es público)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <URL-DEL-REPOSITORIO>

# 2. Entrar al proyecto
cd proyecto-qa-tienda

# 3. Instalar dependencias
npm install

# 4. Descargar los navegadores requeridos
npx playwright install chromium firefox
```

> **Sobre `.npmrc` (`ignore-scripts=true`):** el proyecto incluye este ajuste para que `npm install` no ejecute scripts de ciclo de vida (`preinstall`, `postinstall`, etc.) de las dependencias. Es una medida de seguridad contra ejecución de código arbitrario de paquetes de terceros. Por eso los navegadores no se descargan automáticamente y hay que instalarlos de forma explícita con el paso 4. **No lo elimines ni lo sobrescribas.**

## Ejecución de pruebas

### Scripts npm

| Comando | Descripción |
|---|---|
| `npm test` | Ejecuta toda la suite en Chromium y Firefox |
| `npm run test:smoke` | Solo pruebas `@smoke` |
| `npm run test:regression` | Solo pruebas `@regression` |
| `npm run test:chromium` | Toda la suite solo en Chromium |
| `npm run test:firefox` | Toda la suite solo en Firefox |
| `npm run report` | Abre el reporte HTML (`playwright-report/`) |
| `npm run typecheck` | Verifica tipos con `tsc --noEmit` |

### Ejecución selectiva (sección 6.5)

```bash
# Un archivo específico
npx playwright test tests/smoke.spec.ts

# Un test por título
npx playwright test -g "login válido y logout"

# Por etiqueta
npx playwright test --grep @smoke
npx playwright test --grep @regression

# Excluir una etiqueta
npx playwright test --grep-invert @regression

# Por navegador
npx playwright test --project=chromium
npx playwright test --project=firefox

# Combinado: smoke solo en Firefox
npx playwright test --grep @smoke --project=firefox

# Con interfaz visual, con navegador visible o en depuración
npx playwright test --ui
npx playwright test --headed
npx playwright test --debug

# Ver el reporte HTML
npx playwright show-report
```

## Etiquetas `@smoke` y `@regression`

Las etiquetas se declaran en cada test con la opción `tag` de Playwright:

```ts
test('login válido y logout', { tag: '@regression' }, async ({ page }) => { ... });
```

- **`@smoke`** — pruebas de humo: conjunto pequeño y rápido que verifica que las funciones críticas del sitio responden. Se ejecutan primero para detectar fallos graves de inmediato.
- **`@regression`** — pruebas de regresión: cobertura más amplia y profunda de los flujos (casos válidos, inválidos y de borde) para confirmar que los cambios no rompieron funcionalidad existente.

Se filtran con `--grep @smoke` / `--grep @regression` (o los scripts `test:smoke` y `test:regression`).

## Estructura del repositorio

```text
proyecto-qa-tienda/
├── .npmrc                  # ignore-scripts=true
├── .gitignore
├── package.json            # scripts npm y dependencias
├── playwright.config.ts    # configuración (baseURL, proyectos chromium/firefox, reporter)
├── tsconfig.json
├── fixtures/
│   └── index.ts            # fixtures personalizados de Playwright
├── helpers/
│   └── auth.ts             # helpers de login/logout
├── pages/                  # Page Objects
│   ├── AccountPage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── ProductPage.ts
│   └── RegisterPage.ts
├── test-data/
│   └── users.ts            # datos de prueba
├── tests/
│   ├── smoke.spec.ts
│   ├── regression-auth.spec.ts
│   └── regression-reviews.spec.ts
├── evidencias/             # capturas y evidencias
├── reportes/               # reportes entregables
├── playwright-report/      # reporte HTML generado (no versionado)
└── test-results/           # artefactos de ejecución: screenshots, videos, traces (no versionado)
```

## Defectos encontrados

| ID | Título | Severidad | Prioridad | Issue |
|---|---|---|---|---|
| | | | | |
