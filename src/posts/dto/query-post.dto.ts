import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../../common/enums/post-status.enum.js';

export class QueryPostDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(PostStatus, { message: 'Status must be DRAFT or PUBLISHED' })
  status?: PostStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Author ID must be an integer' })
  authorId?: number;
}
