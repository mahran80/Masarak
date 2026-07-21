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
    /// Phase 4: Student attendance endpoint — record presence when joining a session.
    /// </summary>
    [ApiController]
    [Route("api/student")]
    [Authorize(Policy = AppPolicies.StudentOnly)]
    [Produces("application/json")]
    public class StudentAttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public StudentAttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        /// <summary>
        /// Student joins a live session — records Present attendance.
        /// Idempotent: if already recorded, returns existing record.
        /// </summary>
        [HttpPost("sessions/{sessionId}/join")]
        [ProducesResponseType(typeof(AttendanceDto), 200)]
        [ProducesResponseType(409)]
        public async Task<IActionResult> JoinSession(int sessionId, CancellationToken ct)
        {
            try
            {
                var attendance = await _attendanceService.RecordAttendanceAsync(GetUserId(), sessionId, ct);
                return Ok(attendance);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        /// <summary>
        /// Gets student's own attendance summary per subject.
        /// </summary>
        [HttpGet("attendance")]
        [ProducesResponseType(typeof(IEnumerable<SubjectAttendanceDto>), 200)]
        public async Task<IActionResult> GetMyAttendance([FromQuery] int? academicYear, CancellationToken ct)
        {
            var year = academicYear ?? AcademicYear.Current().Year;
            try
            {
                var result = await _attendanceService.GetStudentAttendanceAsync(GetUserId(), year, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }
    }

    /// <summary>
    /// Phase 4: Teacher attendance endpoints — view roster and override records.
    /// </summary>
    [ApiController]
    [Route("api/teacher")]
    [Authorize(Policy = AppPolicies.TeacherOnly)]
    [Produces("application/json")]
    public class TeacherAttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public TeacherAttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        /// <summary>
        /// Gets attendance roster for a specific session.
        /// </summary>
        [HttpGet("sessions/{sessionId}/attendance")]
        [ProducesResponseType(typeof(SessionAttendanceDto), 200)]
        public async Task<IActionResult> GetSessionAttendance(int sessionId, CancellationToken ct)
        {
            try
            {
                var result = await _attendanceService.GetSessionAttendanceAsync(GetUserId(), sessionId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        /// <summary>
        /// Teacher overrides an attendance record (e.g., mark absent as Excused).
        /// </summary>
        [HttpPut("attendance/{attendanceId}/override")]
        [ProducesResponseType(typeof(AttendanceDto), 200)]
        public async Task<IActionResult> OverrideAttendance(int attendanceId, [FromBody] OverrideAttendanceRequest request, CancellationToken ct)
        {
            try
            {
                var result = await _attendanceService.OverrideAttendanceAsync(
                    GetUserId(), attendanceId, request.NewStatus, request.Note, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }
    }

    /// <summary>
    /// Phase 4: Parent attendance endpoint — view linked child's attendance.
    /// </summary>
    [ApiController]
    [Route("api/parent")]
    [Authorize(Policy = AppPolicies.ParentOnly)]
    [Produces("application/json")]
    public class ParentAttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;

        public ParentAttendanceController(IAttendanceService attendanceService)
        {
            _attendanceService = attendanceService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        /// <summary>
        /// Gets attendance summary for a linked child.
        /// </summary>
        [HttpGet("children/{studentId}/attendance")]
        [ProducesResponseType(typeof(IEnumerable<SubjectAttendanceDto>), 200)]
        public async Task<IActionResult> GetChildAttendance(int studentId, [FromQuery] int? academicYear, CancellationToken ct)
        {
            var year = academicYear ?? AcademicYear.Current().Year;
            try
            {
                var result = await _attendanceService.GetStudentAttendanceForParentAsync(GetUserId(), studentId, year, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }
    }
}
