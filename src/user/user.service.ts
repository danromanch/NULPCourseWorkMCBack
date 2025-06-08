import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../common/objects/JwtPayload';
import envConfig from '../config/env.config';
import { MicrocontrollerEntity } from '../entities/microcontroller.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(MicrocontrollerEntity)
    private microControllerRepository: Repository<MicrocontrollerEntity>,
    private jwtService: JwtService,
  ) {}

  async findOne(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async register(name: string, email: string, password?: string) {
    if (
      (await this.userRepository.findOne({ where: { email } }).then()) !== null
    ) {
      throw new HttpException('User already exists', 400);
    }
    let passwordHash: string | null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    } else {
      passwordHash = null;
    }
    const user = this.userRepository.create({
      name,
      email,
      verified: false,
    });
    if (passwordHash) {
      user.passwordHash = passwordHash;
    }
    return await this.userRepository.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user === null) {
      throw new HttpException('User not found', 404);
    }
    if (!(await bcrypt.compare(password, <string>user.passwordHash))) {
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
      relations: ['microcontrollers'],
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

  async changePassword(token: string, newPassword: string) {
    const payload: JwtPayload = this.jwtService.decode(token);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (user === null) {
      throw new HttpException('User not found', 404);
    }
    if (await bcrypt.compare(newPassword, <string>user?.passwordHash)) {
      throw new HttpException('Password already set', 400);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { passwordHash });
  }

  async loginGoogle(email: string) {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new HttpException('User not found', 404);
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

  async checkToken(token: string): Promise<boolean> {
    const payload: JwtPayload = this.jwtService.decode(token);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    return !!user;
  }

  async getFriendlyDevices(token: string) {
    const payload: JwtPayload = this.jwtService.decode(token);
    const friendlyDevices = await this.microControllerRepository.find({
      where: { friends: { id: payload.sub } },
      relations: ['friends', 'owner'],
    });

    if (!friendlyDevices) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Return the list of connected devices or empty array if none
    return {
      devices: friendlyDevices.map((device) => ({
        id: device.id,
        owner: device.owner ? device.owner.name : 'Unknown',
      })),
    };
  }

  //
  // async addMc(token: string, mcId: number) {
  //   const payload: JwtPayload = this.jwtService.decode(token);
  //   const user = await this.userRepository.findOneOrFail({
  //     where: { id: payload.sub },
  //   });
  //   const microController = await this.microControllerRepository.findOneOrFail({
  //     where: { id: mcId },
  //   });
  //   user.microcontrollers = user.microcontrollers || [];
  //   user.microcontrollers.push(microController);
  //   return await this.userRepository.save(user);
  // }
}
