import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

export interface PaginatedComments {
  data: Comment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async create(
    postId: number,
    authorId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const comment = this.commentRepo.create({
      content: dto.content,
      post_id: postId,
      author_id: authorId,
    });
    return this.commentRepo.save(comment);
  }

  async findByPost(
    postId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedComments> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const [data, total] = await this.commentRepo.findAndCount({
      where: { post_id: postId },
      relations: { author: true },
      select: {
        author: {
          id: true,
          email: true,
        },
      },
      order: { created_at: 'DESC' },
      take,
      skip,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    if (comment.author_id !== userId && userRole !== 'ADMIN') {
      throw new NotFoundException('You do not have permission to delete this comment');
    }
    await this.commentRepo.remove(comment);
  }
}
