export function getRoleAvatarUrl(
  role: string | null | undefined,
  fullName: string | null | undefined,
): string {
  const normalizedRole = (role ?? '').replace(/[\s_-]/g, '').toLowerCase();

  if (normalizedRole === 'teacher') return '/assets/images/dashboard-heroes/teacher-hero.png';
  if (normalizedRole === 'parent') return '/assets/images/dashboard-heroes/parent-hero.png';

  if (normalizedRole === 'student') {
    return isLikelyFemale(fullName)
      ? '/assets/images/dashboard-heroes/student-female-hero.png?v=3'
      : '/assets/images/dashboard-heroes/student-male-hero.png';
  }

  return '/assets/images/dashboard-heroes/student-male-hero.png';
}

function isLikelyFemale(fullName: string | null | undefined): boolean {
  const name = (fullName ?? '').toLowerCase();
  const femaleNames = [
    'sara', 'سارة', 'fatma', 'فاطمة', 'mariam', 'مريم', 'sandy', 'ساندي',
    'nour', 'نور', 'farida', 'فريدة', 'salma', 'سلمى', 'habiba', 'حبيبة',
    'jana', 'جنى', 'yasmine', 'ياسمين', 'nada', 'ندى', 'malak', 'ملك',
    'menna', 'منة', 'aya', 'آية', 'alaa', 'آلاء',
  ];

  return femaleNames.some((femaleName) => name.includes(femaleName));
}