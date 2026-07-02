using Masarak.Domain.Constants;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Application.Interfaces;
using Masarak.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Seeders
{
    public static class DatabaseSeeder
    {
        public static async Task SeedRolesAsync(Context db)
        {
            var roleNames = new[] { AppRoles.Admin, AppRoles.Teacher, AppRoles.Student, AppRoles.Parent };
            bool changed = false;
            foreach (var name in roleNames)
                if (!await db.Roles.AnyAsync(r => r.Name == name))
                { db.Roles.Add(new Role { Name = name }); changed = true; }
            if (changed) await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] Roles verified.");
        }

        public static async Task SeedAdminUserAsync(Context db, IPasswordService passwordService)
        {
            const string adminEmail = "admin@masarak.com";
            if (await db.Users.AnyAsync(u => u.Email == adminEmail))
            { Console.WriteLine("[Seeder] Admin exists. Skipped."); return; }

            var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Admin)
                ?? throw new InvalidOperationException("[Seeder] Admin role missing.");

            db.Users.Add(new User
            {
                RoleId = adminRole.RoleId, FullName = "System Administrator",
                Email = adminEmail, PasswordHash = passwordService.HashPassword("Admin@12345!"),
                Country = "EG", CreatedAt = DateTime.UtcNow,
                IsActive = true, EmailConfirmed = true, FailedLoginCount = 0
            });
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] Admin created: admin@masarak.com / Admin@12345!  ← CHANGE THIS");
        }

        /// <summary>
        /// Seeds 12 Egyptian school grades with Arabic/English names and stage classification.
        /// Phase 2 Academic Core: replaces the simple Grade 1-12 seeder.
        /// </summary>
        public static async Task SeedGradesAsync(Context db)
        {
            if (await db.Grades.AnyAsync()) return;

            var grades = new List<Grade>
            {
                // Primary (ابتدائي) — Grades 1-6
                Grade.Create("Grade 1", "أولى ابتدائي",  GradeStage.Primary, 1),
                Grade.Create("Grade 2", "ثانية ابتدائي", GradeStage.Primary, 2),
                Grade.Create("Grade 3", "ثالثة ابتدائي", GradeStage.Primary, 3),
                Grade.Create("Grade 4", "رابعة ابتدائي", GradeStage.Primary, 4),
                Grade.Create("Grade 5", "خامسة ابتدائي", GradeStage.Primary, 5),
                Grade.Create("Grade 6", "سادسة ابتدائي", GradeStage.Primary, 6),

                // Preparatory (إعدادي) — Grades 7-9
                Grade.Create("Grade 7", "أولى إعدادي",  GradeStage.Preparatory, 7),
                Grade.Create("Grade 8", "ثانية إعدادي", GradeStage.Preparatory, 8),
                Grade.Create("Grade 9", "ثالثة إعدادي", GradeStage.Preparatory, 9),

                // Secondary (ثانوي) — Grades 10-12
                Grade.Create("Grade 10", "أولى ثانوي",  GradeStage.Secondary, 10),
                Grade.Create("Grade 11", "ثانية ثانوي", GradeStage.Secondary, 11),
                Grade.Create("Grade 12", "ثالثة ثانوي", GradeStage.Secondary, 12),
            };

            await db.Grades.AddRangeAsync(grades);
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] 12 Egyptian school grades seeded (Primary/Preparatory/Secondary).");
        }

        public static async Task SeedPlansAsync(Context db)
        {
            if (await db.Plans.AnyAsync()) return;

            var plans = new List<Plan>
            {
                new Plan
                {
                    Name = "Monthly",
                    Type = Masarak.Domain.Enums.PlanType.Monthly,
                    PriceMonthly = 9.99m,
                    Currency = "USD",
                    DurationDays = 30,
                    IsActive = true
                },
                new Plan
                {
                    Name = "Per-Subject",
                    Type = Masarak.Domain.Enums.PlanType.PerSubject,
                    PriceMonthly = 4.99m,
                    Currency = "USD",
                    DurationDays = 30,
                    IsActive = true
                },
                new Plan
                {
                    Name = "Full-Curriculum",
                    Type = Masarak.Domain.Enums.PlanType.FullCurriculum,
                    PriceMonthly = 24.99m,
                    Currency = "USD",
                    DurationDays = 365,
                    IsActive = true
                }
            };

            await db.Plans.AddRangeAsync(plans);
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] Default subscription plans seeded.");
        }

        /// <summary>
        /// Phase 4: Seeds one GradeCommunity chat room per grade and one TeachersCommunity room.
        /// Idempotent — only creates if not exists.
        /// </summary>
        public static async Task SeedChatRoomsAsync(Context db)
        {
            if (await db.ChatRooms.AnyAsync()) return;

            var grades = await db.Grades.OrderBy(g => g.Order).ToListAsync();
            var rooms = new List<Domain.Entities.ChatRoom>();

            foreach (var grade in grades)
            {
                rooms.Add(Domain.Entities.ChatRoom.CreateGradeCommunity(grade.GradeId, $"{grade.Name} Community"));
            }

            rooms.Add(Domain.Entities.ChatRoom.CreateTeachersCommunity());

            await db.ChatRooms.AddRangeAsync(rooms);
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {rooms.Count} chat rooms seeded ({grades.Count} grade rooms + 1 teachers room).");
        }
