import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{
        provide: AppService,
        useValue: {
          sendRequest: jest.fn().mockImplementation(() => new Promise<void>(resolve => resolve())),

        }
      }],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return void', async () => {
      await appController.sendRequest();
      const res = await appService.sendRequest();
      expect(res).toBeUndefined();
    });
  });
});
