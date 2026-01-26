import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Invalid name' })
  name: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Image is required' })
  image: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Invalid price' })
  price: number;

  @IsNotEmpty({ message: 'Inventory cannot be empty' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid cantity' })
  inventory: number;

  @IsNotEmpty({ message: 'Category is required' })
  @IsInt({ message: 'Invalid category' })
  categoryId: number;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsOptional()
  @IsBoolean({ message: 'isFeatured must be a boolean' })
  isFeatured: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isPreOrder must be a boolean' })
  isPreOrder: boolean;

  @IsOptional()
  @IsString()
  platform: string;
}
