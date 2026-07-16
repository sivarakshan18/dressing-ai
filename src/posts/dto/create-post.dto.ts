import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostStatus } from '../../common/enums/post-status.enum.js';

export class CreatePostDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(255, { message: 'Title cannot be longer than 255 characters' })
  title!: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(5, { message: 'Content must be at least 5 characters long' })
  content!: string;

  @IsOptional()
  @IsEnum(PostStatus, { message: 'Status must be DRAFT or PUBLISHED' })
  status?: PostStatus;
}