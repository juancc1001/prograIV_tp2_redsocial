import { ReferenceDto } from './create-post.dto.js';

export class UpdatePostDto {
  title?: string;
  description?: string;
  // null quita la referencia
  reference?: ReferenceDto | null;
}
