export type EmployeeDto = { id: string; full_name: string; role_title: string; email: string | null; phone: string | null; is_active: boolean; notes: string };
export type ReservationDto = { id: string; tracking_code: string; customer_name: string; service_category: string; preferred_date: string; status: string };
export type OperationDto = { id: string; operation_type: string; amount: number; currency: string; occurred_at: string; category: string; description: string; status: string; employee_id: string | null; reservation_id: string | null };
export type ChargeDto = { id: string; amount: number; currency: string; occurred_at: string; description: string; reservation_id: string | null };
export type CustomerPaymentDto = { related_operation_id: string | null; amount: number };
export type SummaryDto = { sales_gross: number; managed_sales_commission: number; customer_cash_in: number; customer_refunds: number; operating_expenses: number; inventory_purchases: number; labor_accrued: number; employee_cash_out: number; estimated_cash_flow: number; unpaid_customer_charges: number };
