export interface PlatformSubject {
  id: number;
  name: string;
  gradeLabel: string;
  teacherName: string;
  lessonsCount: number;
}

export const PLATFORM_SUBJECTS: PlatformSubject[] = [
  { id: 1, name: 'الرياضيات', gradeLabel: 'الصف الأول الثانوي', teacherName: 'أحمد محمد', lessonsCount: 45 },
  { id: 2, name: 'اللغة العربية', gradeLabel: 'الصف الأول الثانوي', teacherName: 'أحمد محمد', lessonsCount: 30 },
  { id: 3, name: 'الفيزياء', gradeLabel: 'الصف الأول الثانوي', teacherName: 'أحمد محمد', lessonsCount: 48 },
  { id: 4, name: 'التاريخ', gradeLabel: 'الصف الأول الثانوي', teacherName: 'أحمد محمد', lessonsCount: 22 },
  { id: 5, name: 'الكيمياء', gradeLabel: 'الصف الأول الثانوي', teacherName: 'أحمد محمد', lessonsCount: 20 }
];
