import { test, expect } from '@playwright/test';
import { usuarioPrincipal, credencialesInvalidas } from '../test-data/users';
import { loginAs, logout } from '../helpers/auth';

test.describe('Regresión - Autenticación', () => {
  test('login válido y logout', { tag: '@regression' }, async ({ page }) => {
    await loginAs(page, usuarioPrincipal);
    await expect(page).toHaveURL(/route=account\/account/);

    await logout(page);
    await expect(page.getByRole('heading', { name: 'Account Logout' })).toBeVisible();

    // Tras el logout, la zona de cuenta debe redirigir al login
    await page.goto('index.php?route=account/account');
    await expect(page).toHaveURL(/route=account\/login/);
  });

  test('login con email inexistente muestra error', { tag: '@regression' }, async ({ page }) => {
    // Email inexistente: no arriesga bloquear cuentas reales
    await page.goto('index.php?route=account/login');
    await page.locator('#input-email').fill(credencialesInvalidas.emailInexistente.email);
    await page.locator('#input-password').fill(credencialesInvalidas.emailInexistente.password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('.alert-danger')).toContainText('No match for E-Mail Address and/or Password');
    await expect(page).toHaveURL(/route=account\/login/);
  });
});
