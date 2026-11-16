import { Role } from '../schemas/user.schema.js';

export class CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  birthDate: string;
  password: string;
  role: Role;
}
