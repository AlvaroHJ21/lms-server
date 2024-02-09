import { Request } from 'express';
import { IUser } from '../src/models/user.model';

declare global { // indicamos que vamos a modificar el objeto global
  namespace Express { // modificamos el namespace Express
    interface Request { // modificamos la interfaz Request
      user: IUser;
    }
  }
}
