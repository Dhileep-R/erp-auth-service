import { NestFactory } from '@nestjs/core';
import {
  Module,
  Controller,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entity, PrimaryGeneratedColumn, Column, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

/* ================== ENTITY ================== */

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;
}

/* ================== CONTROLLER ================== */

@Controller('auth')
class AuthController {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Post('login')
  async login(@Body() body: { username: string }) {
    const user = await this.userRepo.findOne({
      where: { username: body.username },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized user');
    }

    const token = this.jwt.sign(
      { userId: user.id, username: user.username },
      { expiresIn: '1h' },
    );

    return { access_token: token };
  }
}

/* ================== MODULE ================== */

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User],
      synchronize: true, // auto-create users table
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
})
class AppModule {}

/* ================== BOOTSTRAP ================== */

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT);
  console.log(`Auth service running on port ${process.env.PORT}`);
}

bootstrap();
