import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'Comment content must be a string' })
  @IsNotEmpty({ message: 'Comment content is required' })
  @MinLength(1, { message: 'Comment must be at least 1 character long' })
  @MaxLength(2000, { message: 'Comment cannot be longer than 2000 characters' })
  content!: string;
}
