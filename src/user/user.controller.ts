import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserRegisterDto } from '../common/dto/UserRegisterDto';
import { UserLoginDto } from '../common/dto/UserLoginDto';
import { UserGuard } from './guard/user.guard';
import { Request, Response } from 'express';
import {
  deleteCookie,
  extractTokenFromCookies,
  setAuthTokenCookie,
  setRefreshTokenCookie,
} from '../common/utils/cookie.utils';
import { RefreshTokenGuard } from './guard/refresh.guard';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Logs in a user with email and password.',
  })
  @ApiBody({ type: UserLoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Password incorrect' })
  async login(@Body() body: UserLoginDto, @Res() res: Response) {
    const token = await this.userService.login(body.email, body.password);
    setAuthTokenCookie(res, token.access_token);
    setRefreshTokenCookie(res, token.refresh_token);
    return res.send({ message: 'User successfully logged in' });
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description: 'Registers a new user with name, email, and password.',
  })
  @ApiBody({ type: UserRegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'User already exists' })
  async register(@Body() body: UserRegisterDto) {
    return await this.userService.register(
      body.name,
      body.password,
      body.email,
    );
  }

  @UseGuards(UserGuard)
  @Post('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieves the profile of the logged-in user.',
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  async check(@Req() req: Request) {
    const token = extractTokenFromCookies(req, 'auth');
    if (token === null) {
      throw new HttpException('Token not found', 404);
    }
    return await this.userService.profile(token);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh user token',
    description: "Refreshes the user's authentication token.",
  })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @ApiResponse({ status: 500, description: 'Failed to refresh token' })
  refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const token = extractTokenFromCookies(req, 'refresh');
      if (token === null) {
        throw new HttpException('Token not found', 404);
      }
      const result = this.userService.refresh(token);
      setAuthTokenCookie(res, result.access_token);
      setRefreshTokenCookie(res, result.refresh_token);
      return res.send('Token refreshed');
    } catch (error) {
      console.error('Error during token refresh:', error);
      throw new HttpException('Failed to refresh token', 500);
    }
  }

  @Post('logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the user and clears authentication cookies.',
  })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @ApiResponse({ status: 500, description: 'Failed to logout' })
  logout(@Req() req: Request, @Res() res: Response) {
    const token = extractTokenFromCookies(req, 'auth');
    if (token === null) {
      throw new HttpException('Token not found', 404);
    }
    deleteCookie(res, 'authToken');
    deleteCookie(res, 'refreshToken');

    if (res.cookie['authToken'] || res.cookie['refreshToken']) {
      throw new HttpException('Failed to logout', 500);
    }
    return res.send('User successfully logged out');
  }

  @Get('confirm/:token')
  async confirmation(@Param('token') token: string) {
    await this.userService.confirm(token);
    return { message: 'Email confirmed' };
  }
}

// TODO reset password, forgot password, mobile verification, google auth, add mc, email push, sms push, choose where to send sms.
