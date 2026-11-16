import { Injectable, PipeTransform } from '@nestjs/common';
import { PaginationDto } from './pagination.dto.js';

export interface Pagination {
  offset: number;
  limit: number;
}

const DEFAULT_LIMIT = 10;

// convierte los query params de texto a números, con valores por defecto
@Injectable()
export class PaginationPipe implements PipeTransform<PaginationDto, Pagination> {
  transform(query: PaginationDto): Pagination {
    return {
      offset: this.toInt(query.offset, 0, 0),
      limit: this.toInt(query.limit, DEFAULT_LIMIT, 1),
    };
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
