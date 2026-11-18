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

// cuánto antes del vencimiento se avisa
const WARNING_TIME = 5000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private warningTimer?: ReturnType<typeof setTimeout>;

  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly sessionExpiring = signal(false);

  readonly username = computed(() => {
    const token = this.token();
    if (!token) {
      return null;
    }
    return this.readPayload(token).username as string;
  });

  readonly userId = computed(() => {
    const token = this.token();
    if (!token) {
      return null;
    }
    return this.readPayload(token).sub as string;
  });

  readonly isAdmin = computed(() => {
    const token = this.token();
    if (!token) {
      return false;
    }
    return this.readPayload(token).role === 'ADMIN';
  });

  constructor() {
    const token = this.token();
    if (token) {
      this.scheduleExpiration(token);
    }
  }

  refresh(): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, {}).pipe(
      tap(response => this.saveToken(response.accessToken))
    );
  }

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
      finalize(() => this.clearSession())
    );
  }

  private saveToken(token: string): void {
    localStorage.setItem('token', token);
    this.token.set(token);
    this.sessionExpiring.set(false);
    this.scheduleExpiration(token);
  }

  clearSession(): void {
    clearTimeout(this.warningTimer);
    localStorage.removeItem('token');
    this.token.set(null);
    this.sessionExpiring.set(false);
  }

  // abre el aviso antes de que venza el token; el 401 lo maneja el interceptor
  private scheduleExpiration(token: string): void {
    clearTimeout(this.warningTimer);

    // exp viene en segundos
    const expiresAt = this.readPayload(token).exp * 1000;
    const timeLeft = expiresAt - Date.now();

    this.warningTimer = setTimeout(() => this.sessionExpiring.set(true), timeLeft - WARNING_TIME);
  }

  private readPayload(token: string) {
    // el payload del JWT viene en base64url
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  }
}
