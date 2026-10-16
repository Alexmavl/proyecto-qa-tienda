import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object para la página principal (Home) de LambdaTest E-commerce.
 * Ruta: index.php?route=common/home
 */
export class HomePage {
  readonly page: Page;
  readonly shopByCategoryButton: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly topCategoriesMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shopByCategoryButton = page.getByRole('button', { name: 'Shop by Category' });
    this.searchInput = page.getByPlaceholder('Search For Products').or(page.locator('#search input[name="search"]')).first();
    this.searchButton = page.getByRole('button', { name: 'Search' }).first();
    this.topCategoriesMenu = page.locator('#entry_217834, .navbar-nav');
  }

  /** Navega a la home page */
  async goto(): Promise<void> {
    await this.page.goto('index.php?route=common/home');
  }

  /** Verifica que las categorías principales o el menú de categorías sean visibles */
  async expectCategoriasVisibles(): Promise<void> {
    await expect(this.shopByCategoryButton).toBeVisible();
  }

  /** Ejecuta una búsqueda desde el header */
  async buscar(termino: string): Promise<void> {
    await this.searchInput.fill(termino);
    await this.searchButton.click();
  }

  /** Abre un producto por su nombre desde cualquier lista */
  async abrirProducto(nombre: string): Promise<void> {
    await this.page.getByRole('link', { name: nombre }).first().click();
  }
}
