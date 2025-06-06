import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';

import { WebSocket } from 'ws';
import { MicrocontrollerService } from './microcontroller.service';

@WebSocketGateway()
export class MicrocontrollerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private clients = new Map<string, WebSocket>(); // mcId -> WebSocket
  private wsToMcId = new Map<WebSocket, string>(); // reverse mapping

  constructor(
    private readonly microcontrollerService: MicrocontrollerService,
  ) {}

  // Type for registration message
  private isRegisterMessage(
    data: unknown,
  ): data is { type: string; device_id: string | number } {
    return (
      typeof data === 'object' &&
      data !== null &&
      'type' in data &&
      (data as any).type === 'register' &&
      'device_id' in data &&
      (typeof (data as any).device_id === 'string' ||
        typeof (data as any).device_id === 'number')
    );
  }

  private isEventWithDeviceId(
    data: unknown,
  ): data is { device_id: string | number } {
    return (
      typeof data === 'object' &&
      data !== null &&
      'device_id' in data &&
      (typeof (data as any).device_id === 'string' ||
        typeof (data as any).device_id === 'number')
    );
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    console.log('Client connected');
    client.send(
      JSON.stringify({ type: 'welcome', message: 'Connected to server' }),
    );
    client.on('message', (msg: string | Buffer) => {
      let text: string;
      if (Buffer.isBuffer(msg)) {
        text = msg.toString('utf-8');
      } else {
        text = msg;
      }
      console.log('Raw message received:', text);
      // Try to parse as JSON
      let data: unknown;
      try {
        data = JSON.parse(text);
        console.log('Parsed message:', data);
      } catch {
        // Not JSON, treat as plain string command
        console.log('Received non-JSON message:', text);
        return; // Or handle as needed
      }
      if (this.isRegisterMessage(data)) {
        const deviceIdStr = String(data.device_id);
        this.clients.set(deviceIdStr, client);
        this.wsToMcId.set(client, deviceIdStr);
        client.send(
          JSON.stringify({ type: 'registered', device_id: deviceIdStr }),
        );
        console.log('Registered client with device_id:', deviceIdStr);
        console.log(
          'Current clients map after registration:',
          Array.from(this.clients.entries()),
        );
      } else if (
        typeof data === 'object' &&
        data !== null &&
        'event' in data &&
        (data as any).event === 'new_mail'
      ) {
        // Forward new_mail event to BE client
        this.sendEventToBe(data);
      } else {
        console.log('Message is not a valid registration message.');
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    console.log('Client disconnected');
    const mcId = this.wsToMcId.get(client);
    if (mcId) {
      this.clients.delete(mcId);
      this.wsToMcId.delete(client);
    } else {
      // fallback: remove by reference
      for (const [id, ws] of this.clients.entries()) {
        if (ws === client) {
          this.clients.delete(id);
          break;
        }
      }
    }
  }

  @SubscribeMessage('open')
  handleCommand(@MessageBody() data: any): void {
    console.log('Command received:', data);
  }

  sendToAll(data: string) {
    for (const ws of this.clients.values()) {
      ws.send(JSON.stringify(data));
    }
  }

  sendToOne(clientId: string, data: any): any {
    const clientIdStr = String(clientId);
    console.log('Current clients map:', Array.from(this.clients.entries()));
    console.log('Looking for clientId:', clientIdStr);
    const client = this.clients.get(clientIdStr);
    if (!client) {
      console.log('Client not found for clientId:', clientIdStr);
      return false; // Client not found
    }
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    client.send(message);
    return true;
  }

  sendEventToBe(event: unknown) {
    if (this.isEventWithDeviceId(event)) {
      void this.microcontrollerService.handleMail(String(event.device_id));
    } else {
      console.warn(
        'sendEventToBe: event.device_id is missing or invalid:',
        event,
      );
    }
  }
}
