/**
 * Datos de prueba de usuarios - Grupo 5, Variante 1.
 * Todos los datos son ficticios (dominio example.com, nombres "QA Grupo5").
 * Las contraseñas pueden sobrescribirse con variables de entorno (CI);
 * si no existen, se usa el valor local.
 */
export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
}

const PASSWORD_LOCAL = 'Test1234!';

// ---------- Cuentas ya creadas manualmente ----------

export const usuarioPrincipal: TestUser = {
  firstName: 'QA',
  lastName: 'Grupo5 Wilson',
  email: 'qa.grupo5.wilson@example.com',
  telephone: '55550001',
  password: process.env.QA_PASSWORD_PRINCIPAL ?? PASSWORD_LOCAL,
};

// Cuenta reservada para los tests que cambian la contraseña
export const usuarioCambioPassword: TestUser = {
  firstName: 'QA',
  lastName: 'Grupo5 Wilson Pwd',
  email: 'qa.grupo5.wilson2.pwd@example.com',
  telephone: '55550002',
  password: process.env.QA_PASSWORD_CAMBIO ?? PASSWORD_LOCAL,
};

// Cuentas del compañero Marvin (mismo patrón)
export const usuarioPrincipalMarvin: TestUser = {
  firstName: 'QA',
  lastName: 'Grupo5 Marvin',
  email: 'qa.grupo5.marvin@example.com',
  telephone: '55550011',
  password: process.env.QA_PASSWORD_MARVIN ?? PASSWORD_LOCAL,
};

export const usuarioCambioPasswordMarvin: TestUser = {
  firstName: 'QA',
  lastName: 'Grupo5 Marvin Pwd',
  email: 'qa.grupo5.marvin.pwd@example.com',
  telephone: '55550012',
  password: process.env.QA_PASSWORD_MARVIN_CAMBIO ?? PASSWORD_LOCAL,
};

// ---------- Credenciales inválidas ----------
// El email NO existe en la tienda, así que nunca bloquea una cuenta real.

export const credencialesInvalidas = {
  emailInexistente: {
    email: 'no.existe.qa.grupo5@example.com',
    password: 'Cualquier1234!',
  },
  // Email real pero contraseña errónea: PELIGRO, ver advertencia en helpers/auth.ts.
  // Solo usar con una cuenta desechable creada con generarUsuarioNuevo().
  passwordIncorrecta: {
    password: 'PasswordIncorrecta999!',
  },
  vacios: {
    email: '',
    password: '',
  },
} as const;

// ---------- Usuarios únicos para registro ----------

let contador = 0;

/**
 * Genera un usuario único (timestamp + contador + sufijo) para registro.
 * Pasar un sufijo distinto por proyecto (p. ej. testInfo.project.name)
 * evita colisiones entre chromium y firefox corriendo en paralelo.
 */
export function generarUsuarioNuevo(sufijo: string): TestUser {
  const limpio = sufijo.toLowerCase().replace(/[^a-z0-9]/g, '');
  const unico = `${Date.now()}${contador++}${limpio}`;
  return {
    firstName: 'QA',
    lastName: `Grupo5 ${sufijo}`,
    email: `qa.grupo5.${unico}@example.com`,
    // 8 dígitos, prefijo 5555 + últimos 4 del timestamp
    telephone: `5555${String(Date.now()).slice(-4)}`,
    password: process.env.QA_PASSWORD_NUEVO ?? PASSWORD_LOCAL,
  };
}
