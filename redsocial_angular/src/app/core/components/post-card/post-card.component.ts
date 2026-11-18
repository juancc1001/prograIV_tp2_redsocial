import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Post, PostComment, PostsService } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { LoaderService } from '../../services/loader.service';
import { IsMineDirective } from '../../directives/is-mine.directive';
import { HasPhotoDirective } from '../../directives/has-photo.directive';
import { finalize } from 'rxjs';

const COMMENTS_LIMIT = 5;

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [DatePipe, MatIconModule, ReactiveFormsModule, RouterLink, IsMineDirective, HasPhotoDirective],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent implements OnInit, AfterViewInit {
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);

  @Input({ required: true }) post!: Post;
  // versión chica para el perfil: manda la reseña y la foto va en miniatura
  @Input() compact = false;
  @Output() deleted = new EventEmitter<string>();
  @ViewChild('description') description!: ElementRef<HTMLParagraphElement>;

  expanded = signal(false);
  isLong = signal(false);
  liked = signal(false);
  likesCount = signal(0);
  isOwner = signal(false);
  // el admin puede borrar publicaciones ajenas
  isAdmin = this.authService.isAdmin;
  // la card ocupa toda la pantalla con los comentarios al costado
  filled = signal(false);
  comments = signal<PostComment[]>([]);
  hasMore = signal(false);
  commentsCount = signal(0);
  // muestra el campo de comentario en la card chica
  commenting = signal(false);
  private commentsLoaded = false;

  stars = [1, 2, 3, 4, 5];

  // id del comentario que se está editando, null si ninguno
  editingId = signal<string | null>(null);

  commentForm = new FormGroup({
    text: new FormControl('', { nonNullable: true }),
  });

  editForm = new FormGroup({
    text: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    this.liked.set(this.post.likes.includes(this.authService.userId()!));
    this.likesCount.set(this.post.likesCount);
    this.commentsCount.set(this.post.commentsCount);
    this.isOwner.set(this.post.author?.username === this.authService.username());
  }

  ngAfterViewInit(): void {
    // se mide después del render: si el texto no entra en 3 líneas, mostramos "ver más"
    setTimeout(() => {
      const element = this.description.nativeElement;
      this.isLong.set(element.scrollHeight > element.clientHeight);
    });
  }

  toggleLike(): void {
    const request = this.liked() ? this.postsService.unlike(this.post.id) : this.postsService.like(this.post.id);
    this.loaderService.show();
    request.pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: response => {
        this.liked.set(!this.liked());
        this.likesCount.set(response.likesCount);
      },
      error: error => this.errorService.show(error),
    });
  }

  toggleFilled(): void {
    this.filled.set(!this.filled());
    // los comentarios se piden la primera vez que se abre
    if (this.filled() && !this.commentsLoaded) {
      this.loadComments();
    }
  }

  loadComments(): void {
    this.loaderService.show();
    this.postsService.getComments(this.post.id, this.comments().length, COMMENTS_LIMIT).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: comments => {
        this.comments.set([...this.comments(), ...comments]);
        this.hasMore.set(comments.length === COMMENTS_LIMIT);
        this.commentsLoaded = true;
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
    this.postsService.addComment(this.post.id, text).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: comment => {
        // si la lista todavía no se pidió, el comentario llega cuando se cargue
        if (this.commentsLoaded) {
          this.comments.set([comment, ...this.comments()]);
        }
        this.commentsCount.set(this.commentsCount() + 1);
        this.commentForm.reset();
        this.commenting.set(false);
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
    this.postsService.editComment(this.post.id, comment.id, text).pipe(
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
    this.postsService.deleteComment(this.post.id, comment.id).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => {
        this.comments.set(this.comments().filter(item => item.id !== comment.id));
        this.commentsCount.set(this.commentsCount() - 1);
      },
      error: error => this.errorService.show(error),
    });
  }

  deletePost(): void {
    this.loaderService.show();
    this.postsService.deletePost(this.post.id).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: () => this.deleted.emit(this.post.id),
      error: error => this.errorService.show(error),
    });
  }
}
