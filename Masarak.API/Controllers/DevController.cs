using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Masarak.Domain.Constants;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Application.Interfaces;
using Masarak.Infrastructure.Persistence;
using Masarak.Infrastructure.Services;

namespace Masarak.API.Controllers
{
    [ApiController]
    [Route("api/dev")]
    public class DevController : ControllerBase
    {
        private readonly Context _db;
        private readonly IPasswordService _pwd;

        public DevController(Context db, IPasswordService pwd)
        {
            _db = db;
            _pwd = pwd;
        }

        [HttpPost("seed-massive")]
        public async Task<IActionResult> SeedMassive([FromQuery] int teachersPerCategory = 15, [FromQuery] int daysToSeed = 180)
        {
            // 1. Create missing teachers
            var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Teacher);
            if (role == null) return BadRequest("Teacher role not found.");

            var categories = await _db.SubjectCategories.ToListAsync();
            
            var firstNames = new[] { "أحمد", "محمد", "محمود", "علي", "مصطفى", "فاطمة", "منى", "سارة" };
            var lastNames = new[] { "سعيد", "عبدالله", "يوسف", "حسن", "سليمان", "منصور", "عثمان" };
            var rnd = new Random();

            int tIndex = await _db.Teachers.CountAsync() + 1;
            
            foreach (var cat in categories)
            {
                int currentCount = await _db.Set<TeacherSubject>().CountAsync(ts => ts.SubjectCategoryId == cat.SubjectCategoryId);
                for (int i = currentCount; i < teachersPerCategory; i++)
                {
                    var user = new User { RoleId = role.RoleId, FullName = $"{firstNames[rnd.Next(firstNames.Length)]} {lastNames[rnd.Next(lastNames.Length)]}", Email = $"teacher.m.{tIndex}@masarak.com", PasswordHash = _pwd.HashPassword("Teacher@123!"), Country = "EG", CreatedAt = DateTime.UtcNow, IsActive = true, EmailConfirmed = true };
                    _db.Users.Add(user);
                    await _db.SaveChangesAsync();

                    var teacher = new Teacher { UserId = user.UserId, Specialization = cat.Name, Bio = "Massive Seeder", HiringDate = DateTime.UtcNow };
                    _db.Teachers.Add(teacher);
                    await _db.SaveChangesAsync();

                    _db.Set<TeacherSubject>().Add(new TeacherSubject { TeacherId = teacher.TeacherId, SubjectCategoryId = cat.SubjectCategoryId });
                    await _db.SaveChangesAsync();
                    tIndex++;
                }
            }

            // 2. Ensure every class has a teaching assignment for every subject
            var classes = await _db.Classes.ToListAsync();
            var subjects = await _db.Subjects.ToListAsync();
            var teachers = await _db.Teachers.Include(t => t.TeacherSubjects).ToListAsync();

            foreach (var cls in classes)
            {
                var classSubjects = subjects.Where(s => s.GradeId == cls.GradeId).ToList();
                foreach (var sub in classSubjects)
                {
                    bool exists = await _db.TeachingAssignments.AnyAsync(ta => ta.ClassId == cls.ClassId && ta.SubjectId == sub.SubjectId);
                    if (!exists)
                    {
                        var availableTeachers = teachers.Where(t => t.TeacherSubjects.Any(ts => ts.SubjectCategoryId == sub.SubjectCategoryId)).ToList();
                        if (availableTeachers.Any())
                        {
                            var teacher = availableTeachers[rnd.Next(availableTeachers.Count)];
                            _db.TeachingAssignments.Add(TeachingAssignment.Create(teacher.TeacherId, cls.ClassId, sub.SubjectId, DateTime.UtcNow.Year));
                        }
                    }
                }
            }
            await _db.SaveChangesAsync();

            // 3. Generate sessions using a Weekly Timetable template
            var tas = await _db.TeachingAssignments.ToListAsync();
            var sessionsToAdd = new List<Session>();

            var timeSlots = new[] { new TimeSpan(7, 0, 0), new TimeSpan(8, 30, 0), new TimeSpan(10, 0, 0), new TimeSpan(11, 30, 0), new TimeSpan(13, 0, 0) };
            
            // Build the Weekly Timetable (5 days, 5 slots per day)
            var classTimetable = new Dictionary<int, TeachingAssignment[,]>(); 
            var teacherTimetable = new Dictionary<int, TeachingAssignment[,]>(); 
            
