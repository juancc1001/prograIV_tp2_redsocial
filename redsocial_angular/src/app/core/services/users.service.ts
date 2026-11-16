import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Profile {
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  profilePictureUrl?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface UserListItem {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePictureUrl?: string;
  isActive: boolean;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  password: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  getUsers(offset: number, limit: number): Observable<UserListItem[]> {
    return this.http.get<UserListItem[]>(`${this.apiUrl}?offset=${offset}&limit=${limit}`);
  }

  createUser(data: CreateUserData): Observable<UserListItem> {
    return this.http.post<UserListItem>(this.apiUrl, data);
  }

  disableUser(username: string): Observable<UserListItem> {
    return this.http.delete<UserListItem>(`${this.apiUrl}/${username}`);
  }

  enableUser(username: string): Observable<UserListItem> {
    return this.http.post<UserListItem>(`${this.apiUrl}/${username}/enable`, {});
  }

  getProfile(username: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/${username}`);
  }

  updateProfile(formData: FormData): Observable<Profile> {
    return this.http.patch<Profile>(`${this.apiUrl}/me`, formData);
  }
}
