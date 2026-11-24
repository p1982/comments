import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import type { AuthSignUpRequest } from '@comments/shared';

export class SignUpDto implements AuthSignUpRequest {
  @ApiProperty({ example: 'Ann' })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(100, { message: 'Full name must be at most 100 characters' })
  fullName!: string;

  @ApiProperty({ example: 'auth@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(255, { message: 'Email must be at most 255 characters' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(100, { message: 'Password must be at most 100 characters' })
  password!: string;

  @ApiPropertyOptional({ example: 'https://ann.example' })
  @IsOptional()
  @IsString({ message: 'Homepage must be a string' })
  @ValidateIf((dto: SignUpDto) => Boolean(dto.homepage?.trim()))
  @IsUrl(
    { require_protocol: true },
    { message: 'Homepage must be a valid URL starting with http:// or https://' },
  )
  @MaxLength(500, { message: 'Homepage must be at most 500 characters' })
  homepage?: string;
}