            foreach(var cls in classes) {
                classTimetable[cls.ClassId] = new TeachingAssignment[5, 5];
            }
            foreach(var t in teachers) {
                teacherTimetable[t.TeacherId] = new TeachingAssignment[5, 5];
            }

            foreach (var cls in classes)
            {
                var classTas = tas.Where(ta => ta.ClassId == cls.ClassId).ToList();
                if (!classTas.Any()) continue;

                var tasToAssign = new List<TeachingAssignment>();
                while(tasToAssign.Count < 25)
                {
                    foreach(var ta in classTas.OrderBy(x => rnd.Next()))
                    {
                        if (tasToAssign.Count < 25) tasToAssign.Add(ta);
                    }
                }

                foreach (var ta in tasToAssign)
                {
                    var allSlots = new List<(int day, int slot)>();
                    for (int d = 0; d < 5; d++)
                        for (int s = 0; s < 5; s++)
                            allSlots.Add((d, s));
                            
                    foreach(var pos in allSlots.OrderBy(x => rnd.Next()))
                    {
                        if (classTimetable[cls.ClassId][pos.day, pos.slot] == null &&
                            teacherTimetable[ta.TeacherId][pos.day, pos.slot] == null)
                        {
                            classTimetable[cls.ClassId][pos.day, pos.slot] = ta;
                            teacherTimetable[ta.TeacherId][pos.day, pos.slot] = ta;
                            break;
                        }
                    }
                }
            }

            // Apply Timetable across all days
            var startDate = DateTime.UtcNow.Date;
            while (startDate.DayOfWeek != DayOfWeek.Sunday) startDate = startDate.AddDays(-1);

            for (int i = 0; i < daysToSeed; i++)
            {
                var date = startDate.AddDays(i);
                if (date.DayOfWeek == DayOfWeek.Friday || date.DayOfWeek == DayOfWeek.Saturday) continue;

                int dayIndex = (int)date.DayOfWeek; // Sunday=0 ... Thursday=4

                foreach (var cls in classes)
                {
                    for (int slot = 0; slot < 5; slot++)
                    {
                        var ta = classTimetable[cls.ClassId][dayIndex, slot];
                        if (ta != null)
                        {
                            var sessionDate = date.Add(timeSlots[slot]);
                            bool sessionExists = await _db.Sessions.AnyAsync(s => s.ClassId == ta.ClassId && s.ScheduledAt == sessionDate);
                            
                            if (!sessionExists)
                            {
                                sessionsToAdd.Add(new Session
                                {
                                    AssignmentId = ta.AssignmentId,
                                    ClassId = ta.ClassId,
                                    Title = $"Session {date:MMM dd}",
                                    ScheduledAt = sessionDate,
                                    DurationMinutes = 60,
                                    Status = SessionStatus.Scheduled,
                                    CreatedAt = DateTime.UtcNow
                                });
                            }
                        }
                    }
                }
            }

            if (sessionsToAdd.Any())
            {
                for(int i = 0; i < sessionsToAdd.Count; i += 1000)
                {
                    await _db.Sessions.AddRangeAsync(sessionsToAdd.Skip(i).Take(1000));
                    await _db.SaveChangesAsync();
                }
            }

            return Ok(new { Message = $"Successfully seeded {sessionsToAdd.Count} massive scheduled sessions across 12 subjects, all classes, and {daysToSeed} days." });
        }

        [HttpDelete("clean-junk")]
        public async Task<IActionResult> CleanJunk()
        {
            await _db.Attendances.ExecuteDeleteAsync();
            await _db.Submissions.ExecuteDeleteAsync();
            await _db.StudentAnswers.ExecuteDeleteAsync();
            await _db.Set<QuestionOption>().ExecuteDeleteAsync();
            await _db.Questions.ExecuteDeleteAsync();
            await _db.Set<StudentExam>().ExecuteDeleteAsync();
            await _db.Exams.ExecuteDeleteAsync();
            await _db.Assignments.ExecuteDeleteAsync();
            await _db.Sessions.ExecuteDeleteAsync();
            await _db.Set<TeacherSubject>().ExecuteDeleteAsync();
            await _db.TeachingAssignments.ExecuteDeleteAsync();
            await _db.Teachers.ExecuteDeleteAsync();
            await _db.Users.Where(u => u.Email.StartsWith("teacher.") || u.Email.StartsWith("mock")).ExecuteDeleteAsync();

            return Ok(new { Message = "Successfully wiped all junk Teachers, Assignments, and Sessions." });
        }
    }
}