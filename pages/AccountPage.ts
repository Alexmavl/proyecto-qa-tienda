import { Page } from '@playwright/test';

export class AccountPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}
