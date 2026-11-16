import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthLayoutComponent } from '../../core/components/auth-layout/auth-layout.component';
import { AuthService, LoginData } from '../../core/services/auth.service';
import { ErrorService } from '../../core/services/error.service';
import { LoaderService } from '../../core/services/loader.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule, AuthLayoutComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);

  showPassword = signal(false);

  form = new FormGroup({
    usernameOrEmail: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  onSubmit(): void {
    this.loaderService.show();
    this.authService.login(this.form.value as LoginData).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: error => this.errorService.show(error),
    });
  }
}
