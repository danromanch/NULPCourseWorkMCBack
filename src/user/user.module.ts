import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from '../entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import envConfig from '../config/env.config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { RefreshStrategy } from './strategy/refresh.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: envConfig().user.jwtSecret,
      signOptions: { expiresIn: envConfig().user.expiresIn },
    }),
  ],
  providers: [UserService, JwtStrategy, RefreshStrategy],
  controllers: [UserController],
})
export class UserModule {}
