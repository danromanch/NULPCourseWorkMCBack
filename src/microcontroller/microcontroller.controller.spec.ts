import { Test, TestingModule } from '@nestjs/testing';
import { MicrocontrollerController } from './microcontroller.controller';

describe('MicrocontrollerController', () => {
  let controller: MicrocontrollerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MicrocontrollerController],
    }).compile();

    controller = module.get<MicrocontrollerController>(MicrocontrollerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
