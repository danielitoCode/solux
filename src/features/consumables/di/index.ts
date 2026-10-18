import { ConsumableRepositoryImpl } from '../data/repository/consumable-repository-impl';
import { CreateConsumable, ListConsumables, ToggleConsumable, UpdateConsumable } from '../domain/usecases/consumable-usecases';

const repository = new ConsumableRepositoryImpl();
export function getConsumableUseCases() {
  return { list: new ListConsumables(repository), create: new CreateConsumable(repository), update: new UpdateConsumable(repository), toggle: new ToggleConsumable(repository) };
}
