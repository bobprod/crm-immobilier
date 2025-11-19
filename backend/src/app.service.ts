import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      message: 'CRM Immobilier API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
