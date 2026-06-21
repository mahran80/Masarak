using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.ValueObjects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Student endpoints: view enrolled class and weekly schedule.
    /// </summary>
    [ApiController]
    [Route("api/student")]
    [Authorize(Policy = AppPolicies.StudentOnly)]
    [Produces("application/json")]
    public class StudentAcademicController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        public StudentAcademicController(ISessionService sessionService)
        {
            _sessionService = sessionService;
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
    }
}
