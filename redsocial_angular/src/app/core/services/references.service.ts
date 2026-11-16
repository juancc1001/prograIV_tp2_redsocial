import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export type ReferenceKind = 'MOVIE' | 'BOOK' | 'GAME';

export interface ReferenceResult {
  externalId: string;
  title: string;
  year?: number;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ReferencesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  search(kind: ReferenceKind, query: string): Observable<ReferenceResult[]> {
    return this.http.get<ReferenceResult[]>(`${this.apiUrl}/references/search`, { params: { type: kind, q: query } });
  }
}
