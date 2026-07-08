using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Administrator endpoints for full management of academic sessions.
    /// Phase 2 enhancements restrict Session creation/updating exclusively to Admins.
    /// </summary>
    [ApiController]
    [Route("api/admin/sessions")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    [Produces("application/json")]
    public class AdminSessionsController : ControllerBase
    {
        private readonly ISessionAdminService _sessionAdminService;

        public AdminSessionsController(ISessionAdminService sessionAdminService)
        {
            _sessionAdminService = sessionAdminService;
        }

        [HttpPost]
        [ProducesResponseType(typeof(IEnumerable<SessionDto>), 201)]
        public async Task<IActionResult> ScheduleSessionSeries([FromBody] AdminScheduleSessionRequest request, CancellationToken ct)
        {
            try
            {
                var createdSessions = await _sessionAdminService.ScheduleSessionSeriesAsync(request, ct);
                return Created("", createdSessions);
            }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpDelete("series/{seriesId}")]
        public async Task<IActionResult> CancelSessionSeries(Guid seriesId, CancellationToken ct)
        {
            try
            {
                await _sessionAdminService.CancelSessionSeriesAsync(seriesId, ct);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpDelete("{sessionId}")]
        public async Task<IActionResult> CancelSingleSession(int sessionId, CancellationToken ct)
        {
            try
            {
                await _sessionAdminService.CancelSingleSessionAsync(sessionId, ct);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet("class/{classId}")]
        [ProducesResponseType(typeof(IEnumerable<SessionDto>), 200)]
        public async Task<IActionResult> GetClassSchedule(
            int classId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        {
            var sessions = await _sessionAdminService.GetClassScheduleAsync(classId, from, to, ct);
            return Ok(sessions);
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<SessionDto>), 200)]
        public async Task<IActionResult> GetAllSessions(
            [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        {
            var sessions = await _sessionAdminService.GetAllScheduleAsync(from, to, ct);
            return Ok(sessions);
        }

        [HttpGet("teacher/{teacherId}")]
        [ProducesResponseType(typeof(IEnumerable<SessionDto>), 200)]
        public async Task<IActionResult> GetTeacherSchedule(
            int teacherId, [FromQuery] DateTime from, [FromQuery] DateTime to, CancellationToken ct)
        {
            var sessions = await _sessionAdminService.GetTeacherScheduleAsync(teacherId, from, to, ct);
            return Ok(sessions);
        }

        [HttpPut("{sessionId}/reactivate")]
        [ProducesResponseType(204)]
        [ProducesResponseType(404)]
        [ProducesResponseType(400)]
        public async Task<IActionResult> ReactivateSession(int sessionId, CancellationToken ct)
        {
            try
            {
                Console.WriteLine($"[Admin] ReactivateSession called for sessionId: {sessionId}");
                await _sessionAdminService.ReactivateSessionAsync(sessionId, ct);
                Console.WriteLine($"[Admin] ReactivateSession succeeded for sessionId: {sessionId}");
                return NoContent();
            }
            catch (KeyNotFoundException ex) { 
                Console.WriteLine($"[Admin] ReactivateSession KeyNotFound: {ex.Message}");
                return NotFound(new { message = ex.Message }); 
            }
            catch (InvalidOperationException ex) { 
                Console.WriteLine($"[Admin] ReactivateSession InvalidOp: {ex.Message}");
                return BadRequest(new { message = ex.Message }); 
            }
            catch (Exception ex) {
                Console.WriteLine($"[Admin] ReactivateSession Error: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }
    }
}
