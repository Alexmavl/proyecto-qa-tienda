import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object para la página de inicio de sesión de OpenCart.
 * Ruta: index.php?route=account/login
 * Estilo POM Clase 6: locators readonly, métodos de alto nivel y aserciones reutilizables.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly returningCustomerHeading: Locator;
  readonly alertDanger: Locator;
  readonly forgottenPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#input-email');
    this.passwordInput = page.locator('#input-password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.returningCustomerHeading = page.getByRole('heading', { name: 'Returning Customer' });
    this.alertDanger = page.locator('.alert-danger');
    this.forgottenPasswordLink = page.getByRole('link', { name: 'Forgotten Password' }).first();
  }

  /** Navega a la página de login */
  async goto(): Promise<void> {
    await this.page.goto('index.php?route=account/login', { waitUntil: 'domcontentloaded' });
  }

  /** Llena credenciales y envía el formulario */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Valida que los elementos clave del formulario de login sean visibles */
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.returningCustomerHeading).toBeVisible();
  }

  /**
   * Verifica que se muestre una alerta de error con el texto o patrón esperado.
   * Admite RegExp para tolerar avisos de bloqueo de cuenta por límite de intentos.
   */
  async expectLoginError(expectedTextOrRegex: string | RegExp): Promise<void> {
    await expect(this.alertDanger).toBeVisible();
    if (typeof expectedTextOrRegex === 'string') {
      await expect(this.alertDanger).toContainText(expectedTextOrRegex);
    } else {
      await expect(this.alertDanger).toHaveText(expectedTextOrRegex);
    }
  }
}
