import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * PrismaModule is global — PrismaService can be injected in any module
 * without needing to import PrismaModule explicitly.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
