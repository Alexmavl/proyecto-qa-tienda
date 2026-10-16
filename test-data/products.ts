export interface TestProduct {
  id: number;
  name: string;
  urlRoute: string;
}

export const productosPrueba = {
  htcTouch: {
    id: 28,
    name: 'HTC Touch HD',
    urlRoute: 'index.php?route=product/product&product_id=28',
  },
  palmTreo: {
    id: 29,
    name: 'Palm Treo Pro',
    urlRoute: 'index.php?route=product/product&product_id=29',
  },
  canonEOS: {
    id: 30,
    name: 'Canon EOS 5D',
    urlRoute: 'index.php?route=product/product&product_id=30',
  },
} as const;

export const productoPrincipal = productosPrueba.htcTouch;
