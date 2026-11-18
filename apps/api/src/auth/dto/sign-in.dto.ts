import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ example: 'auth@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}
