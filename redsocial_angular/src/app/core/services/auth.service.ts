import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, finalize, tap } from 'rxjs';

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  password: string;
}

interface TokenResponse {
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  readonly token = signal<string | null>(localStorage.getItem('token'));

  readonly username = computed(() => {
    const token = this.token();
    if (!token) {
      return null;
    }
    // el payload del JWT viene en base64url
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).username as string;
  });

  login(data: LoginData): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => this.saveToken(response.accessToken))
    );
  }

  register(data: RegisterData): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.saveToken(response.accessToken))
    );
  }

  logout(): Observable<void> {
    // se borra el token local aunque el request falle
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      finalize(() => {
        localStorage.removeItem('token');
        this.token.set(null);
      })
    );
  }

  private saveToken(token: string): void {
    localStorage.setItem('token', token);
    this.token.set(token);
  }
}
