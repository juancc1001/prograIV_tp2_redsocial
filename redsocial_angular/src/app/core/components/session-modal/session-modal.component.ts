import { Component, inject } from '@angular/core';
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

  renew(): void {
    this.loaderService.show();
    this.authService.refresh().pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      error: error => this.errorService.show(error),
    });
  }

  cancel(): void {
    this.authService.sessionExpiring.set(false);
  }
}
