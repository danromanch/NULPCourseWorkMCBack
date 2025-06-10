import { Request, Response } from 'express';

export const cookieConfig = {
  authToken: {
    name: 'authToken',
    options: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  },
  refreshToken: {
    name: 'refreshToken',
    options: {
      path: '/',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  },
};

export const setAuthTokenCookie = (res: Response, token: string) => {
  res.cookie(
    cookieConfig.authToken.name,
    encodeURIComponent(token),
    cookieConfig.authToken.options,
  );
};

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(
    cookieConfig.refreshToken.name,
    encodeURIComponent(token),
    cookieConfig.refreshToken.options,
  );
};

export const extractTokenFromCookies = (
  req: Request,
  tokenType: 'auth' | 'refresh',
) => {
  const cookies = req.headers.cookie?.split('; ');
  if (!cookies?.length) {
    return null;
  }

  const tokenName =
    tokenType === 'auth'
      ? cookieConfig.authToken.name
      : cookieConfig.refreshToken.name;
  const tokenCookie = cookies.find((cookie) =>
    cookie.startsWith(`${tokenName}=`),
  );
  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.split('=')[1]);
};

export const deleteCookie = (res: Response, name: string) => {
  res.clearCookie(name, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: false,
  });
};
