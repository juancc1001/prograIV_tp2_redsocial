import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// el token se valida contra la API una sola vez, al abrir la app
let authorized = false;

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.token()) {
    return router.createUrlTree(['/login']);
  }

  if (authorized) {
    return true;
  }

  // mientras espera la respuesta se ve el spinner de app.component (checkingGuards)
  return new Promise((resolve) => {
    authService.authorize().subscribe({
      next: () => {
        authorized = true;
        resolve(true);
      },
      error: () => {
        authService.clearSession();
        resolve(router.createUrlTree(['/login']));
      }
    });
  });
};
