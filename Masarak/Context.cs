using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Context : DbContext
    {
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<Parent> Parents { get; set; }
        public DbSet<ParentStudent> ParentStudents { get; set; }
        public DbSet<Grade> Grades { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<StudentClass> StudentClasses { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<TeachingAssignment> TeachingAssignments { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<Submission> Submissions { get; set; }
        public DbSet<Exam> Exams { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<StudentExam> StudentExams { get; set; }
        public DbSet<StudentAnswer> StudentAnswers { get; set; }
        public DbSet<StudentPerformance> StudentPerformances { get; set; }
        public DbSet<AiRecommendation> AiRecommendations { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Plan> Plans { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Payment> Payments { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            base.OnConfiguring(optionsBuilder);
            optionsBuilder.UseSqlServer(@"Data Source=.;Initial Catalog=EduPlatform;Integrated Security=True;TrustServerCertificate=True");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── Role ──────────────────────────────────────────────────────────────
            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");
                entity.HasKey(e => e.RoleId);
                entity.Property(e => e.RoleId).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // ── User ──────────────────────────────────────────────────────────────
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.UserId).ValueGeneratedOnAdd();
                entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
                entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Phone).HasMaxLength(30);
                entity.Property(e => e.Country).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);

                entity.HasOne(u => u.Role)
                      .WithMany(r => r.Users)
                      .HasForeignKey(u => u.RoleId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Grade ─────────────────────────────────────────────────────────────
            modelBuilder.Entity<Grade>(entity =>
            {
                entity.ToTable("grades");
                entity.HasKey(e => e.GradeId);
                entity.Property(e => e.GradeId).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Level).IsRequired();
            });

            // ── Student ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Student>(entity =>
            {
                entity.ToTable("students");
                entity.HasKey(e => e.StudentId);
                entity.Property(e => e.StudentId).ValueGeneratedOnAdd();
                entity.Property(e => e.EnrollmentDate).IsRequired();
                entity.Property(e => e.AcademicStatus).HasMaxLength(50).HasDefaultValue("Active").IsRequired();

                entity.HasIndex(e => e.UserId).IsUnique();

                entity.HasOne(s => s.User)
                      .WithOne(u => u.Student)
                      .HasForeignKey<Student>(s => s.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(s => s.Grade)
                      .WithMany(g => g.Students)
                      .HasForeignKey(s => s.GradeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Teacher ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Teacher>(entity =>
            {
                entity.ToTable("teachers");
                entity.HasKey(e => e.TeacherId);
                entity.Property(e => e.TeacherId).ValueGeneratedOnAdd();
                entity.Property(e => e.Specialization).HasMaxLength(150);
                entity.Property(e => e.HiringDate).IsRequired();
                entity.Property(e => e.Bio).HasColumnType("nvarchar(max)");

                entity.HasIndex(e => e.UserId).IsUnique();

                entity.HasOne(t => t.User)
                      .WithOne(u => u.Teacher)
                      .HasForeignKey<Teacher>(t => t.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Parent ────────────────────────────────────────────────────────────
            modelBuilder.Entity<Parent>(entity =>
            {
                entity.ToTable("parents");
                entity.HasKey(e => e.ParentId);
                entity.Property(e => e.ParentId).ValueGeneratedOnAdd();

                entity.HasIndex(e => e.UserId).IsUnique();

                entity.HasOne(p => p.User)
                      .WithOne(u => u.Parent)
                      .HasForeignKey<Parent>(p => p.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── ParentStudent (composite PK) ──────────────────────────────────────
            modelBuilder.Entity<ParentStudent>(entity =>
            {
                entity.ToTable("parent_student");
                entity.HasKey(e => new { e.ParentId, e.StudentId });
                entity.Property(e => e.Relationship).HasMaxLength(50);

                entity.HasOne(ps => ps.Parent)
                      .WithMany(p => p.ParentStudents)
                      .HasForeignKey(ps => ps.ParentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(ps => ps.Student)
                      .WithMany(s => s.ParentStudents)
                      .HasForeignKey(ps => ps.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Class ─────────────────────────────────────────────────────────────
            modelBuilder.Entity<Class>(entity =>
            {
                entity.ToTable("classes");
                entity.HasKey(e => e.ClassId);
                entity.Property(e => e.ClassId).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Capacity).HasDefaultValue(30);

                entity.HasIndex(e => new { e.Name, e.GradeId }).IsUnique();

                entity.HasOne(c => c.Grade)
                      .WithMany(g => g.Classes)
                      .HasForeignKey(c => c.GradeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── StudentClass (composite PK) ───────────────────────────────────────
            modelBuilder.Entity<StudentClass>(entity =>
            {
                entity.ToTable("student_class");
                entity.HasKey(e => new { e.StudentId, e.ClassId, e.AcademicYear });
                entity.Property(e => e.AcademicYear).HasMaxLength(9).IsRequired();
                entity.Property(e => e.IsCurrent).HasDefaultValue(true);

                entity.HasOne(sc => sc.Student)
                      .WithMany(s => s.StudentClasses)
                      .HasForeignKey(sc => sc.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(sc => sc.Class)
                      .WithMany(c => c.StudentClasses)
                      .HasForeignKey(sc => sc.ClassId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Subject ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Subject>(entity =>
            {
                entity.ToTable("subjects");
                entity.HasKey(e => e.SubjectId);
                entity.Property(e => e.SubjectId).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
                entity.Property(e => e.Code).HasMaxLength(20).IsRequired();
                entity.HasIndex(e => e.Code).IsUnique();
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");

                entity.HasOne(s => s.Grade)
                      .WithMany(g => g.Subjects)
                      .HasForeignKey(s => s.GradeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── TeachingAssignment ────────────────────────────────────────────────
            modelBuilder.Entity<TeachingAssignment>(entity =>
            {
                entity.ToTable("teaching_assignments");
                entity.HasKey(e => e.AssignmentId);
                entity.Property(e => e.AssignmentId).ValueGeneratedOnAdd();
                entity.Property(e => e.AcademicYear).HasMaxLength(9).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");

                entity.HasIndex(e => new { e.TeacherId, e.SubjectId, e.ClassId, e.AcademicYear }).IsUnique();

                entity.HasOne(ta => ta.Teacher)
                      .WithMany(t => t.TeachingAssignments)
                      .HasForeignKey(ta => ta.TeacherId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(ta => ta.Subject)
                      .WithMany(s => s.TeachingAssignments)
                      .HasForeignKey(ta => ta.SubjectId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(ta => ta.Class)
                      .WithMany(c => c.TeachingAssignments)
                      .HasForeignKey(ta => ta.ClassId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Session ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Session>(entity =>
            {
                entity.ToTable("sessions");
                entity.HasKey(e => e.SessionId);
                entity.Property(e => e.SessionId).ValueGeneratedOnAdd();
                entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
                entity.Property(e => e.StartTime).IsRequired();
                entity.Property(e => e.EndTime).IsRequired();
                entity.Property(e => e.MeetingLink).HasMaxLength(500);
                entity.Property(e => e.RecordingUrl).HasMaxLength(500);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Scheduled");

                entity.HasOne(se => se.TeachingAssignment)
                      .WithMany(ta => ta.Sessions)
                      .HasForeignKey(se => se.AssignmentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Attendance ────────────────────────────────────────────────────────
            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.ToTable("attendance");
                entity.HasKey(e => e.AttendanceId);
                entity.Property(e => e.AttendanceId).ValueGeneratedOnAdd();
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Present").IsRequired();

                entity.HasIndex(e => new { e.SessionId, e.StudentId }).IsUnique();

                entity.HasOne(a => a.Session)
                      .WithMany(se => se.Attendances)
                      .HasForeignKey(a => a.SessionId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(a => a.Student)
                      .WithMany(s => s.Attendances)
                      .HasForeignKey(a => a.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Assignment ────────────────────────────────────────────────────────
            modelBuilder.Entity<Assignment>(entity =>
            {
                entity.ToTable("assignments");
                entity.HasKey(e => e.AssignmentId);
                entity.Property(e => e.AssignmentId).ValueGeneratedOnAdd();
                entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");
                entity.Property(e => e.DueDate).IsRequired();
                entity.Property(e => e.MaxScore).HasColumnType("decimal(6,2)").HasDefaultValue(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");

                entity.HasOne(a => a.TeachingAssignment)
                      .WithMany(ta => ta.Assignments)
                      .HasForeignKey(a => a.AssignmentRef)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Submission ────────────────────────────────────────────────────────
            modelBuilder.Entity<Submission>(entity =>
            {
                entity.ToTable("submissions");
                entity.HasKey(e => e.SubmissionId);
                entity.Property(e => e.SubmissionId).ValueGeneratedOnAdd();
                entity.Property(e => e.SubmittedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.FileUrl).HasMaxLength(500);
                entity.Property(e => e.AnswerText).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Score).HasColumnType("decimal(6,2)");
                entity.Property(e => e.Feedback).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Submitted");

                entity.HasIndex(e => new { e.AssignmentId, e.StudentId }).IsUnique();

                entity.HasOne(sub => sub.Assignment)
                      .WithMany(a => a.Submissions)
                      .HasForeignKey(sub => sub.AssignmentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(sub => sub.Student)
                      .WithMany(s => s.Submissions)
                      .HasForeignKey(sub => sub.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Exam ──────────────────────────────────────────────────────────────
            modelBuilder.Entity<Exam>(entity =>
            {
                entity.ToTable("exams");
                entity.HasKey(e => e.ExamId);
                entity.Property(e => e.ExamId).ValueGeneratedOnAdd();
                entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
                entity.Property(e => e.StartTime).IsRequired();
                entity.Property(e => e.EndTime).IsRequired();
                entity.Property(e => e.DurationMins).IsRequired();
                entity.Property(e => e.MaxScore).HasColumnType("decimal(6,2)").HasDefaultValue(100);
                entity.Property(e => e.ExamType).HasMaxLength(50).HasDefaultValue("Quiz");

                entity.HasOne(ex => ex.TeachingAssignment)
                      .WithMany(ta => ta.Exams)
                      .HasForeignKey(ex => ex.AssignmentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Question ──────────────────────────────────────────────────────────
            modelBuilder.Entity<Question>(entity =>
            {
                entity.ToTable("questions");
                entity.HasKey(e => e.QuestionId);
                entity.Property(e => e.QuestionId).ValueGeneratedOnAdd();
                entity.Property(e => e.QuestionText).HasColumnType("nvarchar(max)").IsRequired();
                entity.Property(e => e.QuestionType).HasMaxLength(30).IsRequired();
                entity.Property(e => e.Options).HasColumnType("nvarchar(max)");
                entity.Property(e => e.CorrectAns).HasColumnType("nvarchar(max)");
                entity.Property(e => e.Marks).HasColumnType("decimal(5,2)").HasDefaultValue(1);
                entity.Property(e => e.OrderNum).HasDefaultValue(1);

                entity.HasOne(q => q.Exam)
                      .WithMany(ex => ex.Questions)
                      .HasForeignKey(q => q.ExamId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── StudentExam ───────────────────────────────────────────────────────
            modelBuilder.Entity<StudentExam>(entity =>
            {
                entity.ToTable("student_exams");
                entity.HasKey(e => e.StudentExamId);
                entity.Property(e => e.StudentExamId).ValueGeneratedOnAdd();
                entity.Property(e => e.TotalScore).HasColumnType("decimal(6,2)");
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Pending");

                entity.HasIndex(e => new { e.ExamId, e.StudentId }).IsUnique();

                entity.HasOne(se => se.Exam)
                      .WithMany(ex => ex.StudentExams)
                      .HasForeignKey(se => se.ExamId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(se => se.Student)
                      .WithMany(s => s.StudentExams)
                      .HasForeignKey(se => se.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── StudentAnswer ─────────────────────────────────────────────────────
            modelBuilder.Entity<StudentAnswer>(entity =>
            {
                entity.ToTable("student_answers");
                entity.HasKey(e => e.AnswerId);
                entity.Property(e => e.AnswerId).ValueGeneratedOnAdd();
                entity.Property(e => e.AnswerText).HasColumnType("nvarchar(max)");
                entity.Property(e => e.MarksAwarded).HasColumnType("decimal(5,2)");

                entity.HasIndex(e => new { e.StudentExamId, e.QuestionId }).IsUnique();

                entity.HasOne(sa => sa.StudentExam)
                      .WithMany(se => se.StudentAnswers)
                      .HasForeignKey(sa => sa.StudentExamId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(sa => sa.Question)
                      .WithMany(q => q.StudentAnswers)
                      .HasForeignKey(sa => sa.QuestionId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── StudentPerformance ────────────────────────────────────────────────
            modelBuilder.Entity<StudentPerformance>(entity =>
            {
                entity.ToTable("student_performance");
                entity.HasKey(e => e.PerformanceId);
                entity.Property(e => e.PerformanceId).ValueGeneratedOnAdd();
                entity.Property(e => e.AcademicYear).HasMaxLength(9).IsRequired();
                entity.Property(e => e.AvgAssignment).HasColumnType("decimal(5,2)").HasDefaultValue(0);
                entity.Property(e => e.AvgExam).HasColumnType("decimal(5,2)").HasDefaultValue(0);
                entity.Property(e => e.AttendanceRate).HasColumnType("decimal(5,2)").HasDefaultValue(0);
                entity.Property(e => e.FinalGrade).HasColumnType("decimal(5,2)");
                entity.Property(e => e.GradeLetter).HasMaxLength(2);
                entity.Property(e => e.Remarks).HasColumnType("nvarchar(max)");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETDATE()");

                entity.HasIndex(e => new { e.StudentId, e.SubjectId, e.AcademicYear }).IsUnique();

                entity.HasOne(sp => sp.Student)
                      .WithMany(s => s.StudentPerformances)
                      .HasForeignKey(sp => sp.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(sp => sp.Subject)
                      .WithMany(s => s.StudentPerformances)
                      .HasForeignKey(sp => sp.SubjectId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── AiRecommendation ──────────────────────────────────────────────────
            modelBuilder.Entity<AiRecommendation>(entity =>
            {
                entity.ToTable("ai_recommendations");
                entity.HasKey(e => e.RecommendationId);
                entity.Property(e => e.RecommendationId).ValueGeneratedOnAdd();
                entity.Property(e => e.GeneratedAt).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.RecType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ReferenceType).HasMaxLength(50);
                entity.Property(e => e.Reason).HasColumnType("nvarchar(max)").IsRequired();
                entity.Property(e => e.ActionUrl).HasMaxLength(500);
                entity.Property(e => e.IsRead).HasDefaultValue(false);
                entity.Property(e => e.IsDismissed).HasDefaultValue(false);

                entity.HasOne(ai => ai.Student)
                      .WithMany(s => s.AiRecommendations)
                      .HasForeignKey(ai => ai.StudentId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Notification ──────────────────────────────────────────────────────
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.ToTable("notifications");
                entity.HasKey(e => e.NotificationId);
                entity.Property(e => e.NotificationId).ValueGeneratedOnAdd();
                entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
                entity.Property(e => e.Body).HasColumnType("nvarchar(max)").IsRequired();
                entity.Property(e => e.NotifType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.ReferenceType).HasMaxLength(50);
                entity.Property(e => e.IsRead).HasDefaultValue(false);
                entity.Property(e => e.SentAt).HasDefaultValueSql("GETDATE()");

                entity.HasOne(n => n.User)
                      .WithMany(u => u.Notifications)
                      .HasForeignKey(n => n.UserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Plan ──────────────────────────────────────────────────────────────
            modelBuilder.Entity<Plan>(entity =>
            {
                entity.ToTable("plans");
                entity.HasKey(e => e.PlanId);
                entity.Property(e => e.PlanId).ValueGeneratedOnAdd();
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.HasIndex(e => e.Name).IsUnique();
                entity.Property(e => e.Description).HasColumnType("nvarchar(max)");
                entity.Property(e => e.PriceMonthly).HasColumnType("decimal(10,2)").IsRequired();
                entity.Property(e => e.PriceYearly).HasColumnType("decimal(10,2)");
                entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("USD").IsRequired();
                entity.Property(e => e.MaxSubjects).HasDefaultValue(-1);
                entity.Property(e => e.HasAi).HasDefaultValue(false);
                entity.Property(e => e.HasLiveClass).HasDefaultValue(true);
                entity.Property(e => e.HasRecordings).HasDefaultValue(true);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
            });

            // ── Subscription ──────────────────────────────────────────────────────
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.ToTable("subscriptions");
                entity.HasKey(e => e.SubscriptionId);
                entity.Property(e => e.SubscriptionId).ValueGeneratedOnAdd();
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.EndDate).IsRequired();
                entity.Property(e => e.BillingCycle).HasMaxLength(20).HasDefaultValue("Monthly").IsRequired();
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Active").IsRequired();
                entity.Property(e => e.AutoRenew).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");

                entity.HasOne(sub => sub.User)
                      .WithMany(u => u.Subscriptions)
                      .HasForeignKey(sub => sub.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(sub => sub.Plan)
                      .WithMany(p => p.Subscriptions)
                      .HasForeignKey(sub => sub.PlanId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Payment ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("payments");
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.PaymentId).ValueGeneratedOnAdd();
                entity.Property(e => e.Amount).HasColumnType("decimal(10,2)").IsRequired();
                entity.Property(e => e.Currency).HasMaxLength(3).HasDefaultValue("USD").IsRequired();
                entity.Property(e => e.Gateway).HasMaxLength(50).IsRequired();
                entity.Property(e => e.GatewayTxnId).HasMaxLength(255);
                entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETDATE()");

                entity.HasOne(p => p.Subscription)
                      .WithMany(sub => sub.Payments)
                      .HasForeignKey(p => p.SubscriptionId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
