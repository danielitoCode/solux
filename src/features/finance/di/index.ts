import { FinanceRepositoryImpl } from '../data/repository/finance-repository-impl';
import { AccrueLabor, CreateEmployee, LoadFinance, LoadFinanceSummary, PayEmployee, RecordCustomerPayment, RecordExpense, ToggleEmployee } from '../domain/usecases/finance-usecases';
const repository = new FinanceRepositoryImpl();
export function getFinanceUseCases() { return { load:new LoadFinance(repository), summary:new LoadFinanceSummary(repository), expense:new RecordExpense(repository), labor:new AccrueLabor(repository), payment:new PayEmployee(repository), customerPayment:new RecordCustomerPayment(repository), employee:new CreateEmployee(repository), toggleEmployee:new ToggleEmployee(repository) }; }
