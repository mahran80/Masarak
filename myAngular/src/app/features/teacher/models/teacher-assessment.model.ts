export type AssignmentStatus = 'Draft' | 'Published' | 'Closed';
export type SubmissionStatus = 'Submitted' | 'Graded';
export type ExamStatus = 'Draft' | 'Published' | 'Closed';
export type QuestionType = 'MCQ' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'FillInBlank' | 'FileUpload';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface TeacherAssignment {
  assignmentId: number;
  title: string;
  dueDate: string;
  maxScore: number;
  status: AssignmentStatus;
  subjectName: string;
  className: string;
  submissionCount: number;
}

export interface TeacherSubmissionDetail {
  submissionId: number;
  studentId: number;
  studentName: string;
  status: SubmissionStatus;
  score?: number;
  submittedAt: string;
  hasFile: boolean;
}

export interface CreateAssignmentRequest {
  teachingAssignmentId: number;
  title: string;
  instructions?: string;
  dueDate: string;
  maxScore: number;
}

export interface GradeSubmissionRequest {
  marksAwarded: number;
  feedback?: string;
}

export interface TeacherExam {
  examId: number;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalMarks: number;
  status: ExamStatus;
  questionCount: number;
}

export interface TeacherQuestion {
  questionId: number;
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  order: number;
  options?: TeacherQuestionOption[];
}

export interface TeacherQuestionOption {
  label: string;
  text: string;
}

export interface CreateExamRequest {
  teachingAssignmentId: number;
  title: string;
  instructions?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface AddQuestionRequest {
  type: QuestionType;
  text: string;
  marks: number;
  difficulty: DifficultyLevel;
  order: number;
  correctAnswer?: string;
  imageUrl?: string;
  options?: TeacherQuestionOption[];
}

export type UpdateQuestionRequest = AddQuestionRequest;

export interface PendingGradingDashboard {
  totalPendingExamAnswers: number;
  totalPendingSubmissions: number;
  exams: PendingExamSummary[];
  assignments: PendingAssignmentSummary[];
}

export interface PendingExamSummary {
  examId: number;
  examTitle: string;
  pendingAnswersCount: number;
}

export interface PendingAssignmentSummary {
  assignmentId: number;
  assignmentTitle: string;
  pendingSubmissionsCount: number;
}

export interface ExamGradingReview {
  studentExamId: number;
  studentName: string;
  examTitle: string;
  totalAutoScore: number;
  pendingAnswers: PendingAnswer[];
}

export interface PendingAnswer {
  answerId: number;
  questionId: number;
  questionText: string;
  maxMarks: number;
  answerText?: string;
  fileUrl?: string;
}

export interface GradeStudentAnswerRequest {
  marksAwarded: number;
  feedback?: string;
}
