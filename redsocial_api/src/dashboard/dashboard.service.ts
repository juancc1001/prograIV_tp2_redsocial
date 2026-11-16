import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from '../posts/schemas/post.schema.js';
import type { DateRange } from '../common/date-range.pipe.js';

const TIMEZONE = 'America/Argentina/Buenos_Aires';
const TOP_POSTS = 10;
const LABEL_LENGTH = 20;

interface PostComments {
  _id: Types.ObjectId;
  username: string;
  title?: string;
  description?: string;
  count: number;
}

@Injectable()
export class DashboardService {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<Post>) {}

  postsPerUser({ from, to }: DateRange) {
    return this.postModel.aggregate<{ username: string; count: number }>([
      { $match: { deleted: { $ne: true }, createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$author', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'author' } },
      { $unwind: '$author' },
      { $sort: { count: -1, 'author.username': 1 } },
      { $project: { _id: 0, username: '$author.username', count: 1 } },
    ]);
  }

  async commentsPerDay({ from, to }: DateRange) {
    const days = await this.postModel.aggregate<{ _id: string; count: number }>([
      { $match: { deleted: { $ne: true }, 'comments.createdAt': { $gte: from, $lte: to } } },
      { $unwind: '$comments' },
      { $match: { 'comments.createdAt': { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$comments.createdAt', timezone: TIMEZONE } },
          count: { $sum: 1 },
        },
      },
    ]);

    // días sin comentarios se completancon 0 para que la línea de tiempo no los saltee
    const counts = new Map(days.map(day => [day._id, day.count]));
    const result: { date: string; count: number }[] = [];
    const day = new Date(from);
    //agrega items al resultado hasta llegar a la fecha to
    while (day <= to) {
      // formatea la fecha
      const date = day.toISOString().slice(0, 10);
      result.push({ date, count: counts.get(date) ?? 0 });
      day.setUTCDate(day.getUTCDate() + 1);
    }
    return result;
  }

  async commentsPerPost({ from, to }: DateRange) {
    const posts = await this.postModel.aggregate<PostComments>([
      { $match: { deleted: { $ne: true }, 'comments.createdAt': { $gte: from, $lte: to } } },
      { $unwind: '$comments' },
      { $match: { 'comments.createdAt': { $gte: from, $lte: to } } },
      {
        $group: {
          _id: '$_id',
          author: { $first: '$author' },
          title: { $first: '$title' },
          description: { $first: '$description' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $limit: TOP_POSTS },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
      { $unwind: '$author' },
      { $project: { username: '$author.username', title: 1, description: 1, count: 1 } },
    ]);

    return posts.map(post => ({
      postId: post._id,
      label: this.postLabel(post),
      count: post.count,
    }));
  }

  // @autor · título del álbum o descripción, recortado para que entre en la leyenda
  private postLabel(post: PostComments): string {
    const text = post.title || post.description;
    if (!text) {
      return `@${post.username}`;
    }
    if (text.length > LABEL_LENGTH) {
      return `@${post.username} · ${text.slice(0, LABEL_LENGTH)}…`;
    }
    return `@${post.username} · ${text}`;
  }
}
