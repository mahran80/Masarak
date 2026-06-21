using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.ValueObjects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Public/authenticated curriculum browsing: grades and subjects (read-only).
    /// </summary>
    [ApiController]
    [Route("api/grades")]
    [Authorize]
    [Produces("application/json")]
    public class CurriculumController : ControllerBase
    {
        private readonly IAcademicService _academicService;

        public CurriculumController(IAcademicService academicService)
        {
            _academicService = academicService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<GradeDto>), 200)]
        public async Task<IActionResult> GetAllGrades(CancellationToken ct)
        {
            var grades = await _academicService.GetAllGradesAsync(ct);
            return Ok(grades);
        }

        [HttpGet("{gradeId}")]
        [ProducesResponseType(typeof(GradeDetailDto), 200)]
        public async Task<IActionResult> GetGradeWithDetails(int gradeId, [FromQuery] int? academicYear, CancellationToken ct)
        {
            try
            {
                var detail = await _academicService.GetGradeWithDetailsAsync(gradeId, academicYear, ct);
                return Ok(detail);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }
    }
}
