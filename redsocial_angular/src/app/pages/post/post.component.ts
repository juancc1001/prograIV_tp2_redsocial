import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Post, PostComment, PostsService } from '../../core/services/posts.service';
import { AuthService } from '../../core/services/auth.service';
import { ErrorService } from '../../core/services/error.service';
import { LoaderService } from '../../core/services/loader.service';
import { IsMineDirective } from '../../core/directives/is-mine.directive';
import { HasPhotoDirective } from '../../core/directives/has-photo.directive';
import { finalize } from 'rxjs';

const COMMENTS_LIMIT = 5;

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, MatIconModule, IsMineDirective, HasPhotoDirective],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss'
})
export class PostComponent {
  protected readonly authService = inject(AuthService);
  private readonly postsService = inject(PostsService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);
  private readonly route = inject(ActivatedRoute);

  private readonly postId = this.route.snapshot.paramMap.get('id')!;

  post = signal<Post | null>(null);
  comments = signal<PostComment[]>([]);
  hasMore = signal(false);
  // id del comentario que se está editando, null si ninguno
  editingId = signal<string | null>(null);

  commentForm = new FormGroup({
    text: new FormControl('', { nonNullable: true }),
  });

  editForm = new FormGroup({
    text: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.postsService.getPost(this.postId).subscribe({
      next: post => this.post.set(post),
      error: error => this.errorService.show(error),
    });
    this.loadComments();
  }

  loadComments(): void {
    // el offset es la cantidad de comentarios que ya tenemos cargados
    this.loaderService.show();
    this.postsService.getComments(this.postId, this.comments().length, COMMENTS_LIMIT).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: comments => {
        this.comments.set([...this.comments(), ...comments]);
        this.hasMore.set(comments.length === COMMENTS_LIMIT);
      },
      error: error => this.errorService.show(error),
    });
  }

  addComment(): void {
    const text = this.commentForm.getRawValue().text.trim();
    if (!text) {
      return;
    }

    this.loaderService.show();
    this.postsService.addComment(this.postId, text).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: comment => {
        // el más nuevo va primero
        this.comments.set([comment, ...this.comments()]);
        this.commentForm.reset();
      },
      error: error => this.errorService.show(error),
    });
  }

  isMine(comment: PostComment): boolean {
    return comment.author.username === this.authService.username();
  }

  // editar solo el autor, borrar el autor o un admin
  canDelete(comment: PostComment): boolean {
    return this.isMine(comment) || this.authService.isAdmin();
  }

  startEdit(comment: PostComment): void {
    this.editingId.set(comment.id);
    this.editForm.setValue({ text: comment.text });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(comment: PostComment): void {
    const text = this.editForm.getRawValue().text.trim();
    if (!text) {
      return;
    }

    this.loaderService.show();
    this.postsService.editComment(this.postId, comment.id, text).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: updated => {
        // se reemplaza el comentario editado y el resto queda igual
        const comments = this.comments().map(item => {
          if (item.id === updated.id) {
            return updated;
          }
          return item;
        });
        this.comments.set(comments);
        this.editingId.set(null);
      },
      error: error => this.errorService.show(error),
    });
  }

  deleteComment(comment: PostComment): void {
    this.loaderService.show();
    this.postsService.deleteComment(this.postId, comment.id).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => this.comments.set(this.comments().filter(item => item.id !== comment.id)),
      error: error => this.errorService.show(error),
    });
  }
}
