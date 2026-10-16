import { Page, Locator, expect } from '@playwright/test';
import { TestUser } from '../test-data/users';

export type CampoRegistro =
  | 'firstname'
  | 'lastname'
  | 'email'
  | 'telephone'
  | 'password'
  | 'confirm'
  | 'policy';

export interface RegisterOptions {
  aceptarPolitica?: boolean;
  confirmarPassword?: string;
  suscribirNewsletter?: boolean;
}

/**
 * Page Object para la página de registro de usuarios en OpenCart.
 * Ruta: index.php?route=account/register
 * Estilo POM Clase 6: locators readonly, métodos de alto nivel y aserciones reutilizables.
 */
export class RegisterPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly telephoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly newsletterYesRadio: Locator;
  readonly newsletterNoRadio: Locator;
  readonly privacyPolicyCheckbox: Locator;
  readonly continueButton: Locator;
  readonly alertDanger: Locator;
  readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('#input-firstname');
    this.lastNameInput = page.locator('#input-lastname');
    this.emailInput = page.locator('#input-email');
    this.telephoneInput = page.locator('#input-telephone');
    this.passwordInput = page.locator('#input-password');
    this.confirmPasswordInput = page.locator('#input-confirm');
    this.newsletterYesRadio = page.locator('input[name="newsletter"][value="1"]');
    this.newsletterNoRadio = page.locator('input[name="newsletter"][value="0"]');
    this.privacyPolicyCheckbox = page.locator('input[name="agree"]');
    this.continueButton = page.locator('input[value="Continue"], button:has-text("Continue")').first();
    this.alertDanger = page.locator('.alert-danger');
    this.successHeading = page.getByRole('heading', { name: /Your Account Has Been Created!/i });
  }

  /** Navega a la página de registro */
  async goto(): Promise<void> {
    await this.page.goto('index.php?route=account/register');
  }

  /**
   * Llena el formulario de registro y lo envía.
   * Por defecto acepta la política y confirma la misma contraseña provista en el usuario.
   */
  async register(user: TestUser, opciones: RegisterOptions = {}): Promise<void> {
    const {
      aceptarPolitica = true,
      confirmarPassword = user.password,
      suscribirNewsletter = false,
    } = opciones;

    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.telephoneInput.fill(user.telephone);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(confirmarPassword);

    if (suscribirNewsletter) {
      await this.newsletterYesRadio.check({ force: true });
    } else {
      await this.newsletterNoRadio.check({ force: true });
    }

    if (aceptarPolitica) {
      if (!(await this.privacyPolicyCheckbox.isChecked())) {
        await this.privacyPolicyCheckbox.check({ force: true });
      }
    } else {
      if (await this.privacyPolicyCheckbox.isChecked()) {
        await this.privacyPolicyCheckbox.uncheck({ force: true });
      }
    }

    await this.continueButton.click();
  }

  /** Verifica que el registro haya sido exitoso redirigiendo a la pantalla de éxito */
  async expectSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/route=account\/success/);
    await expect(this.successHeading).toBeVisible();
  }

  /**
   * Verifica el mensaje de error para un campo específico o para la política de privacidad.
   */
  async expectFieldError(campo: CampoRegistro, expectedTextOrRegex: string | RegExp): Promise<void> {
    if (campo === 'policy') {
      await expect(this.alertDanger).toBeVisible();
      if (typeof expectedTextOrRegex === 'string') {
        await expect(this.alertDanger).toContainText(expectedTextOrRegex);
      } else {
        await expect(this.alertDanger).toHaveText(expectedTextOrRegex);
      }
      return;
    }

    // Para email ya registrado, OpenCart suele mostrar un alert-danger en el encabezado
    if (campo === 'email') {
      const emailFieldDanger = this.page.locator('#input-email ~ .text-danger, .form-group:has(#input-email) .text-danger');
      const isFieldDangerVisible = await emailFieldDanger.isVisible().catch(() => false);
      if (isFieldDangerVisible) {
        await expect(emailFieldDanger).toContainText(expectedTextOrRegex);
        return;
      }
      // Si no está en el campo directo, verificar alerta general (p. ej. "E-Mail Address is already registered!")
      await expect(this.alertDanger).toContainText(expectedTextOrRegex);
      return;
    }

    const mapSelector: Record<Exclude<CampoRegistro, 'policy' | 'email'>, string> = {
      firstname: '#input-firstname ~ .text-danger, .form-group:has(#input-firstname) .text-danger',
      lastname: '#input-lastname ~ .text-danger, .form-group:has(#input-lastname) .text-danger',
      telephone: '#input-telephone ~ .text-danger, .form-group:has(#input-telephone) .text-danger',
      password: '#input-password ~ .text-danger, .form-group:has(#input-password) .text-danger',
      confirm: '#input-confirm ~ .text-danger, .form-group:has(#input-confirm) .text-danger',
    };

    const targetLocator = this.page.locator(mapSelector[campo]).first();
    await expect(targetLocator).toBeVisible();
    if (typeof expectedTextOrRegex === 'string') {
      await expect(targetLocator).toContainText(expectedTextOrRegex);
    } else {
      await expect(targetLocator).toHaveText(expectedTextOrRegex);
    }
  }
}
