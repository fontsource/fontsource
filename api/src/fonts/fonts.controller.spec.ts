import { Test, TestingModule } from '@nestjs/testing';
import { FontsController } from './fonts.controller';
import { FontsService } from './services/fonts.service';

describe('FontsController', () => {
  let controller: FontsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FontsController],
      providers: [FontsService],
    }).compile();

    controller = module.get<FontsController>(FontsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
