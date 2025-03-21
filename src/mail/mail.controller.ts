import { Controller, HttpException, Post, Query, Req } from '@nestjs/common';
import { MailService } from './mail.service';
import { Request } from 'express';
import { extractTokenFromCookies } from '../common/utils/cookie.utils';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('send-confirmation')
  async sendConfirmation(@Req() req: Request) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new HttpException('Token not found', 404);
    }
    await this.mailService.sendUserConfirmation(token);
  }

  @Post('send-forgot')
  async sendForgot(@Query('email') email: string) {
    await this.mailService.sendUserForgot(email);
  }
}
