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

const PER_PAGE = 3;

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

  readonly activeTab = signal<'rollo' | 'muro'>('rollo');

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
  hasMore = signal(false);
  private username = '';

  constructor() {
    // al cambiar de perfil se arranca de nuevo desde el principio
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.username = params.get('username')!;
      this.posts.set([]);
      this.loadPosts();
    });
  }

  loadPosts(): void {
    // el offset es la cantidad de posts que ya tenemos cargados
    this.loaderService.show();
    this.postsService.getUserPosts(this.username, this.posts().length, PER_PAGE).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: posts => {
        this.posts.set([...this.posts(), ...posts]);
        this.hasMore.set(posts.length === PER_PAGE);
      },
      error: error => this.errorService.show(error),
    });
  }

  removePost(id: string): void {
    this.posts.set(this.posts().filter(post => post.id !== id));
  }
}
