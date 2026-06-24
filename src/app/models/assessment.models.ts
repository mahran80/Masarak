export enum QuestionType {
  MCQ = 'MCQ',
  TrueFalse = 'TrueFalse',
  ShortAnswer = 'ShortAnswer',
  Essay = 'Essay',
  FillInBlank = 'FillInBlank',
  FileUpload = 'FileUpload'
}

export enum DifficultyLevel {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard'
}

export enum AssignmentStatus {
  Draft = 'Draft',
  Published = 'Published',
  Closed = 'Closed'
}

export enum ExamStatus {
  Draft = 'Draft',
  Published = 'Published',
  Closed = 'Closed'
}

export enum StudentExamStatus {
  InProgress = 'InProgress',
  Submitted = 'Submitted',
  AutoExpired = 'AutoExpired',
  Graded = 'Graded'
}

export enum SubmissionStatus {
  Submitted = 'Submitted',
  Graded = 'Graded'
}

export enum AnswerGradingStatus {
  AutoGraded = 'AutoGraded',
  PendingReview = 'PendingReview',
  ManuallyGraded = 'ManuallyGraded'
}

// ── DTOs ─────────────────────────────────────────────────────────────────

export interface AssignmentDto {
  assignmentId: number;
  title: string;
  dueDate: string;
  maxMarks: number;
  status: AssignmentStatus;
  subjectName: string;
  className: string;
  submissionCount: number;
}

export interface SubmissionDetailDto {
  submissionId: number;
  studentName: string;
  status: SubmissionStatus;
  marksAwarded: number | null;
  submittedAt: string;
  hasFile: boolean;
}

export interface ExamDto {
  examId: number;
  title: string;
  openAt: string;
  closeAt: string;
  durationMinutes: number;
  totalMarks: number;
  status: ExamStatus;
  questionCount: number;
}

export interface QuestionOptionDto {
  label: string;
  text: string;
}

export interface QuestionDto {
  questionId: number;
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  order: number;
  options?: QuestionOptionDto[];
}

export interface SavedAnswerDto {
  questionId: number;
  answerText?: string;
  selectedOptionId?: string;
}

export interface ExamAttemptDto {
  studentExamId: number;
  examId: number;
  examTitle: string;
  expiresAt: string;
  secondsRemaining: number;
  questions: QuestionDto[];
  savedAnswers: SavedAnswerDto[];
}

export interface AnswerResultDto {
  questionId: number;
  questionText: string;
  yourAnswer?: string;
  correctAnswer?: string;
  marksAwarded: number;
  maxMarks: number;
  gradingStatus: AnswerGradingStatus;
}

export interface ExamResultDto {
  studentExamId: number;
  finalScore: number;
  totalMarks: number;
  percentage: number;
  hasPendingManualGrading: boolean;
  answers: AnswerResultDto[];
}

export interface SubjectPerformanceDto {
  subjectId: number;
  subjectName: string;
  averageExamScore: number;
  averageAssignmentScore: number;
  totalExamsTaken: number;
  totalAssignmentsSubmitted: number;
}

export interface CreateAssignmentRequest {
  teachingAssignmentId: number;
  title: string;
  instructions?: string;
  dueDate: string;
  maxMarks: number;
}

export interface CreateExamRequest {
  teachingAssignmentId: number;
  title: string;
  instructions?: string;
  openAt: string;
  closeAt: string;
  durationMinutes: number;
}

export interface AddQuestionRequest {
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  order: number;
  options?: QuestionOptionDto[];
  correctAnswer?: string;
  imageUrl?: string;
}

export interface SubmitAssignmentRequest {
  textContent?: string;
}

export interface SaveAnswerRequest {
  questionId: number;
  answerText?: string;
  selectedOptionId?: string;
}

export interface GradeSubmissionRequest {
  marksAwarded: number;
  feedback?: string;
}
