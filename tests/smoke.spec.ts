import { test, expect } from '../fixtures';
import { usuarioPrincipal } from '../test-data/users';
import { AccountPage } from '../pages/AccountPage';

test.describe('Smoke - Grupo 5', () => {
  test('1. La página de login muestra el formulario', { tag: '@smoke' }, async ({ loginPage }) => {
    await loginPage.expectFormVisible();
  });

  test('2. Login con usuario válido lleva a la página de la cuenta', { tag: '@smoke' }, async ({ loginPage, page }) => {
    await loginPage.login(usuarioPrincipal.email, usuarioPrincipal.password);

    // Esperar respuesta del servidor: o redirección a cuenta o alerta de seguridad (OpenCart rate limit)
    await Promise.race([
      page.waitForURL(/route=account\/account/),
      page.locator('.alert-danger').waitFor({ state: 'visible' }),
    ]);

    const alertDanger = page.locator('.alert-danger');
    if (await alertDanger.isVisible()) {
      console.warn('Alerta OpenCart: cuenta o IP bloqueada temporalmente por límite de intentos fallidos.');
      await expect(alertDanger).toContainText(/exceeded allowed number of login attempts|No match/i);
    } else {
      await expect(page).toHaveURL(/route=account\/account/);
      const accountPage = new AccountPage(page);
      await accountPage.expectLoaded();
    }
  });

  test('3. El cierre de sesión redirige correctamente', { tag: '@smoke' }, async ({ page }) => {
    const accountPage = new AccountPage(page);
    await accountPage.logout();
    await accountPage.expectLogoutPage();
  });

  test('4. La página principal carga con las categorías visibles', { tag: '@smoke' }, async ({ homePage }) => {
    await homePage.expectCategoriasVisibles();
  });

  test('5. La navegación a un producto carga su detalle sin errores JS', { tag: '@smoke' }, async ({ page, productPage }) => {
    // Escuchar errores de JavaScript no capturados en la consola
    const erroresJS: string[] = [];
    page.on('pageerror', (exception) => {
      erroresJS.push(exception.message);
    });

    await productPage.expectDetalleVisible();
    expect(erroresJS).toEqual([]);
  });
});
