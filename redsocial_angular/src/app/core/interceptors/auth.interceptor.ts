import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

//hereda de HttpInterceptorFn y agrega el token a cualquier request http
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  //añade el token al header
  const token = authService.token();
  if (token) {
    request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  //next pasa la validación del 401 a luego del backend porque este es el último interceptor
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // cualquier 401 cierra la sesión y manda al login
      if (error.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
