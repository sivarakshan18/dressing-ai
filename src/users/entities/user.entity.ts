import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../common/enums/role.enum.js';
import { Post } from '../../posts/entities/post.entity.js';
import { Comment } from '../../comments/entities/comment.entity.js';
import { Like } from '../../likes/entities/like.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255 })
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes!: Like[];
}