public static async Task SeedTestTeachersAsync(Context db, IPasswordService pwd)
        {
            if (await db.Teachers.AnyAsync()) return;

            var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Teacher);
            if (role == null) return;

            var user1 = new User { RoleId = role.RoleId, FullName = "Ahmed Teacher", Email = "ahmed.teacher@masarak.com", PasswordHash = pwd.HashPassword("Teacher@123!"), Country = "EG", CreatedAt = DateTime.UtcNow, IsActive = true, EmailConfirmed = true, FailedLoginCount = 0 };
            var user2 = new User { RoleId = role.RoleId, FullName = "Mona Teacher", Email = "mona.teacher@masarak.com", PasswordHash = pwd.HashPassword("Teacher@123!"), Country = "EG", CreatedAt = DateTime.UtcNow, IsActive = true, EmailConfirmed = true, FailedLoginCount = 0 };
            
            db.Users.AddRange(user1, user2);
            await db.SaveChangesAsync();

            db.Teachers.Add(new Teacher { UserId = user1.UserId, Specialization = "Mathematics", Bio = "Math teacher", HiringDate = DateTime.UtcNow });
            db.Teachers.Add(new Teacher { UserId = user2.UserId, Specialization = "Science", Bio = "Science teacher", HiringDate = DateTime.UtcNow });
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] 2 test teachers seeded.");
        }

        public static async Task SeedTestStudentsAsync(Context db, IPasswordService pwd)
        {
            if (await db.Students.AnyAsync()) return;

            var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Student);
            if (role == null) return;
            var grades = await db.Grades.OrderBy(g => g.Order).ToListAsync();
            if (!grades.Any()) return;

            var users = new List<User>();
            var students = new List<Student>();
            int studentCounter = 1;

            foreach (var grade in grades)
            {
                for (int i = 1; i <= 2; i++)
                {
                    var user = new User { RoleId = role.RoleId, FullName = $"Student {studentCounter} Grade {grade.Order}", Email = $"student{studentCounter}@grade{grade.Order}.com", PasswordHash = pwd.HashPassword("Student@123!"), Country = "EG", CreatedAt = DateTime.UtcNow, IsActive = true, EmailConfirmed = true, FailedLoginCount = 0 };
                    users.Add(user);
                    studentCounter++;
                }
            }
            db.Users.AddRange(users);
            await db.SaveChangesAsync();

            studentCounter = 1;
            foreach (var grade in grades)
            {
                var gradeUsers = users.Where(u => u.Email.Contains($"@grade{grade.Order}.com")).ToList();
                foreach (var user in gradeUsers)
                {
                    students.Add(new Student { UserId = user.UserId, GradeId = grade.GradeId, EnrollmentDate = DateTime.UtcNow, AcademicStatus = "Active" });
                }
            }
            db.Students.AddRange(students);
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {students.Count} test students seeded.");
        }

        public static async Task SeedSubjectsAsync(Context db)
        {
            if (await db.Subjects.AnyAsync()) return;
            var grades = await db.Grades.OrderBy(g => g.Order).ToListAsync();
            if (!grades.Any()) return;

            // Ensure categories exist
            if (!await db.SubjectCategories.AnyAsync(c => c.Name == "Mathematics"))
            {
                db.SubjectCategories.AddRange(
                    new SubjectCategory { Name = "Mathematics", NameAr = "رياضيات" },
                    new SubjectCategory { Name = "Science", NameAr = "علوم" },
                    new SubjectCategory { Name = "Arabic", NameAr = "عربي" }
                );
                await db.SaveChangesAsync();
            }

            var mathCat = await db.SubjectCategories.FirstAsync(c => c.Name == "Mathematics");
            var sciCat = await db.SubjectCategories.FirstAsync(c => c.Name == "Science");
            var araCat = await db.SubjectCategories.FirstAsync(c => c.Name == "Arabic");

            // Update existing subjects to their correct categories if they are currently Uncategorized (Id=1)
            var existingSubjects = await db.Subjects.ToListAsync();
            foreach (var subject in existingSubjects)
            {
                if (subject.Name.StartsWith("Mathematics")) subject.SubjectCategoryId = mathCat.SubjectCategoryId;
                else if (subject.Name.StartsWith("Science")) subject.SubjectCategoryId = sciCat.SubjectCategoryId;
                else if (subject.Name.StartsWith("Arabic")) subject.SubjectCategoryId = araCat.SubjectCategoryId;
            }
            await db.SaveChangesAsync();

            foreach (var grade in grades)
            {
                db.Subjects.Add(Subject.Create(grade.GradeId, mathCat.SubjectCategoryId, $"Mathematics {grade.Order}", "رياضيات", $"MATH-{grade.Order}"));
                db.Subjects.Add(Subject.Create(grade.GradeId, sciCat.SubjectCategoryId, $"Science {grade.Order}", "علوم", $"SCI-{grade.Order}"));
                db.Subjects.Add(Subject.Create(grade.GradeId, araCat.SubjectCategoryId, $"Arabic {grade.Order}", "عربي", $"ARB-{grade.Order}"));
            }
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {grades.Count * 3} test subjects seeded.");
        }

        public static async Task SeedClassesAsync(Context db)
        {
            if (await db.Classes.AnyAsync()) return;
            var grades = await db.Grades.OrderBy(g => g.Order).ToListAsync();
            if (!grades.Any()) return;

            foreach (var grade in grades)
            {
                db.Classes.Add(Class.Create(grade.GradeId, $"Class {grade.Order}A", 30, DateTime.UtcNow.Year));
                db.Classes.Add(Class.Create(grade.GradeId, $"Class {grade.Order}B", 30, DateTime.UtcNow.Year));
            }
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {grades.Count * 2} test classes seeded.");
        }

        public static async Task SeedTeachingAssignmentsAsync(Context db)
        {
            if (await db.TeachingAssignments.AnyAsync()) return;
            var teacher1 = await db.Teachers.FirstOrDefaultAsync();
            var grade1 = await db.Grades.FirstOrDefaultAsync(g => g.Order == 1);
            if (grade1 == null) return;
            var class1 = await db.Classes.FirstOrDefaultAsync(c => c.GradeId == grade1.GradeId);
            var mathSubj = await db.Subjects.FirstOrDefaultAsync(s => s.GradeId == grade1.GradeId && s.Name.StartsWith("Mathematics"));
            if (teacher1 == null || class1 == null || mathSubj == null) return;

            db.TeachingAssignments.Add(TeachingAssignment.Create(teacher1.TeacherId, class1.ClassId, mathSubj.SubjectId, DateTime.UtcNow.Year));
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] 1 teaching assignment seeded.");
        }

        public static async Task SeedSubscriptionsAsync(Context db)
        {
            if (await db.Subscriptions.AnyAsync()) return;
            var students = await db.Students.Include(s => s.User).ToListAsync();
            var plans = await db.Plans.ToListAsync();
            var monthlyPlan = plans.FirstOrDefault(p => p.Type == Masarak.Domain.Enums.PlanType.Monthly);
            var perSubjectPlan = plans.FirstOrDefault(p => p.Type == Masarak.Domain.Enums.PlanType.PerSubject);

            if (monthlyPlan == null || perSubjectPlan == null || !students.Any()) return;

            int counter = 0;
            foreach (var student in students)
            {
                // Alternate between monthly and per subject
                bool isMonthly = counter % 2 == 0;
                var plan = isMonthly ? monthlyPlan : perSubjectPlan;
                
                var sub = new Subscription
                {
                    UserId = student.UserId,
                    PlanId = plan.PlanId,
                    Status = Masarak.Domain.Enums.SubscriptionStatus.Active,
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(plan.DurationDays),
                    ActivationMethod = Masarak.Domain.Enums.ActivationMethod.AdminManual,
                    AdminNote = "Seeded subscription",
                    CreatedAt = DateTime.UtcNow
                };

                var payment = new Payment
                {
                    Amount = plan.PriceMonthly,
                    Currency = plan.Currency,
                    Status = Masarak.Domain.Enums.PaymentStatus.Completed,
                    Provider = Masarak.Domain.Enums.PaymentProvider.Manual,
                    Gateway = "Manual",
                    GatewayTxnId = $"SEED-{Guid.NewGuid()}",
                    PaidAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                if (!isMonthly)
                {
                    var subjects = await db.Subjects.Where(s => s.GradeId == student.GradeId).Take(2).ToListAsync();
                    payment.Amount = plan.PriceMonthly * subjects.Count;
                    foreach (var s in subjects)
                    {
                        sub.SubscriptionSubjects.Add(new SubscriptionSubject { SubjectId = s.SubjectId });
                    }
                }
                
                sub.Payments.Add(payment);
                db.Subscriptions.Add(sub);
                counter++;
            }
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {students.Count} subscriptions seeded.");
        }

        public static async Task SeedStudentEnrollmentsAsync(Context db)
        {
            if (await db.StudentClasses.AnyAsync()) return;
            var students = await db.Students.ToListAsync();
            var classes = await db.Classes.ToListAsync();

            int enrollments = 0;
            foreach (var student in students)
            {
                var studentClass = classes.FirstOrDefault(c => c.GradeId == student.GradeId);
                if (studentClass != null)
                {
                    // Check subscription type
                    var sub = await db.Subscriptions.Include(s => s.SubscriptionSubjects).FirstOrDefaultAsync(s => s.UserId == student.UserId && s.Status == Masarak.Domain.Enums.SubscriptionStatus.Active);
                    if (sub != null)
                    {
                        var isFull = sub.SubscriptionSubjects.Count == 0;
                        var type = isFull ? Masarak.Domain.Enums.EnrollmentType.FullClass : Masarak.Domain.Enums.EnrollmentType.PerSubject;
                        var sc = StudentClass.Enroll(student.StudentId, studentClass.ClassId, DateTime.UtcNow.Year, type);
                        
                        if (!isFull)
                        {
                            foreach (var ss in sub.SubscriptionSubjects)
                            {
                                sc.StudentClassSubjects.Add(new StudentClassSubject { SubjectId = ss.SubjectId });
                            }
                        }
                        db.StudentClasses.Add(sc);
                        enrollments++;
                    }
                }
            }
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {enrollments} student enrollments seeded.");
        }
        /// <summary>
        /// Phase 5: Seeds default AI prompt templates for weakness analysis, parent reports, and teaching suggestions.
        /// Idempotent — only creates if not exists.
        /// </summary>
        public static async Task SeedAiPromptTemplatesAsync(Context db)
        {
            if (await db.AiPromptTemplates.AnyAsync()) return;

            var templates = new List<AiPromptTemplate>
            {
                new AiPromptTemplate
                {
                    Key = "weakness_analysis",
                    SystemPrompt = "You are an educational analyst for Egyptian K-12 curriculum. Analyze student performance data and identify specific topic weaknesses. Respond only in JSON.",
                    UserPromptTemplate = "Student: {student_name}, Subject: {subject_name}, Grade: {grade_name}. Exam results: {exam_results_json}. Assignment results: {assignment_results_json}. Identify top 3 weak topics, provide error rate per topic (0-1), and 2 specific recommended actions per topic in {language}. Return JSON matching schema: {schema}.",
                    MaxTokens = 1000,
                    Temperature = 0.3m,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "system"
                },
                new AiPromptTemplate
                {
                    Key = "parent_report",
                    SystemPrompt = "You are a student academic advisor writing a monthly report for an Egyptian parent. Be encouraging, clear, and specific. Write in {language}.",
                    UserPromptTemplate = "Student: {student_name}, Report month: {month}. Performance data: {performance_json}. Attendance: {attendance_json}. Write a 200-word narrative summary and 3 specific recommended actions for the parent.",
                    MaxTokens = 800,
                    Temperature = 0.7m,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "system"
                },
                new AiPromptTemplate
                {
                    Key = "teaching_suggestion",
                    SystemPrompt = "You are a curriculum expert for Egyptian K-12 education. Provide concise, actionable teaching suggestions.",
                    UserPromptTemplate = "Teacher subject: {subject_name}, Grade: {grade_name}, Student weak topics: {weak_topics_json}. Provide one targeted teaching suggestion and 3 specific action items.",
                    MaxTokens = 500,
                    Temperature = 0.5m,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "system"
                }
            };

            await db.AiPromptTemplates.AddRangeAsync(templates);
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] 3 AI prompt templates seeded (weakness_analysis, parent_report, teaching_suggestion).");
        }

        public static async Task SeedParentDashboardDataAsync(Context db)
        {
            var student = await db.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.User.FullName.Contains("Youssef"));
            var subject = await db.Subjects.FirstOrDefaultAsync();
            var classObj = await db.Classes.FirstOrDefaultAsync();
            var assignment = await db.TeachingAssignments.FirstOrDefaultAsync(ta => ta.ClassId == classObj!.ClassId && ta.SubjectId == subject!.SubjectId);
            
            if (student == null || subject == null || classObj == null || assignment == null) return;

            // Check if we already seeded for this student to ensure idempotency
            if (await db.Attendances.AnyAsync(a => a.StudentUserId == student.UserId)) return;

            // Seed Session
            var session = new Session
            {
                AssignmentId = assignment.AssignmentId,
                ClassId = classObj.ClassId,
                Title = "Intro to Math",
                Description = "Basic math concepts",
                ScheduledAt = DateTime.UtcNow.AddDays(-2),
                DurationMinutes = 60,
                Status = SessionStatus.Completed,
                EmbedUrl = "https://zoom.us/test",
                CreatedAt = DateTime.UtcNow
            };
            db.Sessions.Add(session);
            await db.SaveChangesAsync();

            // Seed Attendance
            db.Attendances.Add(Attendance.RecordAbsent(session.SessionId, student.UserId));
            await db.SaveChangesAsync();

            // Seed Student Performance
            var perf = new StudentPerformance
            {
                StudentId = student.StudentId,
                SubjectId = subject.SubjectId,
                ClassId = classObj.ClassId,
                AcademicYear = "2024",
                TotalExamsTaken = 2,
                AvgExam = 45m,
                AttendanceRate = 60m,
                UpdatedAt = DateTime.UtcNow
            };
            db.StudentPerformances.Add(perf);
            await db.SaveChangesAsync();

            // Seed Performance Alert (Low Attendance)
            var alert = PerformanceAlert.Create(student.UserId, subject.SubjectId, AlertType.LowAttendance, 
                "Attendance dropped below 75%", 60m, 75m);
            db.PerformanceAlerts.Add(alert);
            
            // Seed Performance Alert (Low Exam Score)
            var alert2 = PerformanceAlert.Create(student.UserId, subject.SubjectId, AlertType.LowExamScore, 
                "Exam score dropped below 50%", 45m, 50m);
            db.PerformanceAlerts.Add(alert2);
            await db.SaveChangesAsync();

            // Seed Ai Recommendation (Parent Report)
            var payload = new 
            {
                studentName = student.User.FullName,
                reportMonth = DateTime.UtcNow.ToString("MMMM yyyy"),
                overallScore = 45.0m,
                attendanceRate = 60.0m,
                subjectSummaries = new[] 
                {
                    new { subjectName = subject.Name, avgExam = 45.0m, attendanceRate = 60.0m, note = "Average score: 45.0%" }
                },
                narrativeSummary = "Youssef has been struggling with attendance and exam scores recently. We recommend more practice.",
                recommendedActions = new[] { "Review last 3 assignments", "Attend all future classes", "Practice regularly" },
                generatedAt = DateTime.UtcNow
            };
            
            var rec = AiRecommendation.Create(student.UserId, null, RecommendationType.ParentReport, 
                System.Text.Json.JsonSerializer.Serialize(payload), "system", 0, 0, 24 * 30);
            db.AiRecommendations.Add(rec);
            
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] Parent Dashboard data seeded (Attendance, Alerts, Parent Report).");
        }
    }
}
