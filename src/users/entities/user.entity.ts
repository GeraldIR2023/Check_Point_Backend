import { Transaction } from '../../transactions/entities/transaction.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  userTag: string;

  @Column({ type: 'varchar', length: 30 })
  email: string;

  @Column({ type: 'varchar', length: 60 })
  password: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  token: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  isConfirmed: boolean;

  @Column({ type: 'boolean', default: false, nullable: true })
  isAdmin: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}
