import { Module } from '@nestjs/common';
import { MicrocontrollerService } from './microcontroller.service';
import { MicrocontrollerController } from './microcontroller.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { MicrocontrollerEntity } from '../entities/microcontroller.entity';
import { MicrocontrollerGateway } from './microcontroller.gateway';
import { MailModule } from '../mail/mail.module';
import { MicrocontrollerLogEntity } from '../entities/microcontroller.log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      MicrocontrollerEntity,
      MicrocontrollerLogEntity,
    ]),
    MailModule,
  ],
  controllers: [MicrocontrollerController],
  providers: [MicrocontrollerService, MicrocontrollerGateway],
  exports: [MicrocontrollerService],
})
export class MicrocontrollerModule {}
