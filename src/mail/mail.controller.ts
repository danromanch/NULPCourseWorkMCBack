import { Controller, HttpException, Post, Req } from '@nestjs/common';
import { MailService } from './mail.service';
import { Request } from 'express';
import { extractTokenFromCookies } from '../common/utils/cookie.utils';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('send')
  async send(@Req() req: Request) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new HttpException('Token not found', 404);
    }
    await this.mailService.sendUserConfirmation(token);
  }
}
