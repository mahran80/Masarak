export interface MonthlyScore {
  label: string;
  value: number;
}

export const PERFORMANCE_TREND: MonthlyScore[] = [
  { label: 'يناير', value: 40 },
  { label: 'فبراير', value: 55 },
  { label: 'مارس', value: 60 },
  { label: 'أبريل', value: 92 }
];

export const KEY_INSIGHTS: string[] = [
  'تحسن ملحوظ في الجبر',
  'يحتاج مزيداً من التدريب في الإملاء',
  'أداء مستقر في العلوم',
  'تفاعل ممتاز في الحصص التفاعلية'
];
