export interface SystemMetric {
  icon: string;
  label: string;
  value: string;
  statusLabel: string;
  statusColor: 'green' | 'orange' | 'red';
  color: 'blue' | 'green' | 'orange';
}

export const SYSTEM_METRICS: SystemMetric[] = [
  {
    icon: 'database',
    label: 'عمق طابور RabbitMQ',
    value: '12 رسالة',
    statusLabel: 'طبيعي',
    statusColor: 'green',
    color: 'blue'
  },
  {
    icon: 'wifi',
    label: 'اتصالات SignalR النشطة',
    value: '348 اتصال',
    statusLabel: 'مستقر',
    statusColor: 'green',
    color: 'green'
  },
  {
    icon: 'activity',
    label: 'المهام الخلفية النشطة',
    value: '3 مهام',
    statusLabel: 'يعمل بشكل طبيعي',
    statusColor: 'orange',
    color: 'orange'
  }
];

export const QUEUE_DEPTH = 12;
export const SIGNALR_CONNECTIONS = 348;

export interface ActiveJob {
  id: string;
  name: string;
  statusLabel: string;
  statusColor: 'green' | 'orange';
}

export const ACTIVE_JOBS: ActiveJob[] = [
  { id: 'j1', name: 'إعادة حساب الأداء الشهري', statusLabel: 'قيد التنفيذ', statusColor: 'orange' },
  { id: 'j2', name: 'إرسال تقارير أولياء الأمور', statusLabel: 'قيد التنفيذ', statusColor: 'orange' },
  { id: 'j3', name: 'تنظيف الجلسات المنتهية', statusLabel: 'مكتمل', statusColor: 'green' }
];

export interface SystemError {
  id: string;
  message: string;
  time: string;
}

export const RECENT_ERRORS: SystemError[] = [
  { id: 'e1', message: 'فشل الاتصال بقاعدة البيانات لمدة 3 ثواني', time: 'منذ 20 دقيقة' },
  { id: 'e2', message: 'انتهت صلاحية رمز الدخول لأحد المستخدمين', time: 'منذ ساعة' },
  { id: 'e3', message: 'فشل إرسال إشعار Push لأحد المعلمين', time: 'منذ 3 ساعات' }
];