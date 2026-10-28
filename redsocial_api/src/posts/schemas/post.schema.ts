import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

export enum PostType {
  Photo = 'PHOTO',
  Album = 'ALBUM',
  Video = 'VIDEO',
}

export enum MediaType {
  Image = 'IMAGE',
  Video = 'VIDEO',
}

@Schema({ _id: false })
export class Media {
  @Prop({ required: true, enum: MediaType })
  type: MediaType;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  order: number;

  // solo para videos
  @Prop()
  durationSeconds: number;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  text: string;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true, enum: PostType })
  type: PostType;

  // solo para álbumes
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ type: [MediaSchema], required: true })
  media: Media[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
