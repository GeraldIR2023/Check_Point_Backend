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

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

    await this.categoryRepository.save(categories);
    for await (const seedProduct of products) {
      const category = await this.categoryRepository.findOneBy({
        id: seedProduct.categoryId,
      });

      if (category) {
        const productData = {
          ...seedProduct,
          category,
          discountPrice: Number(seedProduct.discountPrice || 0),
          description: seedProduct.description || '',
        };

        const product = this.productRepository.create(productData);
        await this.productRepository.save(product);
      }
    }
  }
}
