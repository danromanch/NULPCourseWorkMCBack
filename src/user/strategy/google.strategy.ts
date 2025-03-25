import { PassportStrategy } from '@nestjs/passport';
import { HttpException, Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import envConfig from '../../config/env.config';
import { GoogleUserDto } from '../../common/dto/GoogleUserDto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: <string>envConfig().google.clientID,
      clientSecret: <string>envConfig().google.clientSecret,
      callbackURL: <string>envConfig().google.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { name, emails } = profile;
    if (emails === undefined || name === undefined) {
      throw new HttpException('Invalid Google profile', 400);
    }
    const user: GoogleUserDto = {
      email: emails[0].value,
      username: name.givenName,
      accessToken,
    };
    done(null, user);
  }
}
