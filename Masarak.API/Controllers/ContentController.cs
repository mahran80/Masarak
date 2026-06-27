using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Phase 4: Teacher content management — upload URL/file, view/delete content.
    /// </summary>
    [ApiController]
    [Route("api/teacher/content")]
    [Authorize(Policy = AppPolicies.TeacherOnly)]
    [Produces("application/json")]
    public class TeacherContentController : ControllerBase
    {
        private readonly IContentService _contentService;

        public TeacherContentController(IContentService contentService)
        {
            _contentService = contentService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        /// <summary>
        /// Upload a URL-based content item (YouTube/Vimeo).
        /// </summary>
        [HttpPost("url")]
        [ProducesResponseType(typeof(ContentItemDto), 201)]
        public async Task<IActionResult> UploadContentUrl([FromBody] UploadContentUrlRequest request, CancellationToken ct)
        {
            try
            {
                var result = await _contentService.UploadContentUrlAsync(GetUserId(), request, ct);
                return Created("", result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>
        /// Upload a file-based content item (PDF, Notes, ExerciseSheet, Video) via multipart form.
        /// </summary>
        [HttpPost("file")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(ContentItemDto), 201)]
        [RequestSizeLimit(500 * 1024 * 1024)] // 500 MB max
        [EnableRateLimiting("FileUploadPolicy")]
        public async Task<IActionResult> UploadContentFile(
            IFormFile file,
            [FromForm] int teachingAssignmentId,
            [FromForm] int? sessionId,
            [FromForm] ContentType type,
            [FromForm] string title,
            [FromForm] string? description,
            CancellationToken ct)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File is required." });

            try
            {
                using var stream = file.OpenReadStream();
                var result = await _contentService.UploadContentFileAsync(
                    GetUserId(), teachingAssignmentId, sessionId,
                    type, title, description, stream, file.FileName, ct);
                return Created("", result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>
        /// Gets all content for a specific teaching assignment.
        /// </summary>
        [HttpGet("{taId}")]
        [ProducesResponseType(typeof(IEnumerable<ContentItemDto>), 200)]
        public async Task<IActionResult> GetTeacherContent(int taId, CancellationToken ct)
        {
            try
            {
                var result = await _contentService.GetTeacherContentAsync(GetUserId(), taId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        /// <summary>
        /// Deletes (deactivates) a content item. Teacher can delete own, admin can delete any.
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Policy = AppPolicies.AdminOrTeacher)]
        public async Task<IActionResult> DeleteContent(int id, CancellationToken ct)
        {
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
            try
            {
                await _contentService.DeleteContentItemAsync(GetUserId(), role, id, ct);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }
    }

    /// <summary>
    /// Phase 4: Student content browsing — view content for enrolled subjects.
    /// </summary>
    [ApiController]
    [Route("api/student/content")]
    [Authorize(Policy = AppPolicies.StudentOnly)]
    [Produces("application/json")]
    public class StudentContentController : ControllerBase
    {
        private readonly IContentService _contentService;

        public StudentContentController(IContentService contentService)
        {
            _contentService = contentService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        /// <summary>
        /// Browse content for a specific subject the student is enrolled in.
        /// </summary>
        [HttpGet("{subjectId}")]
        [ProducesResponseType(typeof(IEnumerable<ContentItemDto>), 200)]
        public async Task<IActionResult> GetSubjectContent(int subjectId, CancellationToken ct)
        {
            try
            {
                var result = await _contentService.GetContentForSubjectAsync(GetUserId(), subjectId, ct);
                return Ok(result);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }
    }

    /// <summary>
    /// Phase 4: Content download URL — for any authenticated user (verified server-side).
    /// </summary>
    [ApiController]
    [Route("api/content")]
    [Authorize(Policy = AppPolicies.AnyAuthenticated)]
    [Produces("application/json")]
    public class ContentDownloadController : ControllerBase
    {
        private readonly IContentService _contentService;

        public ContentDownloadController(IContentService contentService)
        {
            _contentService = contentService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");

        /// <summary>
        /// Gets a signed download URL for a content item.
        /// </summary>
        [HttpGet("{id}/download-url")]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<IActionResult> GetDownloadUrl(int id, CancellationToken ct)
        {
            try
            {
                var url = await _contentService.GetContentDownloadUrlAsync(GetUserId(), id, ct);
                return Ok(new { downloadUrl = url });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }
    }
}
