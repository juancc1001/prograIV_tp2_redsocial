import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.token()) {
    return router.createUrlTree(['/login']);
  }

  // mientras espera la respuesta se ve el spinner de app.component (checkingGuards)
  return new Promise((resolve) => {
    authService.authorize().subscribe({
      next: () => {
        resolve(true);
      },
      error: () => {
        authService.clearSession();
        resolve(router.createUrlTree(['/login']));
      }
    });
  });
};
