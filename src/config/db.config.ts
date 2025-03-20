import { DataSource } from 'typeorm';
import envConfig from './env.config';

export const dataSource = new DataSource({
  type: 'postgres',
  host: envConfig().database.host,
  port: envConfig().database.port,
  username: envConfig().database.username,
  password: envConfig().database.password,
  database: envConfig().database.name,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

export const dbConfig = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      return dataSource.initialize();
    },
  },
];
