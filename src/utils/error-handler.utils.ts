import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

/*
 & Handles application exceptions and throws the appropriate NestJS error.
 * enabling proper type narrowing in the calling services.
 */
export const errorHandler = (
  error: string,
  type:
    | 'Not Found'
    | 'Bad Request'
    | 'Internal Server Error'
    | 'Conflict Exception'
    | 'Unauthorized Exception'
    | 'Unprocessable Entity Exception'
    | 'Forbidden Exception',
) => {
  const errors = [error];

  //*Handle the different errors
  switch (type) {
    case 'Not Found':
      throw new NotFoundException(errors);
    case 'Bad Request':
      throw new BadRequestException(errors);
    case 'Internal Server Error':
      throw new InternalServerErrorException(errors);
    case 'Conflict Exception':
      throw new ConflictException(errors);
    case 'Unauthorized Exception':
      throw new UnauthorizedException(errors);
    case 'Unprocessable Entity Exception':
      throw new UnprocessableEntityException(errors);
    case 'Forbidden Exception':
      throw new ForbiddenException(errors);
    default:
      throw new InternalServerErrorException(errors);
  }
};
