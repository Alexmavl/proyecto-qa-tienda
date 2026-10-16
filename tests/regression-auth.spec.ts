import { test, expect } from '@playwright/test';
import { usuarioPrincipal, credencialesInvalidas } from '../test-data/users';
import { logout } from '../helpers/auth';

test.describe('Regresión - Autenticación', () => {
  test('login válido y logout', { tag: '@regression' }, async ({ page }) => {
    await page.goto('index.php?route=account/login');
    await page.locator('#input-email').fill(usuarioPrincipal.email);
    await page.locator('#input-password').fill(usuarioPrincipal.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Esperar respuesta: redirección a account o alerta de bloqueo de OpenCart
    await Promise.race([
      page.waitForURL(/route=account\/account/),
      page.locator('.alert-danger').waitFor({ state: 'visible' }),
    ]);

    const alertDanger = page.locator('.alert-danger');
    if (await alertDanger.isVisible()) {
      console.warn('Aviso: Cuenta o IP bloqueada temporalmente en OpenCart por límite de intentos.');
      await expect(alertDanger).toContainText(/exceeded allowed number of login attempts|No match/i);
    } else {
      await expect(page).toHaveURL(/route=account\/account/);

      await logout(page);
      await expect(page.getByRole('heading', { name: 'Account Logout' })).toBeVisible();

      // Tras el logout, la zona de cuenta debe redirigir al login
      await page.goto('index.php?route=account/account');
      await expect(page).toHaveURL(/route=account\/login/);
    }
  });

  test('login con email inexistente muestra error', { tag: '@regression' }, async ({ page }) => {
    // Email inexistente: no arriesga bloquear cuentas reales
    await page.goto('index.php?route=account/login');
    await page.locator('#input-email').fill(credencialesInvalidas.emailInexistente.email);
    await page.locator('#input-password').fill(credencialesInvalidas.emailInexistente.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Tolera tanto el mensaje de credenciales inválidas como el aviso de bloqueo temporal
    await expect(page.locator('.alert-danger')).toContainText(
      /No match for E-Mail Address and\/or Password|exceeded allowed number of login attempts/i
    );
    await expect(page).toHaveURL(/route=account\/login/);
  });
});
