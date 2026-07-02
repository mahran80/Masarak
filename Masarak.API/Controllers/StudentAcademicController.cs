using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.ValueObjects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Masarak.Infrastructure.Persistence;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Student endpoints: view enrolled class, courses, and weekly schedule.
    /// </summary>
    [ApiController]
    [Route("api/student")]
    [Authorize(Policy = AppPolicies.StudentOnly)]
    [Produces("application/json")]
    public class StudentAcademicController : ControllerBase
    {
        private readonly ISessionService _sessionService;
        private readonly Context _context;
        private readonly IAgoraTokenService _agoraTokenService;

        public StudentAcademicController(ISessionService sessionService, Context context, IAgoraTokenService agoraTokenService)
        {
            _sessionService = sessionService;
            _context = context;
            _agoraTokenService = agoraTokenService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        [HttpGet("my-class")]
        [ProducesResponseType(typeof(StudentEnrollmentDto), 200)]
        public async Task<IActionResult> GetMyClass([FromQuery] int? academicYear, CancellationToken ct)
        {
            var year = academicYear ?? AcademicYear.Current().Year;
            try
            {
                var enrollment = await _sessionService.GetStudentEnrollmentAsync(GetUserId(), year, ct);
                if (enrollment == null) return NotFound(new { message = "Not enrolled in any class for this academic year." });
                return Ok(enrollment);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet("courses")]
        [ProducesResponseType(typeof(IEnumerable<object>), 200)]
        public async Task<IActionResult> GetCourses([FromQuery] int? academicYear, CancellationToken ct)
        {
            var year = academicYear ?? AcademicYear.Current().Year;
            var userId = GetUserId();
            
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId, ct);
            if (student == null) return NotFound("Student not found.");

            var enrollment = await _context.StudentClasses
                .Include(sc => sc.Class).ThenInclude(c => c.Grade)
                .FirstOrDefaultAsync(sc => sc.StudentId == student.StudentId && sc.IsActive && sc.AcademicYear == year, ct);

            if (enrollment == null) return Ok(Array.Empty<object>());

            var courses = await _context.TeachingAssignments
                .Include(ta => ta.Subject)
                .Include(ta => ta.Teacher).ThenInclude(t => t.User)
                .Where(ta => ta.ClassId == enrollment.ClassId && ta.IsActive && ta.AcademicYear == year)
                .Select(ta => new
                {
                    SubjectId = ta.SubjectId,
                    SubjectName = ta.Subject.Name,
                    SubjectArabicName = ta.Subject.NameAr ?? ta.Subject.Name,
                    Description = ta.Subject.Description,
                    TeacherName = ta.Teacher.User.FullName,
                    GradeName = enrollment.Class.Grade.Name
                })
                .ToListAsync(ct);

            return Ok(courses);
        }

        [HttpGet("schedule")]
        [ProducesResponseType(typeof(WeeklyScheduleDto), 200)]
        public async Task<IActionResult> GetMySchedule(
            [FromQuery] DateTime? weekStart, [FromQuery] int? academicYear, CancellationToken ct)
        {
            var year = academicYear ?? AcademicYear.Current().Year;
            // Default to Monday of current week
            var start = weekStart ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek + (int)DayOfWeek.Monday);
            try
            {
                var schedule = await _sessionService.GetStudentScheduleAsync(GetUserId(), year, start, ct);
                return Ok(schedule);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet("sessions/{id}/token")]
        public IActionResult GetAgoraToken(int id)
        {
            // Note: In a real app, verify the student is allowed to join this session
            string channelName = id.ToString();
            string uid = GetUserId().ToString();
            string token = _agoraTokenService.GenerateRtcToken(channelName, uid, "subscriber");
            return Ok(new { token, channelName, uid });
        }
    }
}
