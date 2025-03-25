import { GoogleOauthGuard } from './google.guard';

describe('GoogleGuard', () => {
  it('should be defined', () => {
    expect(new GoogleOauthGuard()).toBeDefined();
  });
});
