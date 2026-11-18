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

interface TokenPayload {
  sub: string;
  username: string;
  role: string;
  // expiración en segundos
  exp: number;
}

// cuánto antes del vencimiento se avisa
const WARNING_TIME = 10000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private warningTimer?: number;

  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly sessionExpiring = signal(false);

  // se decodifica una sola vez cada vez que cambia el token
  private readonly payload = computed(() => {
    const token = this.token();
    if (!token) {
      return null;
    }
    return this.readPayload(token);
  });

  readonly username = computed(() => this.payload()?.username ?? null);
  readonly userId = computed(() => this.payload()?.sub ?? null);
  readonly isAdmin = computed(() => this.payload()?.role === 'ADMIN');

  constructor() {
    const token = this.token();
    if (token) {
      this.scheduleWarning(token);
    }
  }

  // la API valida que el token no esté vencido ni revocado y que el usuario siga activo
  authorize(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/authorize`, {});
  }

  login(data: LoginData): Observable<TokenResponse> {
    return this.requestToken('login', data);
  }

  register(data: RegisterData): Observable<TokenResponse> {
    return this.requestToken('register', data);
  }

  refresh(): Observable<TokenResponse> {
    return this.requestToken('refresh', {});
  }

  logout(): Observable<void> {
    // se borra el token local aunque el request falle
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      finalize(() => this.clearSession())
    );
  }

  clearSession(): void {
    clearTimeout(this.warningTimer);
    localStorage.removeItem('token');
    this.token.set(null);
    this.sessionExpiring.set(false);
  }

  // login, register y refresh devuelven un token nuevo que se guarda igual
  private requestToken(path: string, body: object): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/${path}`, body).pipe(
      tap(response => this.saveToken(response.accessToken))
    );
  }

  private saveToken(token: string): void {
    localStorage.setItem('token', token);
    this.token.set(token);
    this.sessionExpiring.set(false);
    this.scheduleWarning(token);
  }

  // abre el aviso antes de que venza el token; el 401 lo maneja el interceptor
  private scheduleWarning(token: string): void {
    clearTimeout(this.warningTimer);
    const expiresAt = this.readPayload(token).exp * 1000;
    const timeLeft = expiresAt - Date.now();
    this.warningTimer = window.setTimeout(() => this.sessionExpiring.set(true), timeLeft - WARNING_TIME);
  }

  private readPayload(token: string): TokenPayload {
    // el JWT es header.payload.firma y el payload viene en base64url
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }
}
