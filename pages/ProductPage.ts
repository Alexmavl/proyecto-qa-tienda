import { Page } from '@playwright/test';

export class ProductPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}
