import { Test, TestingModule } from '@nestjs/testing';
import { MicrocontrollerService } from './microcontroller.service';

describe('MicrocontrollerService', () => {
  let service: MicrocontrollerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MicrocontrollerService],
    }).compile();

    service = module.get<MicrocontrollerService>(MicrocontrollerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
