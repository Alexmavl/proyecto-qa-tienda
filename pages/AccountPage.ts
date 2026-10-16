import { Page, Locator, expect } from '@playwright/test';
import { TestUser } from '../test-data/users';

/**
 * Page Object para el área de cuenta, edición de perfil y cambio de contraseña.
 * Rutas:
 *  - index.php?route=account/account
 *  - index.php?route=account/edit
 *  - index.php?route=account/password
 *  - index.php?route=account/logout
 * Estilo POM Clase 6: locators readonly, métodos de alto nivel y aserciones reutilizables.
 */
export class AccountPage {
  readonly page: Page;
  readonly accountHeading: Locator;
  readonly editAccountLink: Locator;
  readonly passwordLink: Locator;
  readonly logoutLink: Locator;

  // Formulario de edición de perfil (route=account/edit)
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly telephoneInput: Locator;
  readonly saveProfileButton: Locator;

  // Formulario de cambio de contraseña (route=account/password)
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly savePasswordButton: Locator;

  // Alertas y encabezados de estado
  readonly alertSuccess: Locator;
  readonly alertDanger: Locator;
  readonly logoutHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountHeading = page.getByRole('heading', { name: 'My Account' }).first();
    this.editAccountLink = page.getByRole('link', { name: /Edit your account information/i }).first();
    this.passwordLink = page.getByRole('link', { name: /Change your password/i }).first();
    this.logoutLink = page.getByRole('link', { name: 'Logout' }).first();

    // Campos de edición de perfil
    this.firstNameInput = page.locator('#input-firstname');
    this.lastNameInput = page.locator('#input-lastname');
    this.emailInput = page.locator('#input-email');
    this.telephoneInput = page.locator('#input-telephone');
    this.saveProfileButton = page.locator('input[value="Continue"], button:has-text("Continue")').first();

    // Campos de contraseña
    this.newPasswordInput = page.locator('#input-password');
    this.confirmPasswordInput = page.locator('#input-confirm');
    this.savePasswordButton = page.locator('input[value="Continue"], button:has-text("Continue")').first();

    // Mensajes de éxito y logout
    this.alertSuccess = page.locator('.alert-success');
    this.alertDanger = page.locator('.alert-danger');
    this.logoutHeading = page.getByRole('heading', { name: /Account Logout/i });
  }

  /** Navega directamente a la página principal de la cuenta */
  async goto(): Promise<void> {
    await this.page.goto('index.php?route=account/account', { waitUntil: 'domcontentloaded' });
  }

  /** Verifica que la página de cuenta haya cargado correctamente */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/route=account\/account/);
    await expect(this.accountHeading).toBeVisible();
  }

  /** Ejecuta el cierre de sesión */
  async logout(): Promise<void> {
    await this.page.goto('index.php?route=account/logout', { waitUntil: 'domcontentloaded' });
  }

  /** Verifica que se haya redirigido a la página de confirmación de logout */
  async expectLogoutPage(): Promise<void> {
    await expect(this.page).toHaveURL(/route=account\/logout/);
    await expect(this.logoutHeading).toBeVisible();
  }

  /** Navega hacia la pantalla de edición de información de cuenta */
  async irAEditarPerfil(): Promise<void> {
    await this.page.goto('index.php?route=account/edit', { waitUntil: 'domcontentloaded' });
    await expect(this.firstNameInput).toBeVisible();
  }

  /** Edita los campos provistos del perfil y guarda cambios */
  async editarPerfil(datos: Partial<TestUser>): Promise<void> {
    if (datos.firstName !== undefined) {
      await this.firstNameInput.fill(datos.firstName);
    }
    if (datos.lastName !== undefined) {
      await this.lastNameInput.fill(datos.lastName);
    }
    if (datos.email !== undefined) {
      await this.emailInput.fill(datos.email);
    }
    if (datos.telephone !== undefined) {
      await this.telephoneInput.fill(datos.telephone);
    }
    await this.saveProfileButton.click();
  }

  /** Verifica que el perfil se haya actualizado con éxito */
  async expectPerfilGuardado(): Promise<void> {
    await expect(this.alertSuccess).toBeVisible();
    await expect(this.alertSuccess).toContainText(/Success: Your account has been successfully updated/i);
  }

  /** Navega y cambia la contraseña de la cuenta */
  async cambiarPassword(nuevaPassword: string, confirmacion: string = nuevaPassword): Promise<void> {
    await this.page.goto('index.php?route=account/password', { waitUntil: 'domcontentloaded' });
    await this.newPasswordInput.fill(nuevaPassword);
    await this.confirmPasswordInput.fill(confirmacion);
    await this.savePasswordButton.click();
  }

  /** Verifica el mensaje de éxito de cambio de contraseña */
  async expectPasswordCambiado(): Promise<void> {
    await expect(this.alertSuccess).toBeVisible();
    await expect(this.alertSuccess).toContainText(/Success: Your password has been successfully updated/i);
  }

  // ---------- Getters para comprobación de persistencia ----------

  async getFirstName(): Promise<string> {
    return (await this.firstNameInput.inputValue()).trim();
  }

  async getLastName(): Promise<string> {
    return (await this.lastNameInput.inputValue()).trim();
  }

  async getEmail(): Promise<string> {
    return (await this.emailInput.inputValue()).trim();
  }

  async getTelephone(): Promise<string> {
    return (await this.telephoneInput.inputValue()).trim();
  }
}
