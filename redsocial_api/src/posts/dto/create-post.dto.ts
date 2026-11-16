import { PostType, ReferenceKind } from '../schemas/post.schema.js';

// en multipart los números llegan como texto
export class ReferenceDto {
  kind: ReferenceKind;
  externalId: string;
  title: string;
  year?: number | string;
  imageUrl?: string;
  rating: number | string;
}

export class CreatePostDto {
  type: PostType;
  title?: string;
  description?: string;
  location?: string;
  reference?: ReferenceDto;
}
