import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, Injectable } from '@nestjs/common';
import { JwtPayload } from '../common/objects/JwtPayload';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import envConfig from '../config/env.config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async sendUserConfirmation(token: string) {
    const payload: JwtPayload = this.jwtService.decode(token);
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new HttpException('WTF', 500);
    }
    const link = `${envConfig().app.url}/user/confirm/${token}`;
    await this.mailerService.sendMail({
      to: payload.email,
      subject: 'Welcome to Nice App! Confirm your Email',
      template: './confirmation',
      context: {
        name: user.name,
        link: link,
      },
    });
  }
}
