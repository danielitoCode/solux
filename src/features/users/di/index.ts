import { UsersRepositoryImpl } from '../data/repository/users-repository-impl';
import {
  CreateUser,
  ListFeatures,
  ListUserPermissions,
  ListUsers,
  SaveUserPermissions,
  SetUserActive,
  UpdateUser
} from '../domain/usecases/users-usecases';

const repository = new UsersRepositoryImpl();

export function getUsersUseCases() {
  return {
    list: new ListUsers(repository),
    update: new UpdateUser(repository),
    setActive: new SetUserActive(repository),
    create: new CreateUser(repository),
    listFeatures: new ListFeatures(repository),
    listUserPermissions: new ListUserPermissions(repository),
    saveUserPermissions: new SaveUserPermissions(repository)
  };
}
