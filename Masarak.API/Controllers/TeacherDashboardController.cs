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

            var assignments = await _context.TeachingAssignments
                .Where(ta => ta.TeacherId == teacher.TeacherId)
                .ToListAsync(ct);

            var classIds = assignments.Select(ta => ta.ClassId).Distinct().ToList();
            
            var totalStudents = await _context.StudentClasses
                .Where(sc => classIds.Contains(sc.ClassId))
                .CountAsync(ct);

            var assignmentsIds = assignments.Select(ta => ta.AssignmentId).ToList();

            var pendingGrading = await _context.Submissions
                .Where(s => assignmentsIds.Contains(s.AssignmentId) && s.Status == Domain.Enums.SubmissionStatus.Submitted)
                .CountAsync(ct);

            var avgPerformance = 85.5m; // Ideally calculated from StudentExams and Submissions

            return Ok(new TeacherDashboardStatsDto
            {
                TotalStudents = totalStudents,
                ActiveCourses = assignments.Count,
                AssignmentsToGrade = pendingGrading,
                AveragePerformance = avgPerformance
            });
        }

        [HttpGet("activities")]
        public async Task<IActionResult> GetActivities(CancellationToken ct)
        {
            var userId = GetUserId();
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct);
            if (teacher == null) return Forbid();

            var activities = new List<TeacherActivityDto>
            {
                new TeacherActivityDto { Title = "تم تسليم واجب جديد", Time = "منذ 10 دقائق", Icon = "📝", Color = "bg-blue-100 text-blue-600" },
                new TeacherActivityDto { Title = "رسالة جديدة من ولي أمر", Time = "منذ ساعة", Icon = "💬", Color = "bg-emerald-100 text-emerald-600" },
                new TeacherActivityDto { Title = "تم تقييم اختبار الرياضيات", Time = "امس", Icon = "✅", Color = "bg-amber-100 text-amber-600" }
            };

            return Ok(activities);
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
