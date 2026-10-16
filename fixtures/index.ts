import { test as base, expect } from '@playwright/test';
import * as path from 'path';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AccountPage } from '../pages/AccountPage';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { usuarioPrincipal } from '../test-data/users';
import { productoPrincipal } from '../test-data/products';
import { loginAs } from '../helpers/auth';

/**
 * Definición de tipos de fixtures para la suite de pruebas.
 * Patrón base.extend<AppFixtures> según la Clase 9.
 */
export type AppFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  accountPage: AccountPage;

  homePage: HomePage;
  productPage: ProductPage;
  authenticatedProductPage: ProductPage;
};

/**
 * Fixture extendido de Playwright que incluye instancias listas para usar de las páginas
 * y un mecanismo automático para capturar evidencia en caso de fallos.
 */
export const test = base.extend<AppFixtures & { autoScreenshotOnFailure: void }>({
  /** Fixture de LoginPage: entrega la instancia navegada a la pantalla de login */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  /** Fixture de RegisterPage: entrega la instancia navegada a la pantalla de registro */
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await use(registerPage);
  },

  /** Fixture de AccountPage: inicia sesión con usuarioPrincipal y valida que cargue el área de cuenta */
  accountPage: async ({ page }, use) => {
    await loginAs(page, usuarioPrincipal);
    const accountPage = new AccountPage(page);
    await accountPage.expectLoaded();
    await use(accountPage);
  },

  /** Fixture de HomePage */
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await use(homePage);
  },

  /** Fixture de ProductPage abierto en el producto de prueba */
  productPage: async ({ page }, use) => {
    const productPage = new ProductPage(page);
    await productPage.goto(productoPrincipal.id);
    await use(productPage);
  },

  /** Fixture de ProductPage con sesión iniciada previamente */
  authenticatedProductPage: async ({ page }, use) => {
    await loginAs(page, usuarioPrincipal);
    const productPage = new ProductPage(page);
    await productPage.goto(productoPrincipal.id);
    await use(productPage);
  },

  /**
   * Fixture automático ({ auto: true }) que supervisa el estado final de cada prueba.
   * Si el test falla, guarda una captura fullPage en evidencias/fallo-<nombre>-<navegador>.png
   * con bloque try/catch para proteger la suite ante cierres imprevistos del navegador.
   */
  autoScreenshotOnFailure: [
    async ({ page }, use, testInfo) => {
      await use();
      if (testInfo.status !== testInfo.expectedStatus) {
        const testNameSanitized = testInfo.title.replace(/[^a-zA-Z0-9_-]/g, '_');
        const projectName = testInfo.project.name;
        const screenshotPath = path.join('evidencias', `fallo-${testNameSanitized}-${projectName}.png`);
        try {
          await page.screenshot({ path: screenshotPath, fullPage: true });
        } catch {
          // Ignorar de forma segura si la página o el contexto ya no están disponibles
        }
      }
    },
    { auto: true },
  ],
});

export { expect };
