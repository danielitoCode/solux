import { UsersRepositoryImpl } from '../data/repository/users-repository-impl';
import { ListUsers, SetUserActive, UpdateUser } from '../domain/usecases/users-usecases';
const repository = new UsersRepositoryImpl();
export function getUsersUseCases() { return { list: new ListUsers(repository), update: new UpdateUser(repository), setActive: new SetUserActive(repository) }; }
