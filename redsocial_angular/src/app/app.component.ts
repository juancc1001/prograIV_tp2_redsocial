import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ErrorSnackbarComponent } from './core/components/error-snackbar/error-snackbar.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { SessionModalComponent } from './core/components/session-modal/session-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ErrorSnackbarComponent, NavbarComponent, SessionModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly hiddenNavbarRoutes = ['/login', '/register'];

  readonly showNavbar = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => !this.hiddenNavbarRoutes.includes((event as NavigationEnd).urlAfterRedirects))
    ),
    { initialValue: false }
  );
}
