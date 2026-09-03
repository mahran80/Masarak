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

            // Count submissions pending grading for this teacher's teaching assignments
            var taIds = assignments.Select(ta => ta.AssignmentId).ToList();
            var pendingGrading = await _context.Submissions
                .Where(s => taIds.Contains(s.Assignment.AssignmentRef) && s.Status == Domain.Enums.SubmissionStatus.Submitted)
                .CountAsync(ct);


            // Compute real average performance from graded exams for this teacher's classes
            var avgPerformance = await _context.StudentExams
                .Where(se => taIds.Contains(se.Exam.AssignmentId)
                    && se.FinalScore.HasValue && se.Exam.TotalMarks > 0)
                .Select(se => (se.FinalScore!.Value / se.Exam.TotalMarks) * 100m)
                .DefaultIfEmpty(0m)
                .AverageAsync(ct);


            return Ok(new TeacherDashboardStatsDto
            {
                TotalStudents = totalStudents,
                ActiveCourses = assignments.Count,
                AssignmentsToGrade = pendingGrading,
                AveragePerformance = Math.Round(avgPerformance, 1)
            });

        }

        [HttpGet("activities")]
        public async Task<IActionResult> GetActivities(CancellationToken ct)
        {
            var userId = GetUserId();
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct);
            if (teacher == null) return Forbid();
            var taIds = await _context.TeachingAssignments
                .Where(ta => ta.TeacherId == teacher.TeacherId)
                .Select(ta => ta.AssignmentId)
                .ToListAsync(ct);

            var activities = new List<TeacherActivityDto>();

            // Recent submissions for this teacher's teaching assignments
            var recentSubmissions = await _context.Submissions
                .Where(s => taIds.Contains(s.Assignment.AssignmentRef))
                .OrderByDescending(s => s.SubmittedAt)
                .Take(3)
                .Select(s => new { s.Student.User.FullName, s.SubmittedAt, s.Assignment.Title })
                .ToListAsync(ct);


            foreach (var sub in recentSubmissions)
            {
                var timeAgo = GetTimeAgo(sub.SubmittedAt);
                activities.Add(new TeacherActivityDto
                {
                    Title = $"تسليم واجب \"{sub.Title}\" من {sub.FullName}",
                    Time = timeAgo,
                    Icon = "📝",
                    Color = "bg-blue-100 text-blue-600"
                });
            }

            // Recent completed sessions
            var recentSessions = await _context.Sessions
                .Where(s => taIds.Contains(s.AssignmentId) && s.Status == Domain.Enums.SessionStatus.Completed)
                .OrderByDescending(s => s.ScheduledAt)
                .Take(2)
                .Select(s => new { s.Title, s.ScheduledAt })
                .ToListAsync(ct);

            foreach (var session in recentSessions)
            {
                var timeAgo = GetTimeAgo(session.ScheduledAt);
                activities.Add(new TeacherActivityDto
                {
                    Title = $"تم إكمال حصة \"{session.Title}\"",
                    Time = timeAgo,
                    Icon = "✅",
                    Color = "bg-emerald-100 text-emerald-600"
                });
            }

            // If no activities found, show a helpful message
            if (!activities.Any())
            {
                activities.Add(new TeacherActivityDto
                {
                    Title = "لا توجد أنشطة حديثة",
                    Time = "الآن",
                    Icon = "📋",
                    Color = "bg-slate-100 text-slate-500"
                });
            }

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

        private static string GetTimeAgo(DateTime dateTime)
        {
            var diff = DateTime.UtcNow - dateTime;
            if (diff.TotalMinutes < 1) return "الآن";
            if (diff.TotalMinutes < 60) return $"منذ {(int)diff.TotalMinutes} دقيقة";
            if (diff.TotalHours < 24) return $"منذ {(int)diff.TotalHours} ساعة";
            if (diff.TotalDays < 2) return "أمس";
            if (diff.TotalDays < 7) return $"منذ {(int)diff.TotalDays} أيام";
            return dateTime.ToString("yyyy-MM-dd");
        }
    }
}
