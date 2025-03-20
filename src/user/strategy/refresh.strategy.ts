import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { extractTokenFromCookies } from '../../common/utils/cookie.utils';
import envConfig from '../../config/env.config';
import { JwtPayload } from '../../common/objects/JwtPayload';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractTokenFromCookies(req, 'refresh'),
      ]),
      ignoreExpiration: false,
      secretOrKey: <string>envConfig().user.refreshSecret,
    });
  }

  validate(payload: JwtPayload) {
    return { sub: payload.sub, email: payload.email };
  }
}
