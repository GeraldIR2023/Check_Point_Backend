import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { errorHandler } from 'src/utils/error-handler.utils';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const user = req.user;

    if (!user) errorHandler('You are not logged in', 'Unauthorized Exception');

    if (!user.isAdmin)
      errorHandler("You don't have admin rights", 'Forbidden Exception');

    return true;
  }
}
