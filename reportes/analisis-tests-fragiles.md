# Reporte de Diagnóstico y Mitigación de Pruebas Inestables (Flaky Tests)

**Curso:** Aseguramiento de Calidad de Software — UMG  
**Proyecto:** Automatización de Pruebas E2E en Tienda Virtual (OpenCart / LambdaTest)  
**Grupo:** Grupo 5 · Variante 1  
**Fecha de Elaboración:** 18 de Octubre de 2026  

---

## 1. Introducción y Marco Metodológico
En la automatización de pruebas de interfaz de usuario de extremo a extremo (E2E), un **test frágil o inestable (flaky test)** es aquel que produce resultados intermitentes (pasa o falla) bajo el mismo código fuente y ambiente sin que exista un defecto funcional en el sistema bajo prueba.

Para el presente proyecto, el equipo de aseguramiento de calidad implementó un proceso sistemático de detección, diagnóstico mediante **Playwright Trace Viewer**, aislamiento de causas raíces y aplicación de patrones de diseño resilientes (esperas explícitas, selectores desacoplados y auto-waiting). A continuación se documenta un caso real diagnosticado y corregido por cada integrante del equipo.

Todos los fragmentos "Antes / Después" de este documento provienen del historial real del repositorio (`git log -p`), y las cifras de verificación provienen de corridas reales del 18 de octubre de 2026 con la configuración de `playwright.config.ts` (proyectos `chromium` y `firefox`, `retries: 1`).

---

## 2. Caso 1 — Marvin Alexander Vásquez López
**Rama de trabajo:** `feature/mavasquez`  
**Archivo afectado:** [`pages/LoginPage.ts`](../pages/LoginPage.ts) y [`tests/regression-auth.spec.ts`](../tests/regression-auth.spec.ts)  
**Funcionalidad:** F02 — Autenticación y navegación concurrente multi-worker  
**Commits:** `8b9a97b` (tolerancia al rate limiting) y `d673ca5` (`waitUntil: 'domcontentloaded'`)

### 2.1 Manifestación de la Falla Intermitente
Durante la ejecución paralela de `tests/regression-auth.spec.ts` se observaron dos fallos esporádicos:
1. **Timeout de navegación (30.000 ms):** el test arrojaba `Timeout 30000ms exceeded` en `page.goto(...)` esperando el evento de ciclo de vida predeterminado (`load`). El log de Playwright lo confirma: `navigating to ".../index.php?route=account/login", waiting until "load"`.
2. **Falso negativo por Rate Limiting:** en el login con credenciales inválidas, el servidor de OpenCart puede bloquear temporalmente la autenticación devolviendo el banner:  
   `"Warning: Your account has exceeded allowed number of login attempts. Please try again in 1 hour."`  
   El test esperaba estrictamente el mensaje `No match for E-Mail Address and/or Password`, y la aserción fallaba.

### 2.2 Diagnóstico de Causa Raíz (Trace Viewer)
Al inspeccionar la traza con `npx playwright show-trace`:
- **Ciclo de vida `load` insatisfecho:** la tienda en LambdaTest carga recursos de terceros y estáticos que en ocasiones demoran en emitir `window.onload`, aunque el DOM y el formulario ya estén renderizados e interactivos. Esperar `load` convierte una demora de recursos no críticos en un timeout del test.
- **Protección contra fuerza bruta en OpenCart:** el motor contabiliza intentos fallidos de login y, al superar el límite, bloquea por 1 hora. Cuando varios tests negativos corren en paralelo, el banner de bloqueo reemplaza al mensaje esperado.

### 2.3 Solución Aplicada (Código Antes vs. Después)

#### A. Optimización del ciclo de vida de navegación (`pages/LoginPage.ts`, commit `d673ca5`):
```typescript
// ANTES (Frágil: espera el evento window.onload)
async goto(): Promise<void> {
  await this.page.goto('index.php?route=account/login');
}

// DESPUÉS (Resiliente: continúa cuando el DOM está parseado)
async goto(): Promise<void> {
  await this.page.goto('index.php?route=account/login', { waitUntil: 'domcontentloaded' });
}
```

#### B. Aserción tolerante a la política de seguridad del backend (`tests/regression-auth.spec.ts`, commit `8b9a97b`):
```typescript
// ANTES (Frágil: asume que el servidor solo responde "No match")
await expect(page.locator('.alert-danger')).toContainText('No match for E-Mail Address and/or Password');

// DESPUÉS (Resiliente: tolera rechazo de credenciales o banner de rate limiting)
await expect(page.locator('.alert-danger')).toContainText(
  /No match for E-Mail Address and\/or Password|exceeded allowed number of login attempts/i
);
```
En el commit `d673ca5` esta misma regex se centralizó en `LoginPage.expectLoginError(...)`.

En el mismo commit `8b9a97b`, el test de login válido pasó de `loginAs` + `toHaveURL` a esperar con `Promise.race([waitForURL(account/account), alert-danger visible])`, de modo que el test reacciona a lo primero que responda el servidor (redirección o bloqueo) en lugar de asumir un resultado.

#### C. Aislamiento de datos de prueba:
- Cuentas dedicadas por integrante en `test-data/users.ts`: `usuarioPrincipal` (Wilson) y `usuarioPrincipalMarvin` / `usuarioCambioPasswordMarvin` (Marvin).
- `generarUsuarioNuevo(sufijo)` genera un correo único (`Date.now()` + contador + sufijo). En `regression-auth.spec.ts` se invoca con `testInfo.project.name` (por ejemplo `chromium_<timestamp>`), de modo que Chromium y Firefox nunca comparten usuario al correr en paralelo.

