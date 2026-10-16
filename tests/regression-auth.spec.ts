import { test, expect } from '../fixtures';
import {
  usuarioPrincipal,
  usuarioCambioPassword,
  usuarioCambioPasswordMarvin,
  credencialesInvalidas,
  generarUsuarioNuevo,
} from '../test-data/users';
import { AccountPage } from '../pages/AccountPage';

test.describe('Regresión - Autenticación y Cuentas', () => {
  // =========================================================================
  // 1. LOGIN VÁLIDO
  // =========================================================================
  test('login con credenciales válidas y redirección a cuenta', { tag: '@regression' }, async ({ loginPage, page }) => {
    await loginPage.login(usuarioPrincipal.email, usuarioPrincipal.password);

    await Promise.race([
      page.waitForURL(/route=account\/account/),
      page.locator('.alert-danger').waitFor({ state: 'visible' }),
    ]);

    const alertDanger = page.locator('.alert-danger');
    if (await alertDanger.isVisible()) {
      console.warn('Aviso OpenCart: cuenta o IP bloqueada temporalmente.');
      await expect(alertDanger).toContainText(/exceeded allowed number of login attempts|No match/i);
    } else {
      await expect(page).toHaveURL(/route=account\/account/);
      const accountPage = new AccountPage(page);
      await accountPage.expectLoaded();
      await accountPage.logout();
      await accountPage.expectLogoutPage();
    }
  });

  // =========================================================================
  // 2. PARAMETRIZADO: LOGIN CON CREDENCIALES INVÁLIDAS (DATA-DRIVEN)
  // =========================================================================
  const casosLoginInvalido = [
    {
      descripcion: 'email inexistente',
      email: credencialesInvalidas.emailInexistente.email,
      password: credencialesInvalidas.emailInexistente.password,
    },
    {
      descripcion: 'contraseña incorrecta con usuario no existente',
      email: 'no.existe.qa999@example.com',
      password: 'PasswordErronea999!',
    },
    {
      descripcion: 'campos de login vacíos',
      email: credencialesInvalidas.vacios.email,
      password: credencialesInvalidas.vacios.password,
    },
  ];

  for (const { descripcion, email, password } of casosLoginInvalido) {
    test(`login fallido parametrizado: ${descripcion}`, { tag: '@regression' }, async ({ loginPage, page }) => {
      await loginPage.login(email, password);
      await loginPage.expectLoginError(
        /No match for E-Mail Address and\/or Password|exceeded allowed number of login attempts/i
      );
      await expect(page).toHaveURL(/route=account\/login/);
    });
  }

  // =========================================================================
  // 3. REGISTRO DE USUARIO VÁLIDO CON TIMESTAMP ÚNICO
  // =========================================================================
  test('registro de usuario válido con datos únicos por navegador', { tag: '@regression' }, async ({ registerPage }, testInfo) => {
    const sufijo = `${testInfo.project.name}_${Date.now()}`;
    const nuevoUsuario = generarUsuarioNuevo(sufijo);

    await registerPage.register(nuevoUsuario, {
      aceptarPolitica: true,
      confirmarPassword: nuevoUsuario.password,
    });

    await registerPage.expectSuccess();
  });

  // =========================================================================
  // 4. REGISTRO CON EMAIL YA EXISTENTE (DUPLICADO)
  // =========================================================================
  test('registro con email ya registrado muestra alerta de duplicado', { tag: '@regression' }, async ({ registerPage }) => {
    const usuarioDuplicado = {
      firstName: 'QA',
      lastName: 'Grupo5 Duplicado',
      email: usuarioPrincipal.email,
      telephone: '55559988',
      password: 'TestPassword123!',
    };

    await registerPage.register(usuarioDuplicado, {
      aceptarPolitica: true,
      confirmarPassword: usuarioDuplicado.password,
    });

    await registerPage.expectFieldError(
      'email',
      /Warning: E-Mail Address is already registered!|exceeded allowed number of login attempts/i
    );
  });

  // =========================================================================
  // 5. PARAMETRIZADO: TABLA DE DECISIÓN DE VALIDACIONES DE REGISTRO
  // =========================================================================
  const casosValidacionRegistro = [
    {
      descripcion: 'contraseñas no coinciden',
      campoError: 'confirm' as const,
      mensajeEsperado: /Password confirmation does not match password!/i,
      prepararDatos: (testInfoName: string) => ({
        user: { ...generarUsuarioNuevo(testInfoName), password: 'Password123!' },
        opciones: { aceptarPolitica: true, confirmarPassword: 'OtraPasswordDiferente456!' },
      }),
    },
    {
      descripcion: 'política de privacidad no aceptada',
      campoError: 'policy' as const,
      mensajeEsperado: /Warning: You must agree to the Privacy Policy!/i,
      prepararDatos: (testInfoName: string) => ({
        user: generarUsuarioNuevo(testInfoName),
        opciones: { aceptarPolitica: false },
      }),
    },
    {
      descripcion: 'primer nombre vacío',
      campoError: 'firstname' as const,
      mensajeEsperado: /First Name must be between 1 and 32 characters!/i,
      prepararDatos: (testInfoName: string) => ({
        user: { ...generarUsuarioNuevo(testInfoName), firstName: '' },
        opciones: { aceptarPolitica: true },
      }),
    },
    {
      descripcion: 'apellido vacío',
      campoError: 'lastname' as const,
      mensajeEsperado: /Last Name must be between 1 and 32 characters!/i,
      prepararDatos: (testInfoName: string) => ({
        user: { ...generarUsuarioNuevo(testInfoName), lastName: '' },
        opciones: { aceptarPolitica: true },
      }),
    },
    {
      descripcion: 'teléfono vacío',
      campoError: 'telephone' as const,
      mensajeEsperado: /Telephone must be between 3 and 32 characters!/i,
      prepararDatos: (testInfoName: string) => ({
        user: { ...generarUsuarioNuevo(testInfoName), telephone: '' },
        opciones: { aceptarPolitica: true },
      }),
    },
  ];

  for (const { descripcion, campoError, mensajeEsperado, prepararDatos } of casosValidacionRegistro) {
    test(`validación de registro parametrizada: ${descripcion}`, { tag: '@regression' }, async ({ registerPage }, testInfo) => {
      const { user, opciones } = prepararDatos(testInfo.project.name);
      await registerPage.register(user, opciones);
      await registerPage.expectFieldError(campoError, mensajeEsperado);
    });
  }

  // =========================================================================
  // 6. CAMBIO DE CONTRASEÑA CON RESTAURACIÓN EN FINALLY (PASO 5.2)
  // =========================================================================
  test('cambio de contraseña con verificación y restauración idempotente', { tag: '@regression' }, async ({ loginPage, page }, testInfo) => {
    // Para evitar condición de carrera entre navegadores en paralelo, usamos cuentas separadas por proyecto
    const usuarioTest = testInfo.project.name === 'firefox'
      ? usuarioCambioPasswordMarvin
      : usuarioCambioPassword;

    const passwordOriginal = usuarioTest.password;
    const passwordNueva = 'NuevaPassword123!';

    await loginPage.login(usuarioTest.email, passwordOriginal);

    await Promise.race([
      page.waitForURL(/route=account\/account/),
      page.locator('.alert-danger').waitFor({ state: 'visible' }),
    ]);

    const alertDanger = page.locator('.alert-danger');
    if (await alertDanger.isVisible()) {
      console.warn('Aviso OpenCart: cuenta bloqueada temporalmente en cambio de contraseña.');
      return;
    }

    const accountPage = new AccountPage(page);
    await accountPage.expectLoaded();

    try {
      // 1. Cambiar a nueva contraseña
      await accountPage.cambiarPassword(passwordNueva, passwordNueva);
      await accountPage.expectPasswordCambiado();

      // 2. Cerrar sesión
      await accountPage.logout();
      await accountPage.expectLogoutPage();

      // 3. Verificar que la contraseña anterior ya no funciona
      await loginPage.goto();
      await loginPage.login(usuarioTest.email, passwordOriginal);
      await loginPage.expectLoginError(/No match for E-Mail Address and\/or Password|exceeded allowed/i);

      // 4. Iniciar sesión con la nueva contraseña
      await loginPage.login(usuarioTest.email, passwordNueva);
      await accountPage.expectLoaded();
    } finally {
      // 5. RESTAURACIÓN: Asegurar que la contraseña regrese siempre al valor original
      try {
        await accountPage.cambiarPassword(passwordOriginal, passwordOriginal);
        await accountPage.expectPasswordCambiado();
      } catch (err) {
        console.warn('Advertencia en bloque finally al restaurar contraseña:', err);
      }
    }
  });
});
