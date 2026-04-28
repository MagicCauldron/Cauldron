
export const authService = {
  isAuthenticated: () => localStorage.getItem('cauldron_auth') === 'true',
  login: () => localStorage.setItem('cauldron_auth', 'true'),
  logout: () => localStorage.removeItem('cauldron_auth')
};
