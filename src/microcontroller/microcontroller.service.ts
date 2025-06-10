import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicrocontrollerEntity } from '../entities/microcontroller.entity';
import envConfig from '../config/env.config';
import { MailService } from '../mail/mail.service';
import { UserEntity } from '../entities/user.entity';
import { MicrocontrollerLogEntity } from '../entities/microcontroller.log.entity';
import { ActionEnum } from '../common/enums/action.enum';

@Injectable()
export class MicrocontrollerService {
  constructor(
    @InjectRepository(MicrocontrollerEntity)
    private microControllerRepository: Repository<MicrocontrollerEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private mailService: MailService,
    @InjectRepository(MicrocontrollerLogEntity)
    private microcontrollerLogRepository: Repository<MicrocontrollerLogEntity>,
  ) {}

  private async logAction(microcontrollerId: number, action: ActionEnum) {
    const microcontroller = await this.microControllerRepository.findOne({
      where: { id: microcontrollerId },
    });
    if (!microcontroller) return;
    const log = this.microcontrollerLogRepository.create({
      action,
      date: new Date(),
      microcontroller,
    });
    await this.microcontrollerLogRepository.save(log);
  }

  public async register(secretWord: string) {
    if (secretWord !== envConfig().microcontroller.secretWord) {
      throw new HttpException('Not a microcontroller', 418);
    }
    const microcontroller = this.microControllerRepository.create();
    const microcontrollerEntity =
      await this.microControllerRepository.save(microcontroller);
    return microcontrollerEntity.id;
  }

  public async registerWithOwner(ownerId: number) {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner) throw new HttpException('Owner not found', 404);
    const microcontroller = this.microControllerRepository.create({
      owner,
      friends: [],
    });
    const microcontrollerEntity =
      await this.microControllerRepository.save(microcontroller);
    return microcontrollerEntity.id;
  }

  public async handleMail(id: string) {
    const mc = await this.microControllerRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['owner'],
    });
    if (mc === null) {
      console.log('dasdas');
      return 'Microcontroller not found';
    }
    if (!mc.owner) {
      return 'Microcontroller is not connected to user';
    }
    const trueUser = await this.userRepository.findOne({
      where: { id: mc.owner.id },
    });
    if (trueUser === null) {
      return 'Microcontroller is not connected to user';
    }
    if (!trueUser.email) {
      return 'User has no email';
    }
    await this.logAction(mc.id, ActionEnum.getMail);
    await this.mailService.sendUserGetMail(trueUser.email);
  }

  async userOwnsMicrocontroller(
    userId: number,
    mcId: number,
  ): Promise<boolean> {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['owner', 'friends'],
    });
    if (!mc) return false;
    if (mc.owner && mc.owner.id === userId) return true;
    if (mc.friends && mc.friends.some((f) => f.id === userId)) return true;
    return false;
  }

  async getLogsForUser(userId: number) {
    // Find all microcontrollers owned by the user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['microcontrollers', 'microcontrollers.logs'],
    });
    if (!user) return [];
    // Collect all logs from all user's microcontrollers
    return user.microcontrollers.flatMap((mc) => mc.logs);
  }

  async getLogsForMicrocontroller(mcId: number) {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['logs'],
    });
    if (!mc) return [];
    return mc.logs;
  }

  async addFriendToMicrocontroller(
    ownerId: number,
    mcId: number,
    friendEmail: string,
  ): Promise<string> {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['owner', 'friends'],
    });
    if (!mc) throw new HttpException('Microcontroller not found', 404);
    if (mc.owner.id !== ownerId)
      throw new HttpException('Only owner can add friends', 403);
    const friend = await this.userRepository.findOne({
      where: { email: friendEmail },
    });
    if (!friend) throw new HttpException('User with this email not found', 404);
    if (mc.friends.some((f) => f.id === friend.id))
      return 'User already a friend';
    mc.friends.push(friend);
    await this.microControllerRepository.save(mc);
    return 'Friend added';
  }

  async userCanOpenOrClose(userId: number, mcId: number): Promise<boolean> {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['owner', 'friends'],
    });
    if (!mc) return false;
    if (mc.owner && mc.owner.id === userId) return true;
    return (
      mc.friends &&
      Array.isArray(mc.friends) &&
      mc.friends.some((f) => f && f.id === userId)
    );
  }

  async userIsOwner(userId: number, mcId: number): Promise<boolean> {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['owner'],
    });
    return !!mc && mc.owner.id === userId;
  }

  async setOwnerForMicrocontroller(
    deviceId: number,
    userId: number,
  ): Promise<void> {
    const mc = await this.microControllerRepository.findOne({
      where: { id: deviceId },
      relations: ['owner'],
    });
    if (!mc) throw new HttpException('Microcontroller not found', 404);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', 404);
    if (mc.owner) {
      throw new HttpException('Microcontroller already has an owner', 400);
    }
    mc.owner = user;
    await this.microControllerRepository.save(mc);
  }

  async deleteMicrocontrollerAsOwner(
    userId: number,
    mcId: number,
  ): Promise<void> {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['owner'],
    });
    if (!mc) {
      throw new HttpException('Microcontroller not found', 404);
    }
    if (!mc.owner || mc.owner.id !== userId) {
      throw new HttpException(
        'You are not the owner of this microcontroller',
        403,
      );
    }
    await this.microControllerRepository.delete(mcId);
  }
}
