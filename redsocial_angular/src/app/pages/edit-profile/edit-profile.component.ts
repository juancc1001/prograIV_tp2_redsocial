import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { ErrorService } from '../../core/services/error.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly errorService = inject(ErrorService);
  private readonly router = inject(Router);

  picture = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    bio: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    // se cargan los datos actuales para editarlos
    this.usersService.getProfile(this.authService.username()!).subscribe({
      next: profile => {
        this.form.setValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          bio: profile.bio ?? '',
        });
        this.previewUrl.set(profile.profilePictureUrl ?? null);
      },
      error: error => this.errorService.show(error),
    });
  }

  onPictureChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.picture.set(file);
      this.previewUrl.set(URL.createObjectURL(file));
    }
  }

  onSubmit(): void {
    const { firstName, lastName, bio } = this.form.getRawValue();

    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('bio', bio);
    const picture = this.picture();
    if (picture) {
      formData.append('picture', picture);
    }

    this.usersService.updateProfile(formData).subscribe({
      next: () => this.router.navigate(['/', this.authService.username()]),
      error: error => this.errorService.show(error),
    });
  }
}
