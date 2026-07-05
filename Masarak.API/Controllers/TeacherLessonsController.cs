using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarak.API.Controllers
{
    [ApiController]
    [Route("api/teacher/lessons")]
    [Authorize(Policy = AppPolicies.TeacherOnly)]
    public class TeacherLessonsController : ControllerBase
    {
        private readonly ITeacherLessonService _lessonService;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        public TeacherLessonsController(ITeacherLessonService lessonService)
        {
            _lessonService = lessonService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateLesson([FromBody] CreateLessonRequest request, CancellationToken ct)
        {
            var result = await _lessonService.CreateLessonAsync(GetUserId(), request, ct);
            return CreatedAtAction(nameof(GetLessonDetail), new { lessonId = result.LessonId }, result);
        }

        [HttpPut("{lessonId}")]
        public async Task<IActionResult> UpdateLesson(int lessonId, [FromBody] UpdateLessonRequest request, CancellationToken ct)
        {
            var result = await _lessonService.UpdateLessonAsync(GetUserId(), lessonId, request, ct);
            return Ok(result);
        }

        [HttpDelete("{lessonId}")]
        public async Task<IActionResult> DeleteLesson(int lessonId, CancellationToken ct)
        {
            await _lessonService.DeleteLessonAsync(GetUserId(), lessonId, ct);
            return NoContent();
        }

        [HttpGet("teaching-assignments/{taId}")]
        public async Task<IActionResult> GetTeacherLessons(int taId, CancellationToken ct)
        {
            var result = await _lessonService.GetTeacherLessonsAsync(GetUserId(), taId, ct);
            return Ok(result);
        }

        [HttpGet("{lessonId}")]
        public async Task<IActionResult> GetLessonDetail(int lessonId, CancellationToken ct)
        {
            var result = await _lessonService.GetTeacherLessonDetailAsync(GetUserId(), lessonId, ct);
            return Ok(result);
        }

        [HttpPost("{lessonId}/publish")]
        public async Task<IActionResult> PublishLesson(int lessonId, CancellationToken ct)
        {
            await _lessonService.PublishLessonAsync(GetUserId(), lessonId, ct);
            return Ok(new { message = "Lesson published successfully." });
        }

        [HttpPut("teaching-assignments/{taId}/reorder")]
        public async Task<IActionResult> ReorderLessons(int taId, [FromBody] ReorderLessonsRequest request, CancellationToken ct)
        {
            await _lessonService.ReorderLessonsAsync(GetUserId(), taId, request, ct);
            return NoContent();
        }

        [HttpPost("{lessonId}/clone")]
        public async Task<IActionResult> CloneLesson(int lessonId, [FromBody] CloneLessonRequest request, CancellationToken ct)
        {
            await _lessonService.CloneLessonAsync(GetUserId(), lessonId, request, ct);
            return Ok(new { message = "Lesson cloned successfully to target classes." });
        }

        // Attach/Detach endpoints

        [HttpPost("{lessonId}/attach-content/{contentItemId}")]
        public async Task<IActionResult> AttachContent(int lessonId, int contentItemId, CancellationToken ct)
        {
            await _lessonService.AttachContentToLessonAsync(GetUserId(), lessonId, contentItemId, ct);
            return NoContent();
        }

        [HttpDelete("detach-content/{contentItemId}")]
        public async Task<IActionResult> DetachContent(int contentItemId, CancellationToken ct)
        {
            await _lessonService.DetachContentFromLessonAsync(GetUserId(), contentItemId, ct);
            return NoContent();
        }

        [HttpPost("{lessonId}/attach-exam/{examId}")]
        public async Task<IActionResult> AttachExam(int lessonId, int examId, CancellationToken ct)
        {
            await _lessonService.AttachExamToLessonAsync(GetUserId(), lessonId, examId, ct);
            return NoContent();
        }

        [HttpDelete("detach-exam/{examId}")]
        public async Task<IActionResult> DetachExam(int examId, CancellationToken ct)
        {
            await _lessonService.DetachExamFromLessonAsync(GetUserId(), examId, ct);
            return NoContent();
        }

        [HttpPost("{lessonId}/attach-assignment/{assignmentId}")]
        public async Task<IActionResult> AttachAssignment(int lessonId, int assignmentId, CancellationToken ct)
        {
            await _lessonService.AttachAssignmentToLessonAsync(GetUserId(), lessonId, assignmentId, ct);
            return NoContent();
        }

        [HttpDelete("detach-assignment/{assignmentId}")]
        public async Task<IActionResult> DetachAssignment(int assignmentId, CancellationToken ct)
        {
            await _lessonService.DetachAssignmentFromLessonAsync(GetUserId(), assignmentId, ct);
            return NoContent();
        }
    }
}
