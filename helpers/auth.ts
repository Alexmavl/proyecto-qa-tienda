import { Page, expect } from '@playwright/test';
import { TestUser } from '../test-data/users';

/**
 * ADVERTENCIA - BLOQUEO DE CUENTA EN OPENCART:
 * OpenCart bloquea una cuenta tras 5 intentos fallidos de login durante 1 hora.
 * Por eso los tests de login fallido deben usar emails INEXISTENTES
 * (credencialesInvalidas.emailInexistente) o un usuario desechable aparte
 * (generarUsuarioNuevo), NUNCA usuarioPrincipal ni usuarioCambioPassword.
 */

const RUTA_LOGIN = 'index.php?route=account/login';
const RUTA_LOGOUT = 'index.php?route=account/logout';

/** Inicia sesión con el usuario dado y espera a llegar a account/account. */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto(RUTA_LOGIN);
  await page.locator('#input-email').fill(user.email);
  await page.locator('#input-password').fill(user.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/route=account\/account/);
}

/** Cierra sesión y verifica que el sitio muestre la página de logout. */
export async function logout(page: Page): Promise<void> {
  await page.goto(RUTA_LOGOUT);
  await expect(page).toHaveURL(/route=account\/logout/);
}
