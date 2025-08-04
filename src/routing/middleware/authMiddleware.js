/**
 * Middleware per la gestione dell'autenticazione
 */
export const authMiddleware = (to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const authIsParsed = JSON.parse(isAuthenticated);

  // Se la rotta richiede di essere guest e l'utente è autenticato
  if (to.meta.requiresGuest && authIsParsed) {
    next({ name: 'home' });
    return;
  }

  // Se la rotta richiede autenticazione e l'utente non è autenticato
  if (to.meta.requiresAuth && !authIsParsed) {
    next({ name: 'signin' });
    return;
  }

  next();
};