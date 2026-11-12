import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error'] })
  status!: 'ok' | 'error';

  @ApiProperty({ enum: ['up', 'down'] })
  database!: 'up' | 'down';

  @ApiProperty({ enum: ['up', 'down'] })
  graphql!: 'up' | 'down';

  @ApiProperty({ enum: ['up', 'down'] })
  websocket!: 'up' | 'down';
}
