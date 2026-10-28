import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, catchError, switchMap } from 'rxjs';
import { UsersService } from '../../core/services/users.service';
import { ErrorService } from '../../core/services/error.service';
import { PostsService } from '../../core/services/posts.service';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatIconModule, PostCardComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private readonly usersService = inject(UsersService);
  private readonly errorService = inject(ErrorService);
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

  readonly posts = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.postsService.getUserPosts(params.get('username')!).pipe(
        catchError(error => {
          this.errorService.show(error);
          return EMPTY;
        })
      ))
    ),
    { initialValue: [] }
  );
}
