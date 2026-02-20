import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { errorHandler } from '../../utils/error-handler.utils';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw errorHandler(
        'Token is missing or invalid',
        'Unauthorized Exception',
      );

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token);

      req.user = payload;

      return true;
    } catch (error) {
      throw errorHandler(
        'Token is invalid or expired',
        'Unauthorized Exception',
      );
    }
  }
}
