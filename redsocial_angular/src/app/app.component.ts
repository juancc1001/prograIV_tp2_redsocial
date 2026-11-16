import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuardsCheckEnd, GuardsCheckStart, NavigationCancel, NavigationEnd, NavigationError, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ErrorSnackbarComponent } from './core/components/error-snackbar/error-snackbar.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { SessionModalComponent } from './core/components/session-modal/session-modal.component';
import { LoaderComponent } from './core/components/loader/loader.component';
import { LoaderService } from './core/services/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ErrorSnackbarComponent, NavbarComponent, SessionModalComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly router = inject(Router);
  protected readonly loaderService = inject(LoaderService);
  private readonly hiddenNavbarRoutes = ['/login', '/register'];

  readonly showNavbar = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => !this.hiddenNavbarRoutes.includes((event as NavigationEnd).urlAfterRedirects))
    ),
    { initialValue: false }
  );

  // true mientras el router corre los guards de la ruta
  readonly checkingGuards = toSignal(
    this.router.events.pipe(
      filter(event =>
        event instanceof GuardsCheckStart ||
        event instanceof GuardsCheckEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ),
      map(event => event instanceof GuardsCheckStart)
    ),
    { initialValue: false }
  );
}
