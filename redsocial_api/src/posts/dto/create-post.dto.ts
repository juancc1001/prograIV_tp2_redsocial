import { MediaType, PostType } from '../schemas/post.schema.js';

export class CreateMediaDto {
  type: MediaType;
  url: string;
  order: number;
  durationSeconds?: number;
}

export class CreatePostDto {
  type: PostType;
  title?: string;
  description?: string;
  media: CreateMediaDto[];
}
