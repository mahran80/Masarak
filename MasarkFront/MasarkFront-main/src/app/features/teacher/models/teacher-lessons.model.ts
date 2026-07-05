export interface Lesson {
  lessonId: number;
  teachingAssignmentId: number;
  title: string;
  description: string;
  orderNum: number;
  isPublished: boolean;
  createdAt: string;
  contentCount: number;
  examCount: number;
  assignmentCount: number;
}

export interface LessonDetail {
  lessonId: number;
  teachingAssignmentId: number;
  title: string;
  description: string;
  orderNum: number;
  isPublished: boolean;
  createdAt: string;
  contentItems: any[]; // Or ContentItem if defined
  exams: any[];
  assignments: any[];
}

export interface CreateLessonRequest {
  teachingAssignmentId: number;
  title: string;
  description?: string;
}

export interface UpdateLessonRequest {
  title: string;
  description?: string;
}

export interface ReorderLessonsRequest {
  lessonIdsInOrder: number[];
}

export interface CloneLessonRequest {
  targetTeachingAssignmentIds: number[];
}
