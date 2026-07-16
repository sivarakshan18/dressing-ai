import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { QueryPostDto } from './dto/query-post.dto.js';
import { PostStatus } from '../common/enums/post-status.enum.js';
import { UserRole } from '../common/enums/role.enum.js';

export interface PaginatedPosts {
  data: Post[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PostWithStats {
  id: number;
  title: string;
  content: string;
  author_id: number;
  status: PostStatus;
  created_at: Date;
  author: {
    id: number;
    email: string;
  };
  commentCount: number;
  likeCount: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  /**
   * Create a new post with the authenticated user as author.
   */
  async create(authorId: number, dto: CreatePostDto): Promise<Post> {
    const post = this.postRepo.create({
      title: dto.title,
      content: dto.content,
      status: dto.status || PostStatus.DRAFT,
      author_id: authorId,
    });
    return this.postRepo.save(post);
  }

  /**
   * High-performance paginated query with optional filtering by status and author.
   * Uses QueryBuilder for efficient SQL generation with LIMIT/OFFSET.
   */
  async findAll(query: QueryPostDto): Promise<PaginatedPosts> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const skip = (page - 1) * limit;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.author_id',
        'post.status',
        'post.created_at',
        'author.id',
        'author.email',
      ]);

    // Filter by status
    if (query.status) {
      qb.andWhere('post.status = :status', { status: query.status });
    }

    // Filter by author
    if (query.authorId) {
      qb.andWhere('post.author_id = :authorId', { authorId: query.authorId });
    }

    qb.orderBy('post.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetch a single post with comment count and like count in a SINGLE efficient SQL query.
   * Uses LEFT JOIN with COUNT(DISTINCT ...) and GROUP BY for optimal performance.
   */
  async findOneWithStats(id: number): Promise<PostWithStats> {
    const result = await this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoin('post.comments', 'comment')
      .leftJoin('post.likes', 'like')
      .select([
        'post.id AS post_id',
        'post.title AS post_title',
        'post.content AS post_content',
        'post.author_id AS post_author_id',
        'post.status AS post_status',
        'post.created_at AS post_created_at',
        'author.id AS author_id',
        'author.email AS author_email',
        'COUNT(DISTINCT comment.id) AS commentCount',
        'COUNT(DISTINCT like.id) AS likeCount',
      ])
      .where('post.id = :id', { id })
      .groupBy('post.id')
      .addGroupBy('author.id')
      .getRawOne();

    if (!result) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return {
      id: result.post_id,
      title: result.post_title,
      content: result.post_content,
      author_id: result.post_author_id,
      status: result.post_status,
      created_at: result.post_created_at,
      author: {
        id: result.author_id,
        email: result.author_email,
      },
      commentCount: parseInt(result.commentCount, 10),
      likeCount: parseInt(result.likeCount, 10),
    };
  }

  /**
   * Update a post. Only the author or an admin can update.
   */
  async update(
    id: number,
    dto: UpdatePostDto,
    userId: number,
    userRole: string,
  ): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    if (post.author_id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own posts');
    }

    Object.assign(post, dto);
    return this.postRepo.save(post);
  }

  /**
   * Delete a post. Only the original author or an ADMIN can delete.
   * This is the RBAC-enforced deletion logic.
   */
  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    // RBAC: Only the author or an admin can delete
    if (post.author_id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the post author or an admin can delete this post',
      );
    }

    await this.postRepo.remove(post);
  }
}
