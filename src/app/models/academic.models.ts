// ─── Academic Core DTOs — mirrors Phase 2 backend DTOs exactly ──────────────

export type GradeStage = 'Primary' | 'Preparatory' | 'Secondary';
export type SessionStatus = 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';

// ─── Grade ───────────────────────────────────────────────────────────────────

export interface GradeDto {
  gradeId: number;
  name: string;
  nameAr: string;
  stage: GradeStage;
  order: number;
  isActive: boolean;
}

export interface CreateGradeRequest {
  name: string;
  nameAr: string;
  stage: GradeStage;
  order: number;
}

export interface UpdateGradeRequest {
  name: string;
  nameAr: string;
  isActive: boolean;
}

// ─── Subject ─────────────────────────────────────────────────────────────────

export interface SubjectDto {
  subjectId: number;
  gradeId: number;
  name: string;
  nameAr: string;
  code: string;
  isActive: boolean;
}

export interface CreateSubjectRequest {
  gradeId: number;
  name: string;
  nameAr: string;
  code: string;
}

export interface UpdateSubjectRequest {
  name: string;
  nameAr: string;
  isActive: boolean;
}

// ─── Class ───────────────────────────────────────────────────────────────────

export interface ClassDto {
  classId: number;
  gradeId: number;
  gradeName: string;
  name: string;
  maxCapacity: number;
  academicYear: number;
  enrollmentCount: number;
  isActive: boolean;
}

export interface CreateClassRequest {
  gradeId: number;
  name: string;
  maxCapacity: number;
  academicYear: number;
}

export interface UpdateClassRequest {
  name: string;
  maxCapacity: number;
  isActive: boolean;
}

// ─── Teaching Assignment ─────────────────────────────────────────────────────

export interface TeachingAssignmentDto {
  id: number;
  teacherUserId: number;
  teacherName: string;
  classId: number;
  className: string;
  subjectId: number;
  subjectName: string;
  academicYear: number;
  isActive: boolean;
}

export interface CreateAssignmentRequest {
  teacherUserId: number;
  classId: number;
  subjectId: number;
  academicYear: number;
}

// ─── Enrollment ──────────────────────────────────────────────────────────────

export interface StudentClassDto {
  studentClassId: number;
  studentUserId: number;
  studentName: string;
  classId: number;
  className: string;
  academicYear: number;
}

export interface StudentInClassDto {
  studentUserId: number;
  fullName: string;
  email: string;
}

export interface EnrollStudentRequest {
  studentUserId: number;
  classId: number;
  academicYear: number;
}

export interface StudentEnrollmentDto {
  classId: number;
  className: string;
  gradeName: string;
  academicYear: number;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface SessionDto {
  sessionId: number;
  title: string;
  description: string | null;
  scheduledAt: string;       // ISO8601 UTC
  durationMinutes: number;
  endsAt: string;            // ISO8601 UTC
  embedUrl: string | null;
  status: SessionStatus;
  subjectName: string;
  className: string;
  teacherName: string;
}

export interface WeeklyScheduleDto {
  weekStart: string;
  weekEnd: string;
  sessions: SessionDto[];
}

export interface CreateSessionRequest {
  teachingAssignmentId: number;
  title: string;
  description?: string;
  scheduledAt: string;       // ISO8601
  durationMinutes: number;
  embedUrl?: string;
}

export interface UpdateSessionRequest {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  embedUrl?: string;
}
