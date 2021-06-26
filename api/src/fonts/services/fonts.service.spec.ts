import { Test, TestingModule } from '@nestjs/testing';
import { FontsService } from './fonts.service';

describe('FontsService', () => {
  let service: FontsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FontsService],
    }).compile();

    service = module.get<FontsService>(FontsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
