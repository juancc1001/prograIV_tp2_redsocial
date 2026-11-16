import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

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

export enum ReferenceKind {
  Movie = 'MOVIE',
  Book = 'BOOK',
  Game = 'GAME',
}

// copia de los datos de la api externa para no consultarla en cada listado
@Schema({ _id: false })
export class Reference {
  @Prop({ required: true, enum: ReferenceKind })
  kind: ReferenceKind;

  @Prop({ required: true })
  externalId: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  year?: number;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;
}

export const ReferenceSchema = SchemaFactory.createForClass(Reference);

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ default: false })
  modificado: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true, enum: PostType })
  type: PostType;

  // solo para álbumes
  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  location: string;

  @Prop({ type: [MediaSchema], required: true })
  media: Media[];

  @Prop({ type: ReferenceSchema })
  reference?: Reference;

  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: [CommentSchema], default: [] })
  comments: Comment[];

  @Prop({ default: false })
  deleted: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
