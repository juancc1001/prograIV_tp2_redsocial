import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface PostsPerUser {
  username: string;
  count: number;
}

export interface CommentsPerDay {
  date: string;
  count: number;
}

export interface CommentsPerPost {
  postId: string;
  label: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getPostsPerUser(from: string, to: string): Observable<PostsPerUser[]> {
    return this.http.get<PostsPerUser[]>(`${this.apiUrl}/posts-per-user?from=${from}&to=${to}`);
  }

  getCommentsPerDay(from: string, to: string): Observable<CommentsPerDay[]> {
    return this.http.get<CommentsPerDay[]>(`${this.apiUrl}/comments-per-day?from=${from}&to=${to}`);
  }

  getCommentsPerPost(from: string, to: string): Observable<CommentsPerPost[]> {
    return this.http.get<CommentsPerPost[]>(`${this.apiUrl}/comments-per-post?from=${from}&to=${to}`);
  }
}
