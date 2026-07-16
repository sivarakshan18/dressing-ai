import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity.js';

export interface LikeResponse {
  liked: boolean;
  totalLikes: number;
}

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
  ) {}

  async toggle(postId: number, userId: number): Promise<LikeResponse> {
    const existingLike = await this.likeRepo.findOne({
      where: { post_id: postId, user_id: userId },
    });

    if (existingLike) {
      // Unlike: remove the existing like
      await this.likeRepo.remove(existingLike);
      const totalLikes = await this.likeRepo.count({ where: { post_id: postId } });
      return { liked: false, totalLikes };
    }

    // Like: create a new like
    const like = this.likeRepo.create({
      post_id: postId,
      user_id: userId,
    });
    await this.likeRepo.save(like);
    const totalLikes = await this.likeRepo.count({ where: { post_id: postId } });
    return { liked: true, totalLikes };
  }

  async getLikeCount(postId: number): Promise<{ postId: number; totalLikes: number }> {
    const totalLikes = await this.likeRepo.count({ where: { post_id: postId } });
    return { postId, totalLikes };
  }

  async hasUserLiked(postId: number, userId: number): Promise<boolean> {
    const like = await this.likeRepo.findOne({
      where: { post_id: postId, user_id: userId },
    });
    return !!like;
  }
}
