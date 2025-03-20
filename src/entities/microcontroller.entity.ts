import { Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MicrocontrollerLogEntity } from './microcontroller.log.entity';
import { UserEntity } from './user.entity';

@Entity()
export class MicrocontrollerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => MicrocontrollerLogEntity, (logs) => logs.microcontroller)
  logs: MicrocontrollerLogEntity[];

  @ManyToMany(() => UserEntity, (user) => user.microcontrollers)
  user: UserEntity;
}
