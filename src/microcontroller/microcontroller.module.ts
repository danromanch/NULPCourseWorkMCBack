import { Module } from '@nestjs/common';
import { MicrocontrollerService } from './microcontroller.service';
import { MicrocontrollerController } from './microcontroller.controller';

@Module({
  providers: [MicrocontrollerService],
  controllers: [MicrocontrollerController],
})
export class MicrocontrollerModule {}
