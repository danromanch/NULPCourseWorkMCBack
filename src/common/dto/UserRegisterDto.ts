import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class UserRegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsEmail({}, { message: 'Email must be a valid email' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
  })
  @IsString({ message: 'Password must be a string' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  @Matches(/[a-zA-Z]/, { message: 'Password must contain at least one letter' })
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString({ message: 'Name must be a string' })
  @Length(3, 20, { message: 'Name must be between 3 and 20 characters' })
  name: string;
}
