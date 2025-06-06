import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
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
import envConfig from '../config/env.config';
import { GoogleOauthGuard } from './guard/google.guard';
import { GoogleUserDto } from '../common/dto/GoogleUserDto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

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
      body.email,
      body.password,
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

  @Post('change-password')
  @UseGuards(UserGuard)
  async changePassword(
    @Req() req: Request,
    @Query('newPassword') newPassword: string,
  ) {
    const token = extractTokenFromCookies(req, 'auth');
    if (token === null) {
      throw new HttpException('Token not found', 404);
    }
    return await this.userService.changePassword(token, newPassword);
  }

  @Get('redirect-forgot/:token')
  redirectForgot(@Res() res: Response, @Param('token') token: string) {
    return res.redirect(`${envConfig().app.frontend}/forgot-password/${token}`);
  }

  @Get('forgot-password')
  async forgotPassword(
    @Query('token') token: string,
    @Query('password') password: string,
  ) {
    await this.userService.changePassword(token, password);
    return { message: 'Password changed' };
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as GoogleUserDto;
    const exists = await this.userService.findOneByEmail(user.email);
    if (!exists) {
      await this.userService.register(user.username, user.email);
      await this.userRepository.update(
        { email: user.email },
        { verified: true },
      );
    }
    const { access_token, refresh_token } = await this.userService.loginGoogle(
      user.email,
    );
    setAuthTokenCookie(res, access_token);
    setRefreshTokenCookie(res, refresh_token);
    return res.redirect(<string>envConfig().app.frontend);
  }

  @Post('addMc')
  @UseGuards(UserGuard)
  @ApiOperation({
    summary: 'Add microcontroller to user',
    description: 'Adds a microcontroller to the user.',
  })
  @ApiResponse({ status: 200, description: 'Microcontroller added' })
  @ApiResponse({ status: 404, description: 'Token not found' })
  @ApiResponse({ status: 500, description: 'Failed to add microcontroller' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { mcId: { type: 'number' } },
    },
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async addMc(@Body() body: { mcId: number }, @Req() req: Request) {
    console.log(
      'ddsadasdhuoiahoisdjaklsjdasjdklasjkl;daqklsjdlkajs;ldhajksdklahslkdkalkj',
    );
    const token = extractTokenFromCookies(req, 'auth');
    if (token === null) {
      throw new HttpException('Token not found', 404);
    }
    return await this.userService.addMc(token, body.mcId);
  }
}

// TODO email push, add friend to mc.
// Check forgot password
