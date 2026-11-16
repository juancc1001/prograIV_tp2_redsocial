import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ReferenceKind, ReferenceResult } from './references.service';

export interface PostAuthor {
  username: string;
  profilePictureUrl?: string;
}

//extiende referenceResult que esta en ReferencesService
export interface PostReference extends ReferenceResult {
  kind: ReferenceKind;
  rating: number;
}

export interface Post {
  id: string;
  author?: PostAuthor;
  title: string;
  createdAt: string;
  description: string;
  imageUrl: string;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  reference?: PostReference;
}

export interface PostComment {
  id: string;
  text: string;
  createdAt: string;
  modificado: boolean;
  author: PostAuthor;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getUserPosts(username: string, offset: number, limit: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts/user/${username}?offset=${offset}&limit=${limit}`);
  }

  // sort con formato "campo:asc|desc" separado por comas
  getPosts(offset: number, limit: number, sort: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts?offset=${offset}&limit=${limit}&sort=${sort}`);
  }

  like(id: string): Observable<{ likesCount: number }> {
    return this.http.post<{ likesCount: number }>(`${this.apiUrl}/posts/${id}/like`, {});
  }

  unlike(id: string): Observable<{ likesCount: number }> {
    return this.http.delete<{ likesCount: number }>(`${this.apiUrl}/posts/${id}/like`);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${id}`);
  }

  getFeed(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/posts/feed`);
  }

  createPost(formData: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/posts`, formData);
  }

  getPost(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }

  // vienen del más nuevo al más viejo
  getComments(postId: string, offset: number, limit: number): Observable<PostComment[]> {
    return this.http.get<PostComment[]>(`${this.apiUrl}/posts/${postId}/comments?offset=${offset}&limit=${limit}`);
  }

  addComment(postId: string, text: string): Observable<PostComment> {
    return this.http.post<PostComment>(`${this.apiUrl}/posts/${postId}/comments`, { text });
  }

  editComment(postId: string, commentId: string, text: string): Observable<PostComment> {
    return this.http.put<PostComment>(`${this.apiUrl}/posts/${postId}/comments/${commentId}`, { text });
  }

  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}/comments/${commentId}`);
  }
}
