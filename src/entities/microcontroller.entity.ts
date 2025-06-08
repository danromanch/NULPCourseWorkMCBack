import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinTable,
} from 'typeorm';
import { MicrocontrollerLogEntity } from './microcontroller.log.entity';
import { UserEntity } from './user.entity';

@Entity()
export class MicrocontrollerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => MicrocontrollerLogEntity, (logs) => logs.microcontroller, {
    onDelete: 'CASCADE',
  })
  logs: MicrocontrollerLogEntity[];

  @ManyToOne(() => UserEntity, { nullable: true })
  owner: UserEntity;

  @ManyToMany(() => UserEntity)
  @JoinTable()
  friends: UserEntity[];
}
