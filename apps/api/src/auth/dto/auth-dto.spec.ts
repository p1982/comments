import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { SignInDto } from './sign-in.dto';
import { SignUpDto } from './sign-up.dto';

describe('Auth DTOs with ValidationPipe', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('accepts valid SignUpDto payloads with and without homepage', async () => {
    const withHomepage = await pipe.transform(
      {
        fullName: 'Pavlo',
        email: 'pavlo@example.com',
        password: 'password123',
        homepage: 'https://pavlo.example',
      },
      { type: 'body', metatype: SignUpDto },
    );
    expect(withHomepage).toMatchObject({
      fullName: 'Pavlo',
      email: 'pavlo@example.com',
      homepage: 'https://pavlo.example',
    });

    const withoutHomepage = await pipe.transform(
      {
        fullName: 'Pavlo',
        email: 'pavlo@example.com',
        password: 'password123',
        homepage: '',
      },
      { type: 'body', metatype: SignUpDto },
    );
    expect(withoutHomepage).toMatchObject({ fullName: 'Pavlo' });
  });

  it('accepts valid SignInDto and rejects invalid credentials payloads with readable messages', async () => {
    const valid = await pipe.transform(
      { email: 'pavlo@example.com', password: 'secret' },
      { type: 'body', metatype: SignInDto },
    );
    expect(valid).toMatchObject({ email: 'pavlo@example.com', password: 'secret' });

    await expect(
      pipe.transform({ email: 'bad-email', password: '' }, { type: 'body', metatype: SignInDto }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
