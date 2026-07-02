using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Seeders
{
    public static class TeacherMockDataSeeder
    {
        public static async Task SeedExtensiveTeacherDataAsync(Context db)
        {
            var assignments = await db.TeachingAssignments
                .Include(ta => ta.Class)
                .Include(ta => ta.Subject)
                .ToListAsync();

            if (!assignments.Any()) return;

            foreach (var assignment in assignments)
            {
                await SeedContentItemsAsync(db, assignment.AssignmentId);
                await SeedAssignmentsAsync(db, assignment.AssignmentId);
                await SeedExamsAsync(db, assignment.AssignmentId);
                await SeedSessionsAsync(db, assignment.AssignmentId, assignment.ClassId);
            }

            Console.WriteLine($"[Seeder] Extensive Teacher Mock Data seeded successfully for {assignments.Count} classes.");
        }

        private static async Task SeedContentItemsAsync(Context db, int teachingAssignmentId)
        {
            if (await db.ContentItems.AnyAsync(c => c.TeachingAssignmentId == teachingAssignmentId)) return;

            var items = new List<ContentItem>
            {
                ContentItem.CreateUrlBased(teachingAssignmentId, null, ContentType.Video, ContentSourceType.YouTubeUrl, 
                    "Introduction to the Subject", "First lecture video covering the basics.", "https://youtube.com/watch?v=mock1"),
                ContentItem.CreateUrlBased(teachingAssignmentId, null, ContentType.Video, ContentSourceType.YouTubeUrl, 
                    "Advanced Concepts", "Deep dive into advanced topics.", "https://youtube.com/watch?v=mock2"),
                ContentItem.CreateBlobBased(teachingAssignmentId, null, ContentType.PDF, 
                    "Syllabus and Guidelines", "PDF document for the curriculum", "syllabus.pdf", "https://masarak.blob.core.windows.net/files/syllabus.pdf", 1024 * 500),
                ContentItem.CreateBlobBased(teachingAssignmentId, null, ContentType.ExerciseSheet, 
                    "Worksheet 1", "Practice exercises for chapter 1", "worksheet1.pdf", "https://masarak.blob.core.windows.net/files/worksheet1.pdf", 1024 * 300)
            };

            await db.ContentItems.AddRangeAsync(items);
            await db.SaveChangesAsync();
        }

        private static async Task SeedAssignmentsAsync(Context db, int teachingAssignmentId)
        {
            if (await db.Assignments.AnyAsync(a => a.AssignmentRef == teachingAssignmentId)) return;

            var assignments = new List<Assignment>
            {
                Assignment.Create(teachingAssignmentId, "Homework 1: Fundamentals", "Complete all questions from page 12.", DateTime.UtcNow.AddDays(-2), 10),
                Assignment.Create(teachingAssignmentId, "Homework 2: Application", "Write a short essay on the application of the subject.", DateTime.UtcNow.AddDays(5), 20)
            };
            assignments[0].Publish();
            assignments[1].Publish();

            await db.Assignments.AddRangeAsync(assignments);
            await db.SaveChangesAsync();

            var ta = await db.TeachingAssignments.FirstOrDefaultAsync(t => t.AssignmentId == teachingAssignmentId);
            if (ta == null) return;
            var students = await db.StudentClasses
                .Where(sc => sc.ClassId == ta.ClassId)
                .Select(sc => sc.Student)
                .ToListAsync();

            var submissions = new List<Submission>();
            bool firstStudent = true;
            foreach (var student in students)
            {
                var sub = Submission.Create(assignments[0].AssignmentId, student.StudentId, "Here is my answer to the homework.", null, null);
                // Leave the first student's submission ungraded so the teacher can test grading it!
                if (!firstStudent)
                {
                    sub.Grade(8.5m, "Good job!");
                }
                submissions.Add(sub);
                firstStudent = false;
            }

            await db.Submissions.AddRangeAsync(submissions);
            await db.SaveChangesAsync();
        }

        private static async Task SeedExamsAsync(Context db, int teachingAssignmentId)
        {
            if (await db.Exams.AnyAsync(e => e.AssignmentId == teachingAssignmentId)) return;

            var exam1 = Exam.Create(teachingAssignmentId, "Midterm Quiz 1", "Answer all questions carefully.", DateTime.UtcNow.AddDays(-5), DateTime.UtcNow.AddDays(-4), 30);
            var exam2 = Exam.Create(teachingAssignmentId, "Final Exam Preparation", "Practice test for the finals.", DateTime.UtcNow.AddDays(10), DateTime.UtcNow.AddDays(11), 60);

            await db.Exams.AddRangeAsync(exam1, exam2);
            await db.SaveChangesAsync();

            var q1 = new Question { ExamId = exam1.ExamId, Type = QuestionType.MCQ, QuestionText = "What is the capital of Egypt?", Marks = 2, Difficulty = DifficultyLevel.Easy, OrderNum = 1, CorrectAns = "A" };
            q1.Options.Add(new QuestionOption { Text = "Cairo", Label = 'A' });
            q1.Options.Add(new QuestionOption { Text = "Alexandria", Label = 'B' });
            
            var q2 = new Question { ExamId = exam1.ExamId, Type = QuestionType.TrueFalse, QuestionText = "The sun rises from the west.", Marks = 1, Difficulty = DifficultyLevel.Easy, OrderNum = 2, CorrectAns = "False" };
            
            await db.Questions.AddRangeAsync(q1, q2);
            await db.SaveChangesAsync();

            exam1.Publish();
            await db.SaveChangesAsync();

            var ta = await db.TeachingAssignments.FirstOrDefaultAsync(t => t.AssignmentId == teachingAssignmentId);
            if (ta == null) return;
            var students = await db.StudentClasses
                .Where(sc => sc.ClassId == ta.ClassId)
                .Select(sc => sc.Student)
                .ToListAsync();

            bool firstStudentExam = true;
            foreach (var student in students)
            {
                var studentExam = StudentExam.Begin(exam1.ExamId, student.StudentId, 30);
                
                // Add answers to the questions
                studentExam.StudentAnswers.Add(new StudentAnswer { StudentExamId = studentExam.StudentExamId, QuestionId = q1.QuestionId, AnswerText = "Cairo", MarksAwarded = 2, GradingStatus = AnswerGradingStatus.AutoGraded });
                studentExam.StudentAnswers.Add(new StudentAnswer { StudentExamId = studentExam.StudentExamId, QuestionId = q2.QuestionId, AnswerText = "True", MarksAwarded = null, GradingStatus = AnswerGradingStatus.PendingReview }); // Pending manual grading!
                
                studentExam.MarkSubmitted();
                
                // Leave the first student's exam pending grading, finalize the rest
                if (!firstStudentExam)
                {
                    studentExam.FinalizeMixedGrading(2m); // Only got the first question right
                }
                
                db.StudentExams.Add(studentExam);
                firstStudentExam = false;
            }
            await db.SaveChangesAsync();
        }

        private static async Task SeedSessionsAsync(Context db, int teachingAssignmentId, int classId)
        {
            if (await db.Sessions.AnyAsync(s => s.AssignmentId == teachingAssignmentId)) return;

            var sessions = new List<Session>
            {
                Session.Schedule(teachingAssignmentId, classId, "Live Revision: Chapter 1", "Discussion on chapter 1", DateTime.UtcNow.AddDays(-1), 60, "https://zoom.us/mock1"),
                Session.Schedule(teachingAssignmentId, classId, "Live Lecture: Chapter 2", "Introduction to chapter 2", DateTime.UtcNow.AddHours(2), 60, "https://zoom.us/mock2"),
                Session.Schedule(teachingAssignmentId, classId, "Live Lecture: Chapter 3", "Advanced topics", DateTime.UtcNow.AddDays(2), 60, "https://zoom.us/mock3")
            };
            
            sessions[0].Complete();

            await db.Sessions.AddRangeAsync(sessions);
            await db.SaveChangesAsync();
        }
    }
}
