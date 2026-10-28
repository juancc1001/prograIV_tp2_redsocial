import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthLayoutComponent } from '../../core/components/auth-layout/auth-layout.component';
import { AuthService, RegisterData } from '../../core/services/auth.service';
import { ErrorService } from '../../core/services/error.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule, AuthLayoutComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  showPassword = signal(false);
  showRepeatPassword = signal(false);

  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', Validators.required),
    birthDate: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    repeatPassword: new FormControl('', Validators.required),
  });

  onSubmit(): void {
    const { repeatPassword, ...data } = this.form.value;
    if (data.password !== repeatPassword) {
      this.errorService.showText('Las contraseñas no coinciden');
      return;
    }

    this.authService.register(data as RegisterData).subscribe({
      next: () => this.router.navigate(['/']),
      error: error => this.errorService.show(error),
    });
  }
}
