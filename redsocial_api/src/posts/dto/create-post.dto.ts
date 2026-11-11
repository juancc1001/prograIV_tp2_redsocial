import { PostType } from '../schemas/post.schema.js';

export class CreatePostDto {
  type: PostType;
  title?: string;
  description?: string;
  location?: string;
}
