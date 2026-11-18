import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PostsService } from '../../core/services/posts.service';
import { ErrorService } from '../../core/services/error.service';
import { LoaderService } from '../../core/services/loader.service';
import { ReferenceKind, ReferenceResult, ReferencesService } from '../../core/services/references.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, finalize, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-new-post',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './new-post.component.html',
  styleUrl: './new-post.component.scss'
})
export class NewPostComponent {
  private readonly postsService = inject(PostsService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);
  private readonly referencesService = inject(ReferencesService);

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

  kinds: { value: ReferenceKind; label: string }[] = [
    { value: 'MOVIE', label: 'Película' },
    { value: 'BOOK', label: 'Libro' },
    { value: 'GAME', label: 'Juego' },
  ];
  stars = [1, 2, 3, 4, 5];

  // null si el post no lleva referencia
  referenceKind = signal<ReferenceKind | null>(null);
  results = signal<ReferenceResult[]>([]);
  reference = signal<ReferenceResult | null>(null);
  rating = signal(0);
  search = new FormControl('', { nonNullable: true });

  // si se eligió un tipo, hacen falta la referencia y el puntaje
  referenceIncomplete = computed(() => {
    if (this.referenceKind() === null) {
      return false;
    }
    return this.reference() === null || this.rating() === 0;
  });

  constructor() {
    // busca cuando el usuario deja de escribir; switchMap descarta la búsqueda anterior
    this.search.valueChanges.pipe(
      debounceTime(300),
      switchMap(query => {
        const kind = this.referenceKind();
        if (!kind || !query.trim()) {
          return of([]);
        }
        //aca esta el search!
        return this.referencesService.search(kind, query).pipe(
          catchError(error => {
            this.errorService.show(error);
            return of([]);
          })
        );
      }),
      takeUntilDestroyed()
    ).subscribe(results => this.results.set(results));
  }

  // tocar el tipo elegido lo deselecciona
  toggleKind(kind: ReferenceKind): void {
    if (this.referenceKind() === kind) {
      this.referenceKind.set(null);
    } else {
      this.referenceKind.set(kind);
    }
    this.clearReference();
  }

  selectReference(result: ReferenceResult): void {
    this.reference.set(result);
    this.results.set([]);
  }

  clearReference(): void {
    this.reference.set(null);
    this.rating.set(0);
    this.results.set([]);
    this.search.setValue('');
  }

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

    // con los corchetes el backend recibe reference como un objeto
    const kind = this.referenceKind();
    const reference = this.reference();
    if (kind && reference) {
      formData.append('reference[kind]', kind);
      formData.append('reference[externalId]', reference.externalId);
      formData.append('reference[title]', reference.title);
      formData.append('reference[rating]', String(this.rating()));
      if (reference.year) {
        formData.append('reference[year]', String(reference.year));
      }
      if (reference.imageUrl) {
        formData.append('reference[imageUrl]', reference.imageUrl);
      }
    }

    this.loaderService.show();
    this.postsService.createPost(formData).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: error => this.errorService.show(error),
    });
  }
}
