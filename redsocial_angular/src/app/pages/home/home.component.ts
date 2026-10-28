import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, catchError } from 'rxjs';
import { PostsService } from '../../core/services/posts.service';
import { ErrorService } from '../../core/services/error.service';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly errorService = inject(ErrorService);

  readonly posts = toSignal(
    inject(PostsService).getFeed().pipe(
      catchError(error => {
        this.errorService.show(error);
        return EMPTY;
      })
    ),
    { initialValue: [] }
  );
}
