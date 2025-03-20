import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ActionEnum } from '../common/enums/action.enum';
import { MicrocontrollerEntity } from './microcontroller.entity';

@Entity()
export class MicrocontrollerLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: ActionEnum;

  @Column()
  date: Date;

  @ManyToOne(
    () => MicrocontrollerEntity,
    (microcontroller) => microcontroller.logs,
  )
  microcontroller: MicrocontrollerEntity;
}
