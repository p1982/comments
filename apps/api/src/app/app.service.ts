import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string; status: 'ok' } {
    return { message: 'API is running', status: 'ok' };
  }
}
