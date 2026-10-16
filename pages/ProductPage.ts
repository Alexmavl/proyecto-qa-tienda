import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object para la página de detalle de producto y reseñas de OpenCart.
 * Ruta: index.php?route=product/product&product_id=...
 */
export class ProductPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly reviewTabLink: Locator;
  readonly reviewerNameInput: Locator;
  readonly reviewTextInput: Locator;
  readonly submitReviewButton: Locator;
  readonly alertSuccess: Locator;
  readonly alertDanger: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('h1.h3, h1');
    this.productPrice = page.locator('.price, .price-new').first();
    this.reviewTabLink = page.getByRole('tab', { name: /Reviews/i }).or(page.locator('a[href="#tab-review"]'));
    this.reviewerNameInput = page.locator('#input-name');
    this.reviewTextInput = page.locator('#input-review');
    this.submitReviewButton = page.locator('#button-review');
    this.alertSuccess = page.locator('.alert-success');
    this.alertDanger = page.locator('.alert-danger');
  }

  /** Navega al detalle de un producto por su ID */
  async goto(productId: number): Promise<void> {
    await this.page.goto(`index.php?route=product/product&product_id=${productId}`);
  }

  /** Verifica que el detalle del producto (título y precio) esté cargado */
  async expectDetalleVisible(): Promise<void> {
    await expect(this.productTitle).toBeVisible();
    await expect(this.productPrice).toBeVisible();
  }

  /** Selecciona la cantidad de estrellas (1 a 5) en el formulario de reseña */
  async calificar(estrellas: 1 | 2 | 3 | 4 | 5): Promise<void> {
    const radioRating = this.page.locator(`input[name="rating"][value="${estrellas}"]`);
    await radioRating.check({ force: true });
  }

  /** Llena los campos de la reseña */
  async escribirResena(nombre: string, texto: string): Promise<void> {
    await this.reviewerNameInput.fill(nombre);
    await this.reviewTextInput.fill(texto);
  }

  /** Envía la reseña */
  async enviarResena(): Promise<void> {
    await this.submitReviewButton.click();
  }

  /** Valida el mensaje de confirmación de reseña enviada */
  async expectResenaEnviada(): Promise<void> {
    await expect(this.alertSuccess).toBeVisible();
    await expect(this.alertSuccess).toContainText(/Thank you for your review/i);
  }

  /** Valida el mensaje de error de reseña */
  async expectErrorResena(mensaje: string | RegExp): Promise<void> {
    await expect(this.alertDanger).toBeVisible();
    if (typeof mensaje === 'string') {
      await expect(this.alertDanger).toContainText(mensaje);
    } else {
      await expect(this.alertDanger).toHaveText(mensaje);
    }
  }
}
