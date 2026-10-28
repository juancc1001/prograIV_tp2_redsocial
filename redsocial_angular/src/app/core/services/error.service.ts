import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface NestError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly duration = 4000;

  readonly message = signal<string | null>(null);

  show(error: HttpErrorResponse): void {
    this.showText(this.getMessage(error));
  }

  showText(message: string): void {
    this.message.set(message);
    setTimeout(() => this.hide(), this.duration);
  }

  hide(): void {
    this.message.set(null);
  }

  private getMessage(error: HttpErrorResponse): string {
    // status 0 = server unreachable, there is no Nest body
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor';
    }
    const { message } = error.error as NestError;
    return Array.isArray(message) ? message.join(', ') : message;
  }
}
