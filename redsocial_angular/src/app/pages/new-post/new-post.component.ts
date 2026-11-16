import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { PostsService } from '../../core/services/posts.service';
import { ErrorService } from '../../core/services/error.service';
import { LoaderService } from '../../core/services/loader.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-new-post',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './new-post.component.html',
  styleUrl: './new-post.component.scss'
})
export class NewPostComponent {
  private readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);

  files = signal<File[]>([]);
  // urls locales para mostrar los archivos antes de subirlos
  previewUrls = signal<string[]>([]);
  // posición del carrusel
  current = signal(0);

  // el tipo sale de los archivos elegidos: varios = álbum, uno = foto o video
  type = computed(() => {
    const files = this.files();
    if (files.length > 1) {
      return 'ALBUM';
    }
    if (files.length === 1 && this.isVideo(0)) {
      return 'VIDEO';
    }
    return 'PHOTO';
  });

  form = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    location: new FormControl('', { nonNullable: true }),
  });

  onFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.files.set(files);
    this.previewUrls.set(files.map(file => URL.createObjectURL(file)));
    this.current.set(0);
  }

  onAddFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const added = Array.from(input.files ?? []);
    this.files.set([...this.files(), ...added]);
    this.previewUrls.set([...this.previewUrls(), ...added.map(file => URL.createObjectURL(file))]);
  }

  isVideo(index: number): boolean {
    return this.files()[index].type.startsWith('video/');
  }

  onSubmit(): void {
    const { title, description, location } = this.form.getRawValue();
    const type = this.type();

    // los archivos no se pueden mandar como json, por eso se arma un FormData
    const formData = new FormData();
    formData.append('type', type);
    if (type === 'ALBUM') {
      formData.append('title', title);
    }
    formData.append('description', description);
    formData.append('location', location);
    for (const file of this.files()) {
      formData.append('files', file);
    }

    this.loaderService.show();
    this.postsService.createPost(formData).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => this.router.navigate(['/', this.authService.username()]),
      error: error => this.errorService.show(error),
    });
  }
}
