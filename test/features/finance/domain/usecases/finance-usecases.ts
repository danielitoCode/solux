import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FinanceRepository } from '$features/finance/domain/repository/finance-repository';
import type { Employee } from '$features/finance/domain/entities/finance';
import {
  LoadFinance,
  RecordExpense,
  AccrueLabor,
  PayEmployee,
  RecordCustomerPayment,
  CreateEmployee,
  ToggleEmployee,
  LoadFinanceSummary
} from '$features/finance/domain/usecases/finance-usecases';

describe('finance-usecases', () => {
  let repo: FinanceRepository;

  beforeEach(() => {
    repo = {
      load: vi.fn(),
      recordExpense: vi.fn(),
      accrueLabor: vi.fn(),
      payEmployee: vi.fn(),
      recordCustomerPayment: vi.fn(),
      createEmployee: vi.fn(),
      toggleEmployee: vi.fn(),
      summary: vi.fn()
    } as unknown as FinanceRepository;
  });

  it('LoadFinance pasa rango de fechas', async () => {
    vi.mocked(repo.load).mockResolvedValue({} as never);
    await new LoadFinance(repo).execute('2026-01-01', '2026-01-31');
    expect(repo.load).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
  });

  it('RecordExpense registra gasto', async () => {
    const input = { amount: 100, category: 'ops', description: 'Herramienta', reference: null };
    vi.mocked(repo.recordExpense).mockResolvedValue({} as never);
    await new RecordExpense(repo).execute(input);
    expect(repo.recordExpense).toHaveBeenCalledWith(input);
  });

  it('AccrueLabor registra mano de obra', async () => {
    const input = {
      reservationId: 'r1',
      employeeId: 'e1',
      role: 'tech',
      hours: 4,
      amount: 80,
      notes: ''
    };
    vi.mocked(repo.accrueLabor).mockResolvedValue({} as never);
    await new AccrueLabor(repo).execute(input);
    expect(repo.accrueLabor).toHaveBeenCalledWith(input);
  });

  it('PayEmployee paga a empleado', async () => {
    const input = { employeeId: 'e1', amount: 50, description: 'Adelanto', reference: null };
    vi.mocked(repo.payEmployee).mockResolvedValue({} as never);
    await new PayEmployee(repo).execute(input);
    expect(repo.payEmployee).toHaveBeenCalledWith(input);
  });

  it('RecordCustomerPayment registra cobro', async () => {
    const input = { chargeId: 'c1', amount: 200, description: 'Abono', reference: null };
    vi.mocked(repo.recordCustomerPayment).mockResolvedValue({} as never);
    await new RecordCustomerPayment(repo).execute(input);
    expect(repo.recordCustomerPayment).toHaveBeenCalledWith(input);
  });

  it('CreateEmployee crea empleado', async () => {
    const input = { fullName: 'Pedro', roleTitle: 'Técnico', email: null, phone: null };
    vi.mocked(repo.createEmployee).mockResolvedValue({} as Employee);
    await new CreateEmployee(repo).execute(input);
    expect(repo.createEmployee).toHaveBeenCalledWith(input);
  });

  it('ToggleEmployee alterna estado', async () => {
    const emp = { id: 'e1', isActive: true } as Employee;
    vi.mocked(repo.toggleEmployee).mockResolvedValue({ ...emp, isActive: false });
    await new ToggleEmployee(repo).execute(emp);
    expect(repo.toggleEmployee).toHaveBeenCalledWith(emp);
  });

  it('LoadFinanceSummary pide resumen por rango', async () => {
    vi.mocked(repo.summary).mockResolvedValue({} as never);
    await new LoadFinanceSummary(repo).execute('2026-01-01', '2026-01-31');
    expect(repo.summary).toHaveBeenCalledWith('2026-01-01', '2026-01-31');
  });
});
