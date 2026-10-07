export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
}

export const usuarioPrincipal: TestUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  telephone: '12345678',
  password: 'Password123!',
};
