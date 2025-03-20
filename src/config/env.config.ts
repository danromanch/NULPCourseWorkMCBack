import * as dotenv from 'dotenv';
import * as process from 'node:process';

dotenv.config();

export default () => ({
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(<string>process.env.DATABASE_PORT, 10) || 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
  user: {
    jwtSecret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.REFRESH_SECRET,
    refreshExpiresIn: process.env.REFRESH_EXPIRES_IN,
  },
});
