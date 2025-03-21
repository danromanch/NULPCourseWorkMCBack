import { RefreshTokenGuard } from './refresh.guard';

describe('RefreshGuard', () => {
  it('should be defined', () => {
    expect(new RefreshTokenGuard()).toBeDefined();
  });
});
