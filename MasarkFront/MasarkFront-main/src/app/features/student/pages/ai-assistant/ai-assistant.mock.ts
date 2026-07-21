export interface WeakConcept {
  id: string;
  subjectTag: string;
  title: string;
}

export const WEAK_CONCEPTS: WeakConcept[] = [
  { id: 'wc1', subjectTag: 'الرياضيات', title: 'الكسور وجمعها' },
  { id: 'wc2', subjectTag: 'اللغة العربية', title: 'قواعد النحو: الفاعل والمفعول به' }
];

export const ASSISTANT_INTRO =
  'أهلاً أحمد! لقد قمت بتحليل نتائج اختبارك الأخير في الرياضيات واللغة العربية. دعنا نراجع بعض المفاهيم التي تحتاج إلى مزيد من التركيز.';
