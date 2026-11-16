import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ReferenceKind } from '../posts/schemas/post.schema.js';

export interface ReferenceResult {
  externalId: string;
  title: string;
  year?: number;
  imageUrl?: string;
}

//section 
//respuestas de cada servidor
interface TmdbResponse {
  results: { id: number; title: string; release_date?: string; poster_path?: string | null }[];
}

interface OpenLibraryResponse {
  docs: { key: string; title: string; first_publish_year?: number; cover_i?: number }[];
}

interface RawgResponse {
  results: { id: number; name: string; released?: string | null; background_image?: string | null }[];
}

const RESULTS_LIMIT = 10;

@Injectable()
export class ReferencesService {
  constructor(private readonly config: ConfigService) {}

  async search(type: string, query: string): Promise<ReferenceResult[]> {
    if (!query) {
      return [];
    }
    switch (type) {
      case ReferenceKind.Movie:
        return this.searchMovies(query);
      case ReferenceKind.Book:
        return this.searchBooks(query);
      case ReferenceKind.Game:
        return this.searchGames(query);
      default:
        throw new BadRequestException('Tipo de referencia inválido');
    }
  }

  // TMDB
  private async searchMovies(query: string): Promise<ReferenceResult[]> {
    const params = new URLSearchParams({
      api_key: this.config.getOrThrow<string>('TMDB_API_KEY'),
      query: query,
      language: 'es-AR',
    });
    const data = await this.getJson<TmdbResponse>(`https://api.themoviedb.org/3/search/movie?${params}`);

    return data.results.slice(0, RESULTS_LIMIT).map(movie => {
      let imageUrl: string | undefined;
      if (movie.poster_path) {
        imageUrl = `https://image.tmdb.org/t/p/w185${movie.poster_path}`;
      }
      return {
        externalId: String(movie.id),
        title: movie.title,
        year: this.toYear(movie.release_date),
        imageUrl: imageUrl,
      };
    });
  }

  // Open Library, no necesita clave
  private async searchBooks(query: string): Promise<ReferenceResult[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(RESULTS_LIMIT),
      fields: 'key,title,first_publish_year,cover_i',
    });
    const data = await this.getJson<OpenLibraryResponse>(`https://openlibrary.org/search.json?${params}`);

    return data.docs.map(book => {
      let imageUrl: string | undefined;
      if (book.cover_i) {
        imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
      }
      return {
        // la key viene como "/works/OL45804W"
        externalId: book.key.replace('/works/', ''),
        title: book.title,
        year: book.first_publish_year,
        imageUrl: imageUrl,
      };
    });
  }

  // RAWG
  private async searchGames(query: string): Promise<ReferenceResult[]> {
    const params = new URLSearchParams({
      key: this.config.getOrThrow<string>('RAWG_API_KEY'),
      search: query,
      page_size: String(RESULTS_LIMIT),
    });
    const data = await this.getJson<RawgResponse>(`https://api.rawg.io/api/games?${params}`);

    return data.results.map(game => ({
      externalId: String(game.id),
      title: game.name,
      year: this.toYear(game.released),
      imageUrl: game.background_image ?? undefined,
    }));
  }

  private async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new BadGatewayException('No se pudo hacer la búsqueda');
    }
    return (await response.json()) as T;
  }

  // las fechas vienen como "1999-03-30"
  private toYear(date?: string | null): number | undefined {
    if (!date) {
      return undefined;
    }
    return Number(date.slice(0, 4));
  }
}
