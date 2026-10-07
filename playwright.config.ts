import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para el Proyecto Final de Aseguramiento de Calidad
 * Grupo 5 - Variante 1: LambdaTest E-commerce Playground
 * Navegadores requeridos: Chromium y Firefox (WebKit no aplica a Grupo 5)
 */
export default defineConfig({
  // Directorio donde residen las pruebas
  testDir: './tests',

  // Timeout global máximo por test (30 segundos)
  timeout: 30000,

  // Timeout específico para las aserciones expect() (5 segundos)
  expect: {
    timeout: 5000,
  },

  // Ejecución en paralelo dentro de archivos
  fullyParallel: true,

  // En entornos de Integración Continua (CI), prohíbe tests marcados con test.only
  forbidOnly: !!process.env.CI,

  // Reintentos: 1 reintento para mitigar fluctuaciones de red del sitio demo
  retries: 1,

  // Número de workers: en CI se usa 1 para estabilidad; localmente en paralelo
  workers: process.env.CI ? 1 : undefined,

  // Configuración de reportería: consola concisa ('list') y reporte HTML sin apertura automática
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Opciones compartidas para todos los proyectos
  use: {
    // URL base de la Variante 1 asignada al Grupo 5
    baseURL: 'https://ecommerce-playground.lambdatest.io',

    // Ejecución en modo headless
    headless: true,

    // Captura de pantalla únicamente cuando una prueba falla
    screenshot: 'only-on-failure',

    // Grabación de video preservada únicamente en caso de fallo
    video: 'retain-on-failure',

    // Registro de Playwright Trace preservado únicamente en caso de fallo
    trace: 'retain-on-failure',
  },

  // Proyectos configurados: SOLO Chromium y Firefox (según rúbrica del Grupo 5)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
