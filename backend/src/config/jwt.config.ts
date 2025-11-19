import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRATION || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
