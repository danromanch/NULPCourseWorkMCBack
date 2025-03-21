import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import envConfig from '../config/env.config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: envConfig().email.host,
        secure: false,
        auth: {
          user: envConfig().email.username,
          pass: envConfig().email.password,
        },
      },
      defaults: {
        from: `'No Reply' <${envConfig().email.username}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    UserModule,
    JwtModule.register({
      global: true,
      secret: envConfig().user.jwtSecret,
      signOptions: { expiresIn: envConfig().user.expiresIn },
    }),
  ],
  providers: [MailService, UserService],
  exports: [MailService],
  controllers: [MailController],
})
export class MailModule {}
