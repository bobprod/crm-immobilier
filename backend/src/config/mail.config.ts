import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  from: {
    name: process.env.SMTP_FROM_NAME || 'CRM Immobilier',
    email: process.env.SMTP_FROM_EMAIL || 'noreply@localhost.com',
  },
}));
