import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface PostAuthor {
  username: string;
  profilePictureUrl?: string;
}

export interface Post {
  id: string;
  author?: PostAuthor;
  title: string;
  createdAt: string;
  description: string;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUserPosts(username: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts/user/${username}`);
  }

  getFeed(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts/feed`);
  }
}
