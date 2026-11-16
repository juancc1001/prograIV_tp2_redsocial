import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { LoaderService } from '../../services/loader.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-session-modal',
  standalone: true,
  templateUrl: './session-modal.component.html',
  styleUrl: './session-modal.component.scss'
})
export class SessionModalComponent {
  protected readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);

  renew(): void {
    this.loaderService.show();
    this.authService.refresh().pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      error: error => this.errorService.show(error),
    });
  }

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
