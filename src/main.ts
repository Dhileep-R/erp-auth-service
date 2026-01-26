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
      secret: 'ERP_SECRET',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Test123#',
      database: 'erp',
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
  await app.listen(3001);
  console.log('Auth service running on port 3001');
}

bootstrap();
