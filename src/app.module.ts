import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModule } from './posts/posts.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { LikesModule } from './likes/likes.module.js';


@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        type: 'mysql',

        host: config.get('DB_HOST'),

        port: Number(config.get('DB_PORT')),

        username: config.get('DB_USERNAME'),

        password: config.get('DB_PASSWORD'),

        database: config.get('DB_NAME'),

        autoLoadEntities: true,

        synchronize: true,
      }),
    }),

    PostsModule,
    UsersModule,
    AuthModule,
    CommentsModule,
    LikesModule,
  ],
})
export class AppModule {}