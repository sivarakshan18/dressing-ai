import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LikesService } from './likes.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';

@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggle(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.likesService.toggle(postId, user.userId);
  }

  @Get('count')
  async getLikeCount(
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return this.likesService.getLikeCount(postId);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async hasUserLiked(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    const liked = await this.likesService.hasUserLiked(postId, user.userId);
    return { liked };
  }
}
