import type { Employee, FinanceSnapshot, Summary } from '../entities/finance';
export interface FinanceRepository {
  load(from: string, to: string): Promise<FinanceSnapshot>;
  recordExpense(input: { amount: number; category: string; description: string; reference: string | null }): Promise<void>;
  accrueLabor(input: { reservationId: string; employeeId: string; role: string; hours: number; amount: number; notes: string }): Promise<void>;
  payEmployee(input: { employeeId: string; amount: number; description: string; reference: string | null }): Promise<void>;
  recordCustomerPayment(input: { chargeId: string; amount: number; description: string; reference: string | null }): Promise<void>;
  createEmployee(input: { fullName: string; roleTitle: string; email: string | null; phone: string | null }): Promise<void>;
  toggleEmployee(employee: Employee): Promise<void>;
  summary(from: string, to: string): Promise<Summary | null>;
}
