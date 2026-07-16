import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('likes')
@Unique('UQ_LIKE_USER_POST', ['post_id', 'user_id'])
export class Like {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  post_id!: number;

  @Column()
  user_id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
