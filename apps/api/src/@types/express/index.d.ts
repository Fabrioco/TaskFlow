import { User } from '../../../generated/prisma';
import '@types/multer';

declare global {
  namespace Express {
    interface Request {
      user?: User<Omit<User, 'passwordHash'>>;
    }
  }
}
