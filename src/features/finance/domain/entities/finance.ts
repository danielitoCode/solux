export type Employee = { id: string; fullName: string; roleTitle: string; email: string | null; phone: string | null; isActive: boolean; notes: string };
export type Reservation = { id: string; trackingCode: string; customerName: string; serviceCategory: string; preferredDate: string; status: string };
export type Operation = { id: string; operationType: string; amount: number; currency: string; occurredAt: string; category: string; description: string; status: string; employeeId: string | null; reservationId: string | null };
export type Charge = { id: string; amount: number; currency: string; occurredAt: string; description: string; reservationId: string | null };
export type CustomerPayment = { relatedOperationId: string | null; amount: number };
export type Summary = { salesGross: number; managedSalesCommission: number; customerCashIn: number; customerRefunds: number; operatingExpenses: number; inventoryPurchases: number; laborAccrued: number; employeeCashOut: number; estimatedCashFlow: number; unpaidCustomerCharges: number };
export type FinanceSnapshot = { employees: Employee[]; reservations: Reservation[]; operations: Operation[]; charges: Charge[]; customerPayments: CustomerPayment[]; summary: Summary | null };
