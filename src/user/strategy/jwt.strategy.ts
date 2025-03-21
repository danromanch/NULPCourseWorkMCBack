import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, Injectable } from '@nestjs/common';
import envConfig from '../../config/env.config';
import { JwtPayload } from '../../common/objects/JwtPayload';
import { extractTokenFromCookies } from '../../common/utils/cookie.utils';
import { Request } from 'express';
import { UserService } from '../user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractTokenFromCookies(req, 'auth'),
      ]),
      ignoreExpiration: false,
      secretOrKey: <string>envConfig().user.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findOne(payload.sub);
    if (!user || !user.verified) {
      throw new HttpException('User not validated', 403);
    }
    return { sub: payload.sub, email: payload.email };
  }
}
