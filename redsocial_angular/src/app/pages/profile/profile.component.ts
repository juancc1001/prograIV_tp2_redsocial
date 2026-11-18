import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, catchError, switchMap, finalize } from 'rxjs';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { ErrorService } from '../../core/services/error.service';
import { LoaderService } from '../../core/services/loader.service';
import { Post, PostsService } from '../../core/services/posts.service';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';

const LAST_POSTS = 3;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule, PostCardComponent, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  protected readonly authService = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);
  private readonly postsService = inject(PostsService);
  private readonly route = inject(ActivatedRoute);

  readonly profile = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.usersService.getProfile(params.get('username')!).pipe(
        catchError(error => {
          this.errorService.show(error);
          return EMPTY;
        })
      ))
    )
  );

  posts = signal<Post[]>([]);

  constructor() {
    // al cambiar de perfil se vuelven a pedir los posts
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.posts.set([]);
      this.loadPosts(params.get('username')!);
    });
  }

  // solo los últimos posts, sin paginar
  private loadPosts(username: string): void {
    this.loaderService.show();
    this.postsService.getUserPosts(username, 0, LAST_POSTS).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: posts => this.posts.set(posts),
      error: error => this.errorService.show(error),
    });
  }

  // se vuelven a pedir para completar las últimas 3
  removePost(): void {
    this.loadPosts(this.route.snapshot.paramMap.get('username')!);
  }
}
