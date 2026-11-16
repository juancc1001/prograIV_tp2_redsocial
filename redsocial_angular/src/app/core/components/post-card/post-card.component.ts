import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Post, PostsService } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { LoaderService } from '../../services/loader.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [DatePipe, MatIconModule, RouterLink],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent implements OnInit, AfterViewInit {
  private readonly postsService = inject(PostsService);
  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);

  @Input({ required: true }) post!: Post;
  @Output() deleted = new EventEmitter<string>();
  @ViewChild('description') description!: ElementRef<HTMLParagraphElement>;
  @ViewChild('photo') photo!: ElementRef<HTMLImageElement>;

  expanded = signal(false);
  isLong = signal(false);
  liked = signal(false);
  likesCount = signal(0);
  isOwner = signal(false);

  ngOnInit(): void {
    this.liked.set(this.post.likes.includes(this.authService.userId()!));
    this.likesCount.set(this.post.likesCount);
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

  openFullscreen(): void {
    this.photo.nativeElement.requestFullscreen();
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
