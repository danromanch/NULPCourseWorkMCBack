import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MicrocontrollerModule } from './microcontroller/microcontroller.module';
import { UserModule } from './user/user.module';
import { dataSource } from './config/db.config';
import EnvConfig from './config/env.config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSource.options),
    MicrocontrollerModule,
    UserModule,
    ConfigModule.forRoot({
      load: [EnvConfig],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
