import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { LoaderService } from '../../services/loader.service';
import { IsAdminDirective } from '../../directives/is-admin.directive';
import { catchError, finalize, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIconModule, RouterLink, IsAdminDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  protected readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);

  // se trae el perfil del usuario logueado para mostrar su foto
  readonly profile = toSignal(
    toObservable(this.authService.username).pipe(
      switchMap(username => {
        if (!username) {
          return of(null);
        }
        return this.usersService.getProfile(username).pipe(catchError(() => of(null)));
      })
    )
  );

  menuOpen = signal(false);

  logout(): void {
    this.loaderService.show();
    this.authService.logout().pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
