import { test, expect } from '../fixtures';
import { usuarioPrincipalMarvin } from '../test-data/users';
import { loginAs } from '../helpers/auth';
import { AccountPage } from '../pages/AccountPage';

// La cuenta de Wilson puede quedar bloqueada por OpenCart; los tests de perfil usan la de Marvin.
async function abrirCuentaMarvin(page: import('@playwright/test').Page): Promise<AccountPage> {
  await loginAs(page, usuarioPrincipalMarvin);
  const accountPage = new AccountPage(page);
  await accountPage.expectLoaded();
  return accountPage;
}

test.describe('Regresión - Reseñas y Perfil de Usuario', () => {
  // -------------------------------------------------------------------------
  // 1. CALIFICACIÓN Y RESEÑA VÁLIDA
  // -------------------------------------------------------------------------
  test('calificar con 5 estrellas y enviar reseña válida', { tag: '@regression' }, async ({ productPage }) => {
    await productPage.calificar(5);
    await productPage.escribirResena('QA Wilson Tester', 'Este producto tiene una excelente calidad y rendimiento comprobado en pruebas.');
    await productPage.enviarResena();
    await productPage.expectResenaEnviada();
  });

  // -------------------------------------------------------------------------
  // 2. RESEÑA SIN CALIFICACIÓN (DEBE FALLAR)
  // -------------------------------------------------------------------------
  test('intento de enviar reseña sin calificación muestra error', { tag: '@regression' }, async ({ productPage }) => {
    await productPage.escribirResena('QA Wilson Tester', 'Texto de prueba sin seleccionar estrellas para validar mensaje de error.');
    await productPage.enviarResena();
    await productPage.expectErrorResena(/Warning: Please select a review rating!/i);
  });

  // -------------------------------------------------------------------------
  // 3. PARAMETRIZADO: VALORES LÍMITE DEL TEXTO DE LA RESEÑA (24, 25, 1000, 1001)
  // -------------------------------------------------------------------------
  const casosLimitesResena = [
    {
      longitud: 24,
      descripcion: '24 caracteres (límite inferior inválido)',
      valido: false,
      texto: 'A'.repeat(24),
    },
    {
      longitud: 25,
      descripcion: '25 caracteres (límite inferior válido)',
      valido: true,
      texto: 'B'.repeat(25),
    },
    {
      longitud: 1000,
      descripcion: '1000 caracteres (límite superior válido)',
      valido: true,
      texto: 'C'.repeat(1000),
    },
    {
      longitud: 1001,
      descripcion: '1001 caracteres (límite superior inválido)',
      valido: false,
      texto: 'D'.repeat(1001),
    },
  ];

  for (const { descripcion, valido, texto } of casosLimitesResena) {
    test(`límite de reseña: ${descripcion}`, { tag: '@regression' }, async ({ productPage }) => {
      await productPage.calificar(4);
      await productPage.escribirResena('QA Tester', texto);
      await productPage.enviarResena();

      if (valido) {
        await productPage.expectResenaEnviada();
      } else {
        await productPage.expectErrorResena(/Review Text must be between 25 and 1000 characters!/i);
      }
    });
  }

  // -------------------------------------------------------------------------
  // 4. CARACTERES ESPECIALES EN RESEÑAS
  // -------------------------------------------------------------------------
  test('reseña con caracteres especiales y etiquetas HTML', { tag: '@regression' }, async ({ productPage }) => {
    await productPage.calificar(5);
    await productPage.escribirResena('Tester <script>', '<b>Excelente producto</b> con acentos (ñ, á, é, í) y emojis ⭐🚀.');
    await productPage.enviarResena();
    await productPage.expectResenaEnviada();
  });

  // -------------------------------------------------------------------------
  // 5. EDICIÓN DE PERFIL CON PERSISTENCIA
  // -------------------------------------------------------------------------
  test('edición de teléfono en perfil con verificación de persistencia', { tag: '@regression' }, async ({ page }) => {
    const accountPage = await abrirCuentaMarvin(page);
    await accountPage.irAEditarPerfil();
    const telefonoOriginal = await accountPage.getTelephone();

    const telefonoNuevo = `5555${String(Date.now()).slice(-4)}`;

    try {
      await accountPage.editarPerfil({ telephone: telefonoNuevo });
      await accountPage.expectPerfilGuardado();

      // Recargar y volver a consultar para confirmar persistencia real en base de datos
      await accountPage.irAEditarPerfil();
      const telefonoGuardado = await accountPage.getTelephone();
      expect(telefonoGuardado).toBe(telefonoNuevo);
    } finally {
      // Restauración del valor original
      await accountPage.irAEditarPerfil();
      await accountPage.editarPerfil({ telephone: telefonoOriginal });
    }
  });

  // -------------------------------------------------------------------------
  // 6. VALIDACIÓN DE NOMBRE VACÍO EN EDICIÓN DE PERFIL
  // -------------------------------------------------------------------------
  test('dejar nombre vacío al editar perfil muestra validación', { tag: '@regression' }, async ({ page }) => {
    const accountPage = await abrirCuentaMarvin(page);
    await accountPage.irAEditarPerfil();
    await accountPage.editarPerfil({ firstName: '' });
    const textDanger = page.locator('#input-firstname ~ .text-danger, .form-group:has(#input-firstname) .text-danger');
    await expect(textDanger.first()).toContainText(/First Name must be between 1 and 32 characters!/i);
  });
});
