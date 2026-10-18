import type { Employee, FinanceSnapshot, Summary } from '../../domain/entities/finance';
import type { FinanceRepository } from '../../domain/repository/finance-repository';
import { FinanceRemoteDataSource } from '../datasources/remote/finance-remote-datasource';
import { mapCharge, mapEmployee, mapOperation, mapPayment, mapReservation, mapSummary } from '../mappers/finance.mapper';

export class FinanceRepositoryImpl implements FinanceRepository {
  constructor(private readonly remote = new FinanceRemoteDataSource()) {}
  async load(from: string, to: string): Promise<FinanceSnapshot> { const data = await this.remote.load(); return { employees:data.employees.map(mapEmployee), reservations:data.reservations.map(mapReservation), operations:data.operations.map(mapOperation), charges:data.charges.map(mapCharge), customerPayments:data.customerPayments.map(mapPayment), summary: await this.summary(from,to) }; }
  recordExpense(input:{amount:number;category:string;description:string;reference:string|null}) { return this.remote.rpc('record_operating_expense',{p_operation_key:crypto.randomUUID(),p_amount:input.amount,p_category:input.category,p_description:input.description,p_occurred_at:new Date().toISOString(),p_document_reference:input.reference}); }
  accrueLabor(input:{reservationId:string;employeeId:string;role:string;hours:number;amount:number;notes:string}) { return this.remote.rpc('accrue_job_labor',{p_operation_key:crypto.randomUUID(),p_reservation_id:input.reservationId,p_employee_id:input.employeeId,p_role_description:input.role,p_hours:input.hours,p_amount:input.amount,p_notes:input.notes}); }
  payEmployee(input:{employeeId:string;amount:number;description:string;reference:string|null}) { return this.remote.rpc('pay_employee',{p_operation_key:crypto.randomUUID(),p_employee_id:input.employeeId,p_amount:input.amount,p_description:input.description,p_document_reference:input.reference}); }
  recordCustomerPayment(input:{chargeId:string;amount:number;description:string;reference:string|null}) { return this.remote.rpc('record_customer_payment',{p_operation_key:crypto.randomUUID(),p_charge_operation_id:input.chargeId,p_amount:input.amount,p_description:input.description,p_document_reference:input.reference,p_occurred_at:new Date().toISOString()}); }
  createEmployee(input:{fullName:string;roleTitle:string;email:string|null;phone:string|null}) { return this.remote.createEmployee({full_name:input.fullName,role_title:input.roleTitle,email:input.email,phone:input.phone}); }
  toggleEmployee(employee:Employee) { return this.remote.toggleEmployee(employee.id,!employee.isActive); }
  async summary(from:string,to:string):Promise<Summary|null> { return mapSummary(await this.remote.summary(from,to)); }
}
