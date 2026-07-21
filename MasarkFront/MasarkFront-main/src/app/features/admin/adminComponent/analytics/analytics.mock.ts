export interface DauPoint {
  label: string;
  value: number;
}

export const DAU_DATA: DauPoint[] = [
  { label: '20 نوفمبر', value: 2700 },
  { label: '21 نوفمبر', value: 2500 },
  { label: '22 نوفمبر', value: 2700 },
  { label: '23 نوفمبر', value: 2700 },
  { label: '24 نوفمبر', value: 2700 },
  { label: '25 نوفمبر', value: 4500 },
  { label: '26 نوفمبر', value: 2700 }
];

export interface SubjectShare {
  label: string;
  percent: number;
  color: string;
}

export const POPULAR_SUBJECTS: SubjectShare[] = [
  { label: 'اللغة العربية (30%)', percent: 30, color: 'var(--color-primary)' },
  { label: 'الرياضيات (25%)', percent: 25, color: 'var(--color-primary-soft)' },
  { label: 'العلوم (20%)', percent: 20, color: '#9bb6e8' },
  { label: 'اللغة الإنجليزية (15%)', percent: 15, color: '#c7d6ef' },
  { label: 'الدراسات الإسلامية (10%)', percent: 10, color: '#e4ecf9' }
];

export interface LoginHour {
  hour: string;
  value: number;
}

export const LOGIN_PEAK_HOURS: LoginHour[] = [
  { hour: '6 ص', value: 10 },
  { hour: '7 ص', value: 35 },
  { hour: '8 ص', value: 55 },
  { hour: '9 ص', value: 75 },
  { hour: '10 ص', value: 95 },
  { hour: '11 ص', value: 60 },
  { hour: '12 م', value: 45 },
  { hour: '1 م', value: 70 },
  { hour: '2 م', value: 65 },
  { hour: '3 م', value: 30 },
  { hour: '4 م', value: 20 },
  { hour: '5 م', value: 15 },
  { hour: '6 م', value: 10 }
];

export const DAU_GROWTH_PERCENT = 8;
