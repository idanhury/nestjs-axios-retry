import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';

@Module({
  imports: [
    RateLimitModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
