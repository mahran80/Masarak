using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.API.Policies;
using Masarak.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Masarak.API.Controllers
{
    [ApiController]
    [Route("api/teacher/dashboard")]
    [Authorize(Policy = AppPolicies.TeacherOnly)]
    public class TeacherDashboardController : ControllerBase
    {
        private readonly Context _context;

        public TeacherDashboardController(Context context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid")!);

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats(CancellationToken ct)
        {
            var userId = GetUserId();
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct);
            if (teacher == null) return Forbid();

            var teachingAssignments = await _context.TeachingAssignments
                .Where(ta => ta.TeacherId == teacher.TeacherId && ta.IsActive)
                .Select(ta => new { ta.AssignmentId, ta.ClassId, ta.SubjectId })
                .ToListAsync(ct);

            var assignmentIds = teachingAssignments.Select(ta => ta.AssignmentId).ToList();
            var classIds = teachingAssignments.Select(ta => ta.ClassId).Distinct().ToList();
            var subjectIds = teachingAssignments.Select(ta => ta.SubjectId).Distinct().ToList();

            var totalStudents = classIds.Count == 0
                ? 0
                : await _context.StudentClasses
                    .Where(sc => sc.IsActive && classIds.Contains(sc.ClassId))
                    .Select(sc => sc.StudentId)
                    .Distinct()
                    .CountAsync(ct);

            var pendingSubmissions = assignmentIds.Count == 0
                ? 0
                : await _context.Submissions.CountAsync(s =>
                    assignmentIds.Contains(s.Assignment.AssignmentRef) &&
                    s.Status == Masarak.Domain.Enums.SubmissionStatus.Submitted, ct);

            var pendingExamAnswers = assignmentIds.Count == 0
                ? 0
                : await _context.StudentExams.CountAsync(se =>
                    assignmentIds.Contains(se.Exam.AssignmentId) && se.HasPendingManualGrading, ct);

            var performanceRows = classIds.Count == 0 || subjectIds.Count == 0
                ? new List<decimal>()
                : await _context.StudentPerformances
                    .Where(p => p.ClassId.HasValue && classIds.Contains(p.ClassId.Value) && subjectIds.Contains(p.SubjectId))
                    .Select(p => p.FinalGrade ?? ((p.AvgExam + p.AvgAssignment + p.AttendanceRate) / 3m))
                    .ToListAsync(ct);
            var averagePerformance = performanceRows.Count == 0 ? 0m : Math.Round(performanceRows.Average(), 1);

            var attendanceRows = assignmentIds.Count == 0
                ? new List<Masarak.Domain.Enums.AttendanceStatus>()
                : await _context.Attendances
                    .Where(a => assignmentIds.Contains(a.Session.AssignmentId) && a.RecordedAt >= DateTime.UtcNow.AddDays(-30))
                    .Select(a => a.Status)
                    .ToListAsync(ct);
            var present = attendanceRows.Count(s => s == Masarak.Domain.Enums.AttendanceStatus.Present);
            var absent = attendanceRows.Count(s => s == Masarak.Domain.Enums.AttendanceStatus.Absent);
            var excused = attendanceRows.Count(s => s == Masarak.Domain.Enums.AttendanceStatus.Excused);
            var attendanceRate = attendanceRows.Count == 0
                ? 0m
                : Math.Round((decimal)present / attendanceRows.Count * 100m, 1);

            var publishedAssignments = assignmentIds.Count == 0
                ? 0
                : await _context.Assignments.CountAsync(a =>
                    assignmentIds.Contains(a.AssignmentRef) &&
                    a.Status == Masarak.Domain.Enums.AssignmentStatus.Published, ct);
            var publishedExams = assignmentIds.Count == 0
                ? 0
                : await _context.Exams.CountAsync(e =>
                    assignmentIds.Contains(e.AssignmentId) &&
                    e.Status == Masarak.Domain.Enums.ExamStatus.Published, ct);

            return Ok(new TeacherDashboardStatsDto
            {
                TotalStudents = totalStudents,
                ActiveCourses = subjectIds.Count,
                ActiveClasses = classIds.Count,
                AssignmentsToGrade = pendingSubmissions + pendingExamAnswers,
                PublishedAssignments = publishedAssignments,
                PublishedExams = publishedExams,
                AveragePerformance = averagePerformance,
                AttendancePresent = present,
                AttendanceAbsent = absent,
                AttendanceExcused = excused,
                TotalAttendanceRecords = attendanceRows.Count,
                AttendanceRate = attendanceRate
            });
        }
        [HttpGet("activities")]
        public async Task<IActionResult> GetActivities(CancellationToken ct)
        {
            var userId = GetUserId();
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct);
            if (teacher == null) return Forbid();

            var assignmentIds = await _context.TeachingAssignments
                .Where(ta => ta.TeacherId == teacher.TeacherId && ta.IsActive)
                .Select(ta => ta.AssignmentId)
                .ToListAsync(ct);
            if (assignmentIds.Count == 0) return Ok(Array.Empty<TeacherActivityDto>());

            var submissions = await _context.Submissions
                .Where(s => assignmentIds.Contains(s.Assignment.AssignmentRef))
                .OrderByDescending(s => s.SubmittedAt)
                .Take(6)
                .Select(s => new
                {
                    s.SubmittedAt,
                    StudentName = s.Student.User.FullName,
                    AssignmentTitle = s.Assignment.Title,
                    s.Status
                })
                .ToListAsync(ct);

            var sessions = await _context.Sessions
                .Where(s => assignmentIds.Contains(s.AssignmentId) && s.ScheduledAt >= DateTime.UtcNow.AddDays(-7))
                .OrderByDescending(s => s.ScheduledAt)
                .Take(4)
                .Select(s => new { s.Title, s.ScheduledAt, s.Status })
                .ToListAsync(ct);

            var activities = new List<TeacherActivityDto>();
            activities.AddRange(submissions.Select(s => new TeacherActivityDto
            {
                Title = s.Status == Masarak.Domain.Enums.SubmissionStatus.Graded
                    ? $"تم تصحيح واجب {s.AssignmentTitle} للطالب {s.StudentName}"
                    : $"سلّم {s.StudentName} واجب {s.AssignmentTitle}",
                Time = FormatRelativeTime(s.SubmittedAt),
                OccurredAt = s.SubmittedAt,
                Type = s.Status == Masarak.Domain.Enums.SubmissionStatus.Graded ? "graded" : "submission",
                Icon = s.Status == Masarak.Domain.Enums.SubmissionStatus.Graded ? "check-circle" : "clipboard-document",
                Color = s.Status == Masarak.Domain.Enums.SubmissionStatus.Graded
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-blue-100 text-blue-600"
            }));
            activities.AddRange(sessions.Select(s => new TeacherActivityDto
            {
                Title = s.Status == Masarak.Domain.Enums.SessionStatus.Completed
                    ? $"اكتملت حصة {s.Title}"
                    : $"حصة قادمة: {s.Title}",
                Time = FormatRelativeTime(s.ScheduledAt),
                OccurredAt = s.ScheduledAt,
                Type = "session",
                Icon = "calendar",
                Color = "bg-violet-100 text-violet-600"
            }));

            return Ok(activities
                .OrderByDescending(a => a.OccurredAt)
                .Take(8));
        }

        private static string FormatRelativeTime(DateTime value)
        {
            var utcValue = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
            var difference = DateTime.UtcNow - utcValue;
            if (difference.TotalMinutes < -1) return $"خلال {Math.Ceiling(-difference.TotalHours)} ساعة";
            if (difference.TotalMinutes < 1) return "الآن";
            if (difference.TotalMinutes < 60) return $"منذ {(int)difference.TotalMinutes} دقيقة";
            if (difference.TotalHours < 24) return $"منذ {(int)difference.TotalHours} ساعة";
            if (difference.TotalDays < 7) return $"منذ {(int)difference.TotalDays} يوم";
            return value.ToString("yyyy/MM/dd");
        }
        [HttpGet("charts/performance")]
        public async Task<IActionResult> GetPerformanceChart(CancellationToken ct)
        {
            return Ok(new TeacherChartDataDto
            {
                Labels = new[] { "الأسبوع 1", "الأسبوع 2", "الأسبوع 3", "الأسبوع 4", "الأسبوع 5", "الأسبوع 6" },
                Datasets = new[]
                {
                    new ChartDatasetDto
                    {
                        Label = "متوسط الدرجات",
                        Data = new[] { 75m, 78m, 82m, 80m, 85m, 88m },
                        BorderColor = "#4F8CD4",
                        BackgroundColor = "rgba(79, 140, 212, 0.1)",
                        Fill = true,
                        Tension = 0.4m
                    }
                }
            });
        }

        [HttpGet("charts/attendance")]
        public async Task<IActionResult> GetAttendanceChart(CancellationToken ct)
        {
            return Ok(new TeacherChartDataDto
            {
                Labels = new[] { "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس" },
                Datasets = new[]
                {
                    new ChartDatasetDto
                    {
                        Label = "الحضور",
                        Data = new[] { 95m, 92m, 88m, 96m, 90m },
                        BorderColor = "#10B981",
                        BackgroundColor = "rgba(16, 185, 129, 0.1)",
                        Fill = true,
                        Tension = 0.4m
                    }
                }
            });
        }
        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions(CancellationToken ct)
        {
            var userId = GetUserId();
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct);
            if (teacher == null) return Forbid();

            var assignments = await _context.TeachingAssignments
                .Where(ta => ta.TeacherId == teacher.TeacherId)
                .Select(ta => ta.AssignmentId)
                .ToListAsync(ct);

            var sessions = await _context.Sessions
                .Where(s => assignments.Contains(s.AssignmentId) && s.ScheduledAt >= DateTime.UtcNow.AddDays(-1))
                .OrderBy(s => s.ScheduledAt)
                .Take(5)
                .Select(s => new
                {
                    s.SessionId,
                    s.Title,
                    s.ScheduledAt,
                    s.DurationMinutes,
                    s.Status,
                    s.EmbedUrl
                })
                .ToListAsync(ct);

            return Ok(sessions);
        }
    }
}
