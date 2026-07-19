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

                // Secondary (ثانوي) — Grade 10 only (to meet 10 grades constraint)
                Grade.Create("Grade 10", "أولى ثانوي",  GradeStage.Secondary, 10),
            };

            await db.Grades.AddRangeAsync(grades);
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] 10 Egyptian school grades seeded.");
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
            var grades = await db.Grades.OrderBy(g => g.Order).ToListAsync();
            var rooms = new List<Domain.Entities.ChatRoom>();

            foreach (var grade in grades)
            {
                if (!await db.ChatRooms.AnyAsync(r =>
                    r.RoomType == ChatRoomType.GradeCommunity && r.GradeId == grade.GradeId))
                {
                    rooms.Add(Domain.Entities.ChatRoom.CreateGradeCommunity(grade.GradeId, $"{grade.Name} Community"));
                }
            }

            if (!await db.ChatRooms.AnyAsync(r => r.RoomType == ChatRoomType.TeachersCommunity))
            {
                rooms.Add(Domain.Entities.ChatRoom.CreateTeachersCommunity());
            }

            if (rooms.Count == 0) return;

            await db.ChatRooms.AddRangeAsync(rooms);
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {rooms.Count} missing chat rooms seeded.");
        }
        public static async Task SeedTestTeachersAsync(Context db, IPasswordService pwd)
        {
            if (await db.Teachers.CountAsync() >= 10) return;

            var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Teacher);
            if (role == null) return;

            var specializations = new[] { 
                "Mathematics", "Science", "Arabic", "English", "History", 
                "Geography", "Physics", "Chemistry", "Biology", "Computer Science" 
            };

            var users = new List<User>();
            var teachers = new List<Teacher>();

            for (int i = 0; i < 10; i++)
            {
                var spec = specializations[i];
                var name = $"{spec} Teacher";
                var email = $"{spec.Replace(" ", "").ToLower()}.teacher@masarak.com";

                if (!await db.Users.AnyAsync(u => u.Email == email))
                {
                    var user = new User { 
                        RoleId = role.RoleId, FullName = name, Email = email, 
                        PasswordHash = pwd.HashPassword("Teacher@123!"), Country = "EG", 
                        CreatedAt = DateTime.UtcNow, IsActive = true, EmailConfirmed = true, FailedLoginCount = 0 
                    };
                    db.Users.Add(user);
                    await db.SaveChangesAsync(); // Save to get UserId

                    db.Teachers.Add(new Teacher { 
                        UserId = user.UserId, Specialization = spec, 
                        Bio = $"Experienced {spec} teacher", HiringDate = DateTime.UtcNow 
                    });
                }
            }
            
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] 10 test teachers seeded with 10 specializations.");
        }

        public static async Task SeedTestParentsAsync(Context db, IPasswordService pwd)
        {
            if (await db.Parents.AnyAsync()) return;

            var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Parent);
            if (role == null) return;

            var users = new List<User>();
            var parents = new List<Parent>();

            for (int i = 1; i <= 10; i++)
            {
                var user = new User { 
                    RoleId = role.RoleId, FullName = $"Parent {i}", 
                    Email = $"parent{i}@masarak.com", PasswordHash = pwd.HashPassword("Parent@123!"), 
                    Country = "EG", CreatedAt = DateTime.UtcNow, IsActive = true, EmailConfirmed = true, FailedLoginCount = 0 
                };
                users.Add(user);
            }
            db.Users.AddRange(users);
            await db.SaveChangesAsync();

            foreach (var user in users)
            {
                parents.Add(new Parent { UserId = user.UserId, Bio = "Dedicated parent", Headline = "Supporting my children" });
            }
            db.Parents.AddRange(parents);
            await db.SaveChangesAsync();
            Console.WriteLine("[Seeder] 10 test parents seeded.");
        }

        public static async Task SeedTestStudentsAsync(Context db, IPasswordService pwd)
        {
            if (await db.Students.AnyAsync()) return;

            var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Student);
            if (role == null) return;
            var grades = await db.Grades.OrderBy(g => g.Order).ToListAsync();
            if (!grades.Any()) return;
            
            var parents = await db.Parents.ToListAsync();

            var users = new List<User>();
            var students = new List<Student>();
            int studentCounter = 1;

            foreach (var grade in grades)
            {
                for (int i = 1; i <= 10; i++)
                {
                    var user = new User { RoleId = role.RoleId, FullName = $"Student {studentCounter} Grade {grade.Order}", Email = $"student{studentCounter}@grade{grade.Order}.com", PasswordHash = pwd.HashPassword("Student@123!"), Country = "EG", CreatedAt = DateTime.UtcNow, IsActive = true, EmailConfirmed = true, FailedLoginCount = 0 };
                    users.Add(user);
                    studentCounter++;
                }
            }
            db.Users.AddRange(users);
            await db.SaveChangesAsync();

            // Link students to grades, and link 1 student in each grade to each of the 10 parents
            studentCounter = 1;
            foreach (var grade in grades)
            {
                var gradeUsers = users.Where(u => u.Email.Contains($"@grade{grade.Order}.com")).ToList();
                for (int i = 0; i < gradeUsers.Count; i++)
                {
                    var user = gradeUsers[i];
                    var student = new Student { UserId = user.UserId, GradeId = grade.GradeId, EnrollmentDate = DateTime.UtcNow, AcademicStatus = "Active" };
                    students.Add(student);
                }
            }
            db.Students.AddRange(students);
            await db.SaveChangesAsync();
            
            // Generate ParentStudent links
            var parentStudents = new List<ParentStudent>();
            foreach (var grade in grades)
            {
                var gradeStudents = students.Where(s => s.GradeId == grade.GradeId).ToList();
                for (int i = 0; i < 10; i++) // 10 parents, 10 students per grade
                {
                    if (i < parents.Count && i < gradeStudents.Count)
                    {
                        parentStudents.Add(new ParentStudent 
                        { 
                            ParentId = parents[i].ParentId, 
                            StudentId = gradeStudents[i].StudentId,
                            Relationship = "Guardian"
                        });
                    }
                }
            }
            db.ParentStudents.AddRange(parentStudents);
            await db.SaveChangesAsync();

            Console.WriteLine($"[Seeder] {students.Count} test students seeded and linked to 10 parents.");
        }

        public static async Task SeedSubjectsAsync(Context db)
        {
            if (await db.Subjects.CountAsync() > 100) return; // If plenty of subjects exist, skip
            var grades = await db.Grades.OrderBy(g => g.Order).ToListAsync();
            if (!grades.Any()) return;

            var specializations = new[] { 
                ("Mathematics", "رياضيات", "MATH"), ("Science", "علوم", "SCI"), 
                ("Arabic", "لغة عربية", "ARB"), ("English", "لغة إنجليزية", "ENG"), 
                ("History", "تاريخ", "HIS"), ("Geography", "جغرافيا", "GEO"), 
                ("Physics", "فيزياء", "PHY"), ("Chemistry", "كيمياء", "CHE"), 
                ("Biology", "أحياء", "BIO"), ("Computer Science", "حاسب آلي", "CS") 
            };

            // Ensure categories exist
            foreach (var spec in specializations)
            {
                if (!await db.SubjectCategories.AnyAsync(c => c.Name == spec.Item1))
                {
                    db.SubjectCategories.Add(new SubjectCategory { Name = spec.Item1, NameAr = spec.Item2 });
                }
            }
            await db.SaveChangesAsync();

            var categories = await db.SubjectCategories.ToListAsync();

            // Update existing subjects to their correct categories if they are currently Uncategorized (Id=1)
            var existingSubjects = await db.Subjects.ToListAsync();
            foreach (var subject in existingSubjects)
            {
                var cat = categories.FirstOrDefault(c => subject.Name.StartsWith(c.Name));
                if (cat != null) subject.SubjectCategoryId = cat.SubjectCategoryId;
            }
            await db.SaveChangesAsync();

            foreach (var grade in grades)
            {
                foreach (var spec in specializations)
                {
                    var catId = categories.First(c => c.Name == spec.Item1).SubjectCategoryId;
                    var subjName = $"{spec.Item1} {grade.Order}";
                    
                    if (!await db.Subjects.AnyAsync(s => s.Name == subjName && s.GradeId == grade.GradeId))
                    {
                        db.Subjects.Add(Subject.Create(grade.GradeId, catId, subjName, spec.Item2, $"{spec.Item3}-{grade.Order}"));
                    }
                }
            }
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] Test subjects seeded for 10 categories across {grades.Count} grades.");
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
            var teachers = await db.Teachers.ToListAsync();
            var classes = await db.Classes.Include(c => c.Grade).ToListAsync();
            var subjects = await db.Subjects.ToListAsync();
            
            if (!teachers.Any() || !classes.Any() || !subjects.Any()) return;

            var assignments = new List<TeachingAssignment>();

            foreach (var cls in classes)
            {
                var gradeSubjects = subjects.Where(s => s.GradeId == cls.GradeId).ToList();
                foreach (var subject in gradeSubjects)
                {
                    // Find teacher with matching specialization
                    var teacher = teachers.FirstOrDefault(t => subject.Name.StartsWith(t.Specialization));
                    if (teacher != null)
                    {
                        assignments.Add(TeachingAssignment.Create(teacher.TeacherId, cls.ClassId, subject.SubjectId, DateTime.UtcNow.Year));
                    }
                }
            }
            
            db.TeachingAssignments.AddRange(assignments);
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {assignments.Count} teaching assignments seeded.");
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
            var grades = await db.Grades.ToListAsync();

            var enrollments = new List<StudentClass>();

            foreach (var grade in grades)
            {
                var gradeStudents = students.Where(s => s.GradeId == grade.GradeId).ToList();
                var gradeClasses = classes.Where(c => c.GradeId == grade.GradeId).ToList();
                
                if (gradeClasses.Count == 0 || gradeStudents.Count == 0) continue;

                for (int i = 0; i < gradeStudents.Count; i++)
                {
                    // Divide students evenly among available classes in the grade
                    var targetClass = gradeClasses[i % gradeClasses.Count];
                    
                    var sc = StudentClass.Enroll(gradeStudents[i].StudentId, targetClass.ClassId, DateTime.UtcNow.Year, Masarak.Domain.Enums.EnrollmentType.FullClass);
                    enrollments.Add(sc);
                }
            }
            db.StudentClasses.AddRange(enrollments);
            await db.SaveChangesAsync();
            Console.WriteLine($"[Seeder] {enrollments.Count} student enrollments seeded (divided into classes).");
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
                    UserPromptTemplate = "Analyze this student's performance data and return JSON.\nStudent context: {student_context_json}\nReturn ONLY valid JSON matching this schema: {schema}\nIdentify weak lessons, strong lessons, topics where the student makes errors, and provide 3 specific personalized recommendations referencing lesson names in {language}.",
                    MaxTokens = 1000,
                    Temperature = 0.3m,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = "system"
                },
                new AiPromptTemplate
                {
                    Key = "parent_report",
                    SystemPrompt = "You are a student academic advisor writing a monthly report for an Egyptian parent. Be encouraging, clear, and specific. Write in {language}.",
                    UserPromptTemplate = "Student: {student_name}, Report month: {month}. Subject: {subject_name}. Analysis context: {analysis_context_json}. Write a 100-word narrative summary of the student's performance in this specific subject for the parent.",
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
