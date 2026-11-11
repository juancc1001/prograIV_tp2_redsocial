import { Injectable, PipeTransform } from '@nestjs/common';
import { PaginationDto } from './pagination.dto.js';

export interface Pagination {
  offset: number;
  limit: number;
  sort: Record<string, 1 | -1>;
}

const DEFAULT_LIMIT = 10;
// solo se puede ordenar por estos campos
const SORT_FIELDS = ['createdAt', 'likesCount'];

// convierte los query params de texto a números, con valores por defecto
@Injectable()
export class PaginationPipe implements PipeTransform<PaginationDto, Pagination> {
  transform(query: PaginationDto): Pagination {
    return {
      offset: this.toInt(query.offset, 0, 0),
      limit: this.toInt(query.limit, DEFAULT_LIMIT, 1),
      sort: this.toSort(query.sort),
    };
  }

  // "likesCount:desc,createdAt:desc" -> { likesCount: -1, createdAt: -1 }
  // los campos o direcciones inválidos se ignoran; si no queda nada, por fecha
  private toSort(value: string | undefined): Record<string, 1 | -1> {
    const sort: Record<string, 1 | -1> = {};
    const parts = (value ?? '').split(',');

    for (const part of parts) {
      const [field, direction] = part.split(':');
      if (!SORT_FIELDS.includes(field)) {
        continue;
      }
      if (direction === 'asc') {
        sort[field] = 1;
      } else if (direction === 'desc') {
        sort[field] = -1;
      }
    }

    if (Object.keys(sort).length === 0) {
      return { createdAt: -1 };
    }
    return sort;
  }

  // si no viene, no es un número o es menor al mínimo se usa el valor por defecto
  private toInt(value: string | undefined, defaultValue: number, min: number): number {
    const number = parseInt(value ?? '');
    if (isNaN(number) || number < min) {
      return defaultValue;
    }
    return number;
  }
}