### 2.4 Verificación y Resultados
- **Comando de prueba:** `npx playwright test tests/regression-auth.spec.ts --repeat-each=10 --workers=2`
- **Resultado real (18/10/2026):** 240 ejecuciones (12 tests × 2 navegadores × 10 repeticiones) → **239 pasadas, 1 flaky, 0 fallidas**, duración 9,1 min.
- **Flaky:** `[firefox] login con credenciales válidas y redirección a cuenta` falló en el primer intento y pasó en el reintento configurado (`retries: 1`). No se diagnosticó su causa con traza; queda como observación abierta.

---

## 3. Caso 2 — Wilson Eduardo Hernández López
**Rama de trabajo:** `feature/Wilson`  
**Archivo afectado:** [`pages/ProductPage.ts`](../pages/ProductPage.ts) y [`tests/regression-reviews.spec.ts`](../tests/regression-reviews.spec.ts)  
**Funcionalidad:** F07 — Calificación de producto y publicación de reseñas  
**Commit:** `ebaadc4`

### 3.1 Manifestación de la Falla Intermitente
El método `calificar(estrellas)` seleccionaba el radio de calificación directamente con `check({ force: true })`. Este enfoque interactúa con un `<input>` que el tema oculta con CSS, por lo que (a) `force: true` desactiva las comprobaciones de accionabilidad de Playwright y (b) el clic se dirige a coordenadas de un elemento no visible, lo que hace el resultado dependiente del estado del tema y no de lo que ve un usuario real. La corrección sustituyó ese enfoque por un clic sobre la etiqueta visible.

### 3.2 Diagnóstico de Causa Raíz
- En la plantilla de OpenCart los radios nativos:
  ```html
  <input type="radio" name="rating" value="5" id="rating-5-..." />
  ```
  están ocultos visualmente mediante CSS, y el tema presenta en su lugar elementos `label` con iconos de estrellas.
- Un usuario real no interactúa con el `<input>` oculto sino con el `label` visible asociado. `force: true` oculta el problema en vez de resolverlo, y es una fuente de comportamiento intermitente.
- El selector `label[for^="rating-N-"]` apunta al elemento que realmente se ve y se pulsa, y mantiene el auto-waiting de Playwright (visible, estable, habilitado).

### 3.3 Solución Aplicada (Código Antes vs. Después)

```typescript
// ANTES (Frágil: fuerza el check sobre el radio oculto por CSS)
async calificar(estrellas: 1 | 2 | 3 | 4 | 5): Promise<void> {
  const radioRating = this.page.locator(`input[name="rating"][value="${estrellas}"]`);
  await radioRating.check({ force: true });
}

// DESPUÉS (Resiliente: clic sobre la etiqueta visible asociada al radio)
async calificar(estrellas: 1 | 2 | 3 | 4 | 5): Promise<void> {
  // Los radios están ocultos por CSS; se hace clic en su etiqueta visible
  await this.page.locator(`label[for^="rating-${estrellas}-"]`).click();
}
```

### 3.4 Verificación y Resultados
- **Comando de prueba:** `npx playwright test tests/regression-reviews.spec.ts --repeat-each=10 --workers=2`
- **Resultado real (18/10/2026):** 180 ejecuciones (9 tests × 2 navegadores × 10 repeticiones) → **175 pasadas, 5 flaky, 0 fallidas**, duración 8,3 min.
- **Flaky (todos en Chromium, todos pasaron en el reintento):** `calificar con 5 estrellas`, `reseña sin calificación`, `límite 1000 caracteres`, `límite 1001 caracteres` y `edición de teléfono en perfil`.
- **Causa de los flaky observados:** ninguno fue del selector de estrellas. Los fallos fueron `Test timeout of 30000ms exceeded` en `page.goto(...) waiting until "load"`, tanto en `ProductPage.goto` (fixture `productPage`) como en `loginAs` (`helpers/auth.ts`). Es decir, es **el mismo patrón del Caso 1** (esperar el evento `load` de un sitio con recursos lentos).

### 3.5 Hallazgo residual y mejora recomendada
`ProductPage.goto` y `helpers/auth.ts → loginAs` aún usan `page.goto(...)` con la espera `load` por defecto. Aplicar `{ waitUntil: 'domcontentloaded' }` en ambos, como ya se hizo en `LoginPage.goto`, debería eliminar los 5 flaky de esta corrida. Está documentado aquí como mejora pendiente: no se modificó código en esta verificación.

---

## 4. Conclusiones y Buenas Prácticas Instituidas en el Proyecto
1. **Evitar esperas fijas arbitrarias (`page.waitForTimeout`):** en su lugar, utilizar siempre aserciones web-first (`expect(locator).toBeVisible()`) que incorporan polling activo automático.
2. **Desacoplar eventos de red de la interactividad del DOM:** usar `{ waitUntil: 'domcontentloaded' }` para no bloquear pruebas por descargas accesorias no críticas. Esta corrida demostró que el patrón sigue siendo la principal fuente de flakiness donde no se aplicó.
3. **Mapear elementos visuales reales:** cuando los frameworks CSS ocultan inputs nativos (radios, checkboxes, switches), orientar los selectores al `label` con atributo `for` o al contenedor interactivo visible, en lugar de usar `force: true`.
4. **Garantizar datos independientes por suite:** no reutilizar correos estáticos en pruebas concurrentes; emplear fábricas de datos con marcas de tiempo (`Date.now()`) y el nombre del proyecto del navegador.
