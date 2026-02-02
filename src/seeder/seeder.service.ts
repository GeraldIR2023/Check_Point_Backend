import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Repository, DataSource } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { categories } from './data/categories';
import { products } from './data/products';
import { users } from './data/users';
import { hashPassword } from '../utils/auth';
import { TransactionsService } from '../transactions/transactions.service';
import { transactions } from './data/transactions';
import { CreateTransactionDto } from '../transactions/dto/create-transaction.dto';
import { Coupon } from '../coupons/entities/coupon.entity';
import { coupons } from './data/coupons';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    private readonly transactionsService: TransactionsService,
    private dataSource: DataSource,
  ) {}

  //&To clean the database before add the seeder
  async onModuleInit() {
    const connection = this.dataSource;
    await connection.dropDatabase(); //*Clean the database
    await connection.synchronize(); //*Create the tables
  }

  async seed() {
    //&Hash passwords before saving
    //*Users
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedpassword = await hashPassword(user.password);

        return {
          ...user,
          password: hashedpassword,
          isConfirmed: true,
          token: '',
        };
      }),
    );
    await this.usersRepository.save(hashedUsers);

    //*Categories
    await this.categoryRepository.save(categories);

    //*Coupons
    await this.couponRepository.save(coupons);

    //*Products
    const savedProducts: Product[] = [];

    for await (const seedProduct of products) {
      const category = await this.categoryRepository.findOneBy({
        id: seedProduct.categoryId,
      });
      if (category) {
        const product = this.productRepository.create({
          ...seedProduct,
          category,
          discountPrice: Number(seedProduct.discountPrice || 0),
          description: seedProduct.description || '',
        });
        const savedProduct = await this.productRepository.save(product);
        savedProducts.push(savedProduct);
      }
    }

    //*Transactions
    for await (const seedTransaction of transactions) {
      const user = await this.usersRepository.findOneBy({
        id: seedTransaction.userId,
      });

      if (user) {
        try {
          const dataToSave = {
            ...seedTransaction,
            coupon: seedTransaction.coupon ?? undefined,
          };
          await this.transactionsService.create(
            dataToSave as CreateTransactionDto,
            user,
          );
        } catch (error) {
          console.error(`Error saving transaction: ${error.message}`);
        }
      }
    }
  }
}
