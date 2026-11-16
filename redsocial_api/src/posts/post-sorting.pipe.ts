import { Injectable, PipeTransform } from '@nestjs/common';

// solo se puede ordenar por estos campos
const SORT_FIELDS = ['createdAt', 'likesCount'];

// "likesCount:desc,createdAt:desc" -> { likesCount: -1, createdAt: -1 }
// los campos o direcciones inválidos se ignoran; si no queda nada, por fecha
@Injectable()
export class PostSortingPipe implements PipeTransform<string | undefined, Record<string, 1 | -1>> {
  transform(value: string | undefined): Record<string, 1 | -1> {
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
}
