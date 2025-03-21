import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MicrocontrollerEntity } from './microcontroller.entity';

@Entity()
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  verified: boolean;

  @ManyToMany(
    () => MicrocontrollerEntity,
    (microcontroller) => microcontroller.user,
  )
  @JoinTable()
  microcontrollers: MicrocontrollerEntity[];
}
