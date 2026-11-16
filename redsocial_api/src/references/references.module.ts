import { Module } from '@nestjs/common';
import { ReferencesService } from './references.service.js';
import { ReferencesController } from './references.controller.js';

@Module({
  controllers: [ReferencesController],
  providers: [ReferencesService],
})
export class ReferencesModule {}
