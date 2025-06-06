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
import { Response } from 'express';
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

  @ApiQuery({ name: 'device_id' })
  @UseGuards(UserGuard)
  @Post('open')
  async openDoor(
    @Query('device_id') device_id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const token = extractTokenFromCookies(req, 'auth');
    if (!token) {
      throw new ForbiddenException('No authentication token provided');
    }
    const payload: JwtPayload = this.jwtService.decode(token);
    const owns = await this.microcontrollerService.userOwnsMicrocontroller(
      payload.sub,
      parseInt(device_id),
    );
    if (!owns) {
      throw new ForbiddenException('You do not own this microcontroller');
    }
    const sent: unknown = this.microcontrollerGateway.sendToOne(
      device_id,
      'open',
    );
    if (sent) {
      await this.microcontrollerService['logAction'](
        parseInt(device_id),
        ActionEnum.openDoor,
      );
      return res.status(HttpStatus.OK).send({ message: 'Open command sent' });
    } else {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send({ message: 'Device not connected' });
    }
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
    const owns = await this.microcontrollerService.userOwnsMicrocontroller(
      payload.sub,
      parseInt(device_id),
    );
    if (!owns) {
      throw new ForbiddenException('You do not own this microcontroller');
    }
    const sent: unknown = this.microcontrollerGateway.sendToOne(
      device_id,
      'close',
    );
    if (sent) {
      await this.microcontrollerService['logAction'](
        parseInt(device_id),
        ActionEnum.closeDoor,
      );
      return res.status(HttpStatus.OK).send({ message: 'Close command sent' });
    } else {
      return res
        .status(HttpStatus.NOT_FOUND)
        .send({ message: 'Device not connected' });
    }
  }

  @Post('register')
  @ApiBody({
    schema: { type: 'object', properties: { secretWord: { type: 'string' } } },
  })
  async register(@Body() body: { secretWord: string }, @Res() res: Response) {
    console.log('attempting to register', body);

    const data = await this.microcontrollerService.register(body.secretWord);
    console.log('data', data);
    return res.status(HttpStatus.CREATED).send(String(data));
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
}
