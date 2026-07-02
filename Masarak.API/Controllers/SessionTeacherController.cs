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
    /// Teacher endpoints for viewing assignments and managing sessions.
    /// </summary>
    [ApiController]
    [Route("api/teacher")]
    [Authorize(Policy = AppPolicies.TeacherOnly)]
    [Produces("application/json")]
    public class SessionTeacherController : ControllerBase
    {
        private readonly ISessionService _sessionService;
        private readonly IAcademicService _academicService;

        public SessionTeacherController(ISessionService sessionService, IAcademicService academicService)
        {
            _sessionService = sessionService;
            _academicService = academicService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        [HttpGet("assignments")]
        [ProducesResponseType(typeof(IEnumerable<TeachingAssignmentDto>), 200)]
        public async Task<IActionResult> GetMyAssignments(
            [FromQuery] int? academicYear, CancellationToken ct)
        {
            var year = academicYear ?? AcademicYear.Current().Year;
            try
            {
                var assignments = await _sessionService.GetTeacherAssignmentsAsync(GetUserId(), year, ct);
                return Ok(assignments);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet("teaching-assignments/{taId}/students")]
        [ProducesResponseType(typeof(IEnumerable<StudentInClassDto>), 200)]
        public async Task<IActionResult> GetStudentsForTeachingAssignment(int taId, CancellationToken ct)
        {
            try
            {
                var students = await _academicService.GetStudentsByTeachingAssignmentAsync(GetUserId(), taId, ct);
                return Ok(students);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        [HttpPost("sessions")]
        [ProducesResponseType(typeof(SessionDto), 201)]
        public async Task<IActionResult> ScheduleSession([FromBody] ScheduleSessionRequest request, CancellationToken ct)
        {
            try
            {
                var session = await _sessionService.ScheduleSessionAsync(GetUserId(), request, ct);
                return Created("", session);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpPut("sessions/{id}")]
        [ProducesResponseType(typeof(SessionDto), 200)]
        public async Task<IActionResult> UpdateSession(int id, [FromBody] UpdateSessionRequest request, CancellationToken ct)
        {
            try
            {
                var session = await _sessionService.UpdateSessionAsync(GetUserId(), id, request, ct);
                return Ok(session);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpDelete("sessions/{id}")]
        public async Task<IActionResult> CancelSession(int id, CancellationToken ct)
        {
            try
            {
                await _sessionService.CancelSessionAsync(GetUserId(), id, ct);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        [HttpPost("sessions/{id}/start")]
        public async Task<IActionResult> StartSession(int id, CancellationToken ct)
        {
            try
            {
                await _sessionService.StartSessionAsync(GetUserId(), id, ct);
                return Ok();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        [HttpPost("sessions/{id}/complete")]
        public async Task<IActionResult> CompleteSession(int id, CancellationToken ct)
        {
            try
            {
                await _sessionService.CompleteSessionAsync(GetUserId(), id, ct);
                return Ok();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        [HttpGet("sessions")]
        [ProducesResponseType(typeof(IEnumerable<SessionDto>), 200)]
        public async Task<IActionResult> GetMySessions(
            [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        {
            try
            {
                var sessions = await _sessionService.GetTeacherSessionsAsync(GetUserId(), from, to, ct);
                return Ok(sessions);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }
    }
}
