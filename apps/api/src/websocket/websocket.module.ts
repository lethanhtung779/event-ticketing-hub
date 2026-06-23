import { Global, Module } from '@nestjs/common';
import { AppGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [AppGateway],
  exports: [AppGateway],
})
export class WebsocketModule {}
