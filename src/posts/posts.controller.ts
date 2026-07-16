import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { QueryPostDto } from './dto/query-post.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { UserRole } from '../common/enums/role.enum.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * GET /posts — Public, paginated with filtering.
   * Query params: page, limit, status, authorId
   */
  @Get()
  async findAll(@Query() query: QueryPostDto) {
    return this.postsService.findAll(query);
  }

  /**
   * GET /posts/:id — Public, returns post with comment count and like count.
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOneWithStats(id);
  }

  /**
   * POST /posts — Protected. Author auto-set from JWT.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.create(user.userId, dto);
  }

  /**
   * PATCH /posts/:id — Protected. Only author or admin can update.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.update(id, dto, user.userId, user.role);
  }

  /**
   * DELETE /posts/:id — Protected with RBAC.
   * Only the original author or an ADMIN can delete a post.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.postsService.remove(id, user.userId, user.role);
  }
}