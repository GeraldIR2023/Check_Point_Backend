import { TransactionContents } from '../../transactions/entities/transaction.entity';
import { Category } from '../../categories/entities/category.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true, default: 'Multi' })
  platform: string;

  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
    default: 'default.svg',
  })
  image: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'int' })
  inventory: number;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false })
  isPreOrder: boolean;

  @Column({
    type: 'decimal',
    default: 0,
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  discountPrice: number;

  @CreateDateColumn()
  addedAt: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => Category)
  category: Category;

  @OneToMany(() => TransactionContents, (content) => content.product)
  contents: TransactionContents[];
}
