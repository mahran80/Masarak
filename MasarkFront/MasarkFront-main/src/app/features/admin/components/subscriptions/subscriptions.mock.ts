export type PaymentStatus = 'مدفوع' | 'معلق';
export type SubscriptionPlan = 'شهري' | 'كامل';

export interface PaymentRecord {
  id: string;
  studentName: string;
  plan: SubscriptionPlan;
  amount: number;
  status: PaymentStatus;
}

export const PAYMENT_RECORDS: PaymentRecord[] = [
  { id: 'p1', studentName: 'أحمد علي', plan: 'شهري', amount: 300, status: 'مدفوع' },
  { id: 'p2', studentName: 'فاطمة حسن', plan: 'كامل', amount: 3000, status: 'مدفوع' },
  { id: 'p3', studentName: 'محمد خالد', plan: 'شهري', amount: 300, status: 'معلق' },
  { id: 'p4', studentName: 'سارة عبدالله', plan: 'كامل', amount: 3000, status: 'مدفوع' }
];

export const ACTIVE_SUBSCRIPTIONS_COUNT = 450;
export const MONTHLY_REVENUE = 54200;
