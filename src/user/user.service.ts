import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../common/objects/JwtPayload';
import envConfig from '../config/env.config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async findOne(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async register(name: string, password: string, email: string) {
    if (
      (await this.userRepository.findOne({ where: { email } }).then()) !== null
    ) {
      throw new HttpException('User already exists', 400);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name,
      passwordHash,
      email,
      verified: false,
    });
    return await this.userRepository.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user === null) {
      throw new HttpException('User not found', 404);
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpException('Password incorrect', 400);
    }
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: envConfig().user.refreshSecret,
      expiresIn: envConfig().user.refreshExpiresIn,
    });
    return {
      access_token: access_token,
      refresh_token: refresh_token,
    };
  }

  async profile(token: string) {
    const payload: JwtPayload = this.jwtService.decode(token);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    const { passwordHash, id, verified, ...userDto } = user as UserEntity;
    return userDto;
  }

  refresh(token: string) {
    const payload: JwtPayload = this.jwtService.decode(token);
    const access_token = this.jwtService.sign({
      email: payload.email,
      sub: payload.sub,
    });
    const refresh_token = this.jwtService.sign(
      { email: payload.email, sub: payload.sub },
      {
        secret: envConfig().user.refreshSecret,
        expiresIn: envConfig().user.refreshExpiresIn,
      },
    );
    return {
      access_token: access_token,
      refresh_token: refresh_token,
    };
  }

  async confirm(token: string) {
    const payload: JwtPayload = this.jwtService.decode(token);
    await this.userRepository.update(payload.sub, { verified: true });
  }
}
