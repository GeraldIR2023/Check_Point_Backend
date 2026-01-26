import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class GetProductsQueryDto {
  @IsOptional()
  @IsNumberString({}, { message: 'Category must be a number' })
  category_id: number;

  @IsOptional()
  @IsString({ message: 'Platform must be a string' })
  platform: string;

  @IsOptional()
  @IsNumberString({}, { message: 'Cantity must be a number' })
  take: number;

  @IsOptional()
  @IsNumberString({}, { message: 'Cantity must be a number' })
  skip: number;

  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search: string;
}
