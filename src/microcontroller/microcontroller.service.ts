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

  public async handleMail(id: string) {
    const mc = await this.microControllerRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['user'],
    });
    if (mc === null) {
      console.log('dasdas');
      return 'Microcontroller not found';
    }
    const user = mc.user;
    const trueUser = await this.userRepository.findOne({
      where: { id: user.id },
    });
    if (trueUser === null) {
      return 'Microcontroller is not connected to user';
    }
    if (!trueUser.email) {
      return 'User has no email';
    }
    await this.logAction(mc.id, ActionEnum.getMail);
    //await this.mailService.sendUserGetMail(user.email);
  }

  async userOwnsMicrocontroller(
    userId: number,
    mcId: number,
  ): Promise<boolean> {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['user'],
    });
    if (!mc || !mc.user) return false;
    // If user is ManyToMany, mc.user is array, else object
    if (Array.isArray(mc.user)) {
      return mc.user.some((u: UserEntity) => u.id === userId);
    } else {
      return mc.user.id === userId;
    }
  }

  async getLogsForUser(userId: number) {
    // Find all microcontrollers owned by the user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['microcontrollers', 'microcontrollers.logs'],
    });
    if (!user) return [];
    // Collect all logs from all user's microcontrollers
    return user.microcontrollers.flatMap(mc => mc.logs);
  }

  async getLogsForMicrocontroller(mcId: number) {
    const mc = await this.microControllerRepository.findOne({
      where: { id: mcId },
      relations: ['logs'],
    });
    if (!mc) return [];
    return mc.logs;
  }
}
/* TODO Implement collecting data from the microcontroller,
Add locking and unlocking post box, and connecting user to mc */
