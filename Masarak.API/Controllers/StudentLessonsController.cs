using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarak.API.Controllers
{
    [ApiController]
    [Route("api/student/lessons")]
    [Authorize(Policy = AppPolicies.StudentOnly)]
    public class StudentLessonsController : ControllerBase
    {
        private readonly IStudentLessonService _lessonService;

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        public StudentLessonsController(IStudentLessonService lessonService)
        {
            _lessonService = lessonService;
        }

        [HttpGet("subjects/{subjectId}")]
        public async Task<IActionResult> GetStudentLessons(int subjectId, CancellationToken ct)
        {
            var result = await _lessonService.GetStudentLessonsAsync(GetUserId(), subjectId, ct);
            return Ok(result);
        }

        [HttpGet("{lessonId}")]
        public async Task<IActionResult> GetStudentLessonDetail(int lessonId, CancellationToken ct)
        {
            var result = await _lessonService.GetStudentLessonDetailAsync(GetUserId(), lessonId, ct);
            return Ok(result);
        }
    }
}
