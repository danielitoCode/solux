import type { Employee } from '../entities/finance';
import type { FinanceRepository } from '../repository/finance-repository';

export class LoadFinance { constructor(private readonly repository: FinanceRepository) {} execute(from: string, to: string) { return this.repository.load(from, to); } }
export class RecordExpense { constructor(private readonly repository: FinanceRepository) {} execute(input: { amount: number; category: string; description: string; reference: string | null }) { return this.repository.recordExpense(input); } }
export class AccrueLabor { constructor(private readonly repository: FinanceRepository) {} execute(input: { reservationId: string; employeeId: string; role: string; hours: number; amount: number; notes: string }) { return this.repository.accrueLabor(input); } }
export class PayEmployee { constructor(private readonly repository: FinanceRepository) {} execute(input: { employeeId: string; amount: number; description: string; reference: string | null }) { return this.repository.payEmployee(input); } }
export class RecordCustomerPayment { constructor(private readonly repository: FinanceRepository) {} execute(input: { chargeId: string; amount: number; description: string; reference: string | null }) { return this.repository.recordCustomerPayment(input); } }
export class CreateEmployee { constructor(private readonly repository: FinanceRepository) {} execute(input: { fullName: string; roleTitle: string; email: string | null; phone: string | null }) { return this.repository.createEmployee(input); } }
export class ToggleEmployee { constructor(private readonly repository: FinanceRepository) {} execute(employee: Employee) { return this.repository.toggleEmployee(employee); } }
export class LoadFinanceSummary { constructor(private readonly repository: FinanceRepository) {} execute(from: string, to: string) { return this.repository.summary(from, to); } }
