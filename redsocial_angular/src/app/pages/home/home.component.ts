import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Post, PostsService } from '../../core/services/posts.service';
import { ErrorService } from '../../core/services/error.service';
import { PostCardComponent } from '../../core/components/post-card/post-card.component';

const PER_PAGE = 10;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, PostCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly postsService = inject(PostsService);
  private readonly errorService = inject(ErrorService);

  posts = signal<Post[]>([]);
  hasMore = signal(false);
  sortByLikes = signal(false);

  constructor() {
    this.loadPosts();
  }

  loadPosts(): void {
    let sort = 'createdAt:desc';
    if (this.sortByLikes()) {
      sort = 'likesCount:desc,createdAt:desc';
    }

    // el offset es la cantidad de posts que ya tenemos cargados
    this.postsService.getPosts(this.posts().length, PER_PAGE, sort).subscribe({
      next: posts => {
        this.posts.set([...this.posts(), ...posts]);
        this.hasMore.set(posts.length === PER_PAGE);
      },
      error: error => this.errorService.show(error),
    });
  }

  // al cambiar el orden se vuelve a cargar desde el principio
  toggleSort(): void {
    this.sortByLikes.set(!this.sortByLikes());
    this.posts.set([]);
    this.loadPosts();
  }

  removePost(id: string): void {
    this.posts.set(this.posts().filter(post => post.id !== id));
  }
}
