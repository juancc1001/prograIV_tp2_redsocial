import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthLayoutComponent } from '../../core/components/auth-layout/auth-layout.component';
import { AuthService, RegisterData } from '../../core/services/auth.service';
import { ErrorService } from '../../core/services/error.service';
import { LoaderService } from '../../core/services/loader.service';
import { finalize } from 'rxjs';

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
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);

  showPassword = signal(false);
  showRepeatPassword = signal(false);

  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', Validators.required),
    birthDate: new FormControl('', Validators.required),
    password: new FormControl('', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)]),
    repeatPassword: new FormControl('', Validators.required),
  });

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field)!;
    //dirty es true cuando el usuario interactua con el form control
    //touched es true cuando el usuario toca y sale del form control
    return (control.dirty || control.touched) && control.hasError(error);
  }

  passwordsDontMatch(): boolean {
    const repeatPassword = this.form.controls.repeatPassword;
    return repeatPassword.dirty && this.form.value.password !== repeatPassword.value;
  }

  onSubmit(): void {
    const { repeatPassword, ...data } = this.form.value;
    if (data.password !== repeatPassword) {
      this.errorService.showText('Las contraseñas no coinciden');
      return;
    }

    this.loaderService.show();
    this.authService.register(data as RegisterData).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: error => this.errorService.show(error),
    });
  }
}
