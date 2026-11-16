import { Component, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CreateUserData, UsersService } from '../../../core/services/users.service';
import { ErrorService } from '../../../core/services/error.service';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './create-user-modal.component.html',
  styleUrl: './create-user-modal.component.scss'
})
export class CreateUserModalComponent {
  private readonly usersService = inject(UsersService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);

  closed = output();
  created = output();

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
    role: new FormControl('USER', Validators.required),
  });

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field)!;
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
    this.usersService.createUser(data as CreateUserData).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => this.created.emit(),
      error: error => this.errorService.show(error),
    });
  }
}
