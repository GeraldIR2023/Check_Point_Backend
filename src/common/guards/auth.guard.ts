import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { errorHandler } from '../../utils/error-handler.utils';
import { verifyJwt } from '../../utils/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw errorHandler(
        'Token is missing or invalid',
        'Unauthorized Exception',
      );

    const token = authHeader.split(' ')[1];
    const payload = verifyJwt(token);

    if (!payload) {
      throw errorHandler(
        'Token is invalid or expired',
        'Unauthorized Exception',
      );
    }

    request.user = payload;
    return true;
  }
}
