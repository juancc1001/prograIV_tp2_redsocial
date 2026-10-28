import { Component, inject } from '@angular/core';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-error-snackbar',
  standalone: true,
  templateUrl: './error-snackbar.component.html',
  styleUrl: './error-snackbar.component.scss'
})
export class ErrorSnackbarComponent {
  protected readonly errorService = inject(ErrorService);
}
