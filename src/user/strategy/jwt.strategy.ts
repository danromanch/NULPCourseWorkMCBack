import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import envConfig from '../../config/env.config';
import { JwtPayload } from '../../common/objects/JwtPayload';
import { extractTokenFromCookies } from '../../common/utils/cookie.utils';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractTokenFromCookies(req, 'auth'),
      ]),
      ignoreExpiration: false,
      secretOrKey: <string>envConfig().user.jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    return { sub: payload.sub, email: payload.email };
  }
}
