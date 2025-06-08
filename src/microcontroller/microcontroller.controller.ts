import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
  Req,
  ForbiddenException,
  Get,
} from '@nestjs/common';
import { MicrocontrollerService } from './microcontroller.service';
import { MicrocontrollerGateway } from './microcontroller.gateway';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ActionEnum } from '../common/enums/action.enum';
import { UserGuard } from '../user/guard/user.guard';
import { extractTokenFromCookies } from '../common/utils/cookie.utils';
import { JwtPayload } from '../common/objects/JwtPayload';
import { JwtService } from '@nestjs/jwt';

@Controller('microcontroller')
export class MicrocontrollerController {
  constructor(
    private readonly microcontrollerService: MicrocontrollerService,
    private readonly microcontrollerGateway: MicrocontrollerGateway,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(UserGuard)
  @Post('add-friend')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        device_id: { type: 'number', example: 1 },
        email: { type: 'string', example: 'friend@example.com' },
      },
      required: ['device_id', 'email'],
    },
    description:
      'Add a friend by email to allow them to open/close the lock for the specified device_id.',
  })
  async addFriend(
    @Body() body: { device_id: number; email: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new ForbiddenException('No authentication token provided');
    }
    const payload: JwtPayload = this.jwtService.decode(token);
    const result = await this.microcontrollerService.addFriendToMicrocontroller(
      payload.sub,
      body.device_id,
      body.email,
    );
    return res.status(HttpStatus.OK).send({ message: result });
  }

  @ApiQuery({ name: 'device_id' })
  @UseGuards(UserGuard)
  @Post('open')
  async openDoor(
    @Query('device_id') device_id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new ForbiddenException('No authentication token provided');
    }
    const payload: JwtPayload = this.jwtService.decode(token);
    const canOpen = await this.microcontrollerService.userCanOpenOrClose(
      payload.sub,
      parseInt(device_id),
    );
    if (!canOpen) {
      throw new ForbiddenException(
        'You do not have access to open this microcontroller',
      );
    }
    this.microcontrollerGateway.sendToAll('open');
    await this.microcontrollerService['logAction'](
      parseInt(device_id),
      ActionEnum.openDoor,
    );
    return res.status(HttpStatus.OK).send({ message: 'Open command sent' });
  }

  @ApiQuery({ name: 'device_id' })
  @UseGuards(UserGuard)
  @Post('close')
  async closeDoor(
    @Query('device_id') device_id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new ForbiddenException('No authentication token provided');
    }
    const payload: JwtPayload = this.jwtService.decode(token);
    const canClose = await this.microcontrollerService.userCanOpenOrClose(
      payload.sub,
      parseInt(device_id),
    );
    if (!canClose) {
      throw new ForbiddenException(
        'You do not have access to close this microcontroller',
      );
    }
    this.microcontrollerGateway.sendToAll('close');
    await this.microcontrollerService['logAction'](
      parseInt(device_id),
      ActionEnum.closeDoor,
    );
    return res.status(HttpStatus.OK).send({ message: 'Close command sent' });
  }

  @Post('register')
  async register(@Body() body: { secretWord: string }, @Res() res: Response) {
    // Register with secret word, no owner
    const data = await this.microcontrollerService.register(body.secretWord);
    return res.status(HttpStatus.CREATED).send(String(data));
  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        device_id: { type: 'number', example: 1 },
      },
      required: ['device_id'],
    },
    description: 'Set the owner for a microcontroller by device_id.',
  })
  @UseGuards(UserGuard)
  @Post('add-mc')
  async addMicrocontroller(
    @Body() body: { device_id: number },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new ForbiddenException('No authentication token provided');
    }
    const payload: JwtPayload = this.jwtService.decode(token);
    await this.microcontrollerService.setOwnerForMicrocontroller(
      body.device_id,
      payload.sub,
    );
    return res
      .status(HttpStatus.OK)
      .send({ message: 'Owner set for microcontroller' });
  }

  @UseGuards(UserGuard)
  @Get('logs/user')
  async getUserLogs(@Req() req, @Res() res: Response) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new ForbiddenException('No authentication token provided');
    }
    const payload: JwtPayload = this.jwtService.decode(token);
    const logs = await this.microcontrollerService.getLogsForUser(payload.sub);
    return res.status(HttpStatus.OK).send(logs);
  }

  @ApiQuery({ name: 'device_id' })
  @UseGuards(UserGuard)
  @Get('logs/mc')
  async getMcLogs(
    @Query('device_id') device_id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    // Optionally, you can check ownership here as well
    const logs = await this.microcontrollerService.getLogsForMicrocontroller(
      parseInt(device_id),
    );
    return res.status(HttpStatus.OK).send(logs);
  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        device_id: { type: 'number', example: 1 },
      },
      required: ['device_id'],
    },
    description:
      'Delete a microcontroller as its owner. Only the owner can perform this action.',
  })
  @UseGuards(UserGuard)
  @Post('delete-mc')
  async deleteMicrocontroller(
    @Body() body: { device_id: number },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new ForbiddenException('No authentication token provided');
    }
    const payload: JwtPayload = this.jwtService.decode(token);
    await this.microcontrollerService.deleteMicrocontrollerAsOwner(
      payload.sub,
      body.device_id,
    );
    return res
      .status(HttpStatus.OK)
      .send({ message: 'Microcontroller deleted' });
  }
}
