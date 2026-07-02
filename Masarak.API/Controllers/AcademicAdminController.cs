using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Admin endpoints for academic management: grades, subjects, classes,
    /// teaching assignments, and student enrollment.
    /// </summary>
    [ApiController]
    [Route("api/admin")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    [Produces("application/json")]
    public class AcademicAdminController : ControllerBase
    {
        private readonly IAcademicService _academicService;

        public AcademicAdminController(IAcademicService academicService)
        {
            _academicService = academicService;
        }

  // ── Teachers ──────────────────────────────────────────────────────────

        [HttpGet("teachers")]
        [ProducesResponseType(typeof(IEnumerable<TeacherDto>), 200)]
        public async Task<IActionResult> GetTeachers(
            [FromServices] IAdminUserService adminUserService, 
            CancellationToken ct)
        {
            var teachers = await adminUserService.GetAllTeachersAsync(ct);
            return Ok(teachers);
        }

        [HttpGet("teachers/{id}/specializations")]
        [ProducesResponseType(typeof(IEnumerable<SubjectDto>), 200)]
        public async Task<IActionResult> GetTeacherSpecializations(int id, CancellationToken ct)
        {
            var specializations = await _academicService.GetTeacherSpecializationsAsync(id, ct);
            return Ok(specializations);
        }

        [HttpPut("teachers/{id}/specializations")]
        public async Task<IActionResult> UpdateTeacherSpecializations(int id, [FromBody] UpdateTeacherSpecializationRequest request, CancellationToken ct)
        {
            await _academicService.UpdateTeacherSpecializationAsync(id, request, ct);
            return NoContent();
        }
        
        // ── Grades ──────────────────────────────────────────────────────────

        [HttpGet("grades")]
        [ProducesResponseType(typeof(IEnumerable<GradeDto>), 200)]
        public async Task<IActionResult> GetAllGrades(CancellationToken ct)
        {
            var grades = await _academicService.GetAllGradesAsync(ct);
            return Ok(grades);
        }

        // ── Subjects ────────────────────────────────────────────────────────
        [HttpGet("categories")]
        public async Task<IActionResult> GetAllSubjectCategories(CancellationToken ct)
        {
            var categories = await _academicService.GetAllSubjectCategoriesAsync(ct);
            return Ok(categories);
        }

        [HttpGet("grades/{gradeId}/subjects")]
        [ProducesResponseType(typeof(IEnumerable<SubjectDto>), 200)]
        public async Task<IActionResult> GetSubjectsByGrade(int gradeId, CancellationToken ct)
        {
            var subjects = await _academicService.GetSubjectsByGradeAsync(gradeId, ct);
            return Ok(subjects);
        }

        [HttpGet("subjects")]
        public async Task<IActionResult> GetAllSubjects(CancellationToken ct)
        {
            var subjects = await _academicService.GetAllSubjectsAsync(ct);
            return Ok(subjects);
        }

        [HttpPost("subjects")]
        [ProducesResponseType(typeof(SubjectDto), 201)]
        public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectRequest request, CancellationToken ct)
        {
            try
            {
                var subject = await _academicService.CreateSubjectAsync(request, ct);
                return CreatedAtAction(nameof(GetSubjectsByGrade), new { gradeId = subject.GradeId }, subject);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPut("subjects/{id}")]
        [ProducesResponseType(typeof(SubjectDto), 200)]
        public async Task<IActionResult> UpdateSubject(int id, [FromBody] UpdateSubjectRequest request, CancellationToken ct)
        {
            try
            {
                var subject = await _academicService.UpdateSubjectAsync(id, request, ct);
                return Ok(subject);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        // ── Classes ─────────────────────────────────────────────────────────

        [HttpGet("grades/{gradeId}/classes")]
        [ProducesResponseType(typeof(IEnumerable<ClassDto>), 200)]
        public async Task<IActionResult> GetClassesByGrade(int gradeId, [FromQuery] int academicYear, CancellationToken ct)
        {
            var classes = await _academicService.GetClassesByGradeAsync(gradeId, academicYear, ct);
            return Ok(classes);
        }

        [HttpPost("classes")]
        [ProducesResponseType(typeof(ClassDto), 201)]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request, CancellationToken ct)
        {
            try
            {
                var cls = await _academicService.CreateClassAsync(request, ct);
                return CreatedAtAction(nameof(GetClassesByGrade), new { gradeId = cls.GradeId }, cls);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpPut("classes/{id}")]
        [ProducesResponseType(typeof(ClassDto), 200)]
        public async Task<IActionResult> UpdateClass(int id, [FromBody] UpdateClassRequest request, CancellationToken ct)
        {
            try
            {
                var cls = await _academicService.UpdateClassAsync(id, request, ct);
                return Ok(cls);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        [HttpGet("classes/{classId}/roster")]
        [ProducesResponseType(typeof(IEnumerable<StudentInClassDto>), 200)]
        public async Task<IActionResult> GetClassRoster(int classId, CancellationToken ct)
        {
            var roster = await _academicService.GetClassRosterAsync(classId, ct);
            return Ok(roster);
        }

        // ── Teaching Assignments ────────────────────────────────────────────

        [HttpGet("classes/{classId}/assignments")]
        [ProducesResponseType(typeof(IEnumerable<TeachingAssignmentDto>), 200)]
        public async Task<IActionResult> GetAssignmentsForClass(int classId, [FromQuery] int academicYear, CancellationToken ct)
        {
            var assignments = await _academicService.GetAssignmentsForClassAsync(classId, academicYear, ct);
            return Ok(assignments);
        }

        [HttpPost("teaching-assignments")]
        [ProducesResponseType(typeof(TeachingAssignmentDto), 201)]
        public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherRequest request, CancellationToken ct)
        {
            try
            {
                var assignment = await _academicService.AssignTeacherAsync(request, ct);
                return Created("", assignment);
            }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpDelete("teaching-assignments/{id}")]
        public async Task<IActionResult> UnassignTeacher(int id, CancellationToken ct)
        {
            try
            {
                await _academicService.UnassignTeacherAsync(id, ct);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        // ── Enrollments ─────────────────────────────────────────────────────

        [HttpPost("enrollments")]
        [ProducesResponseType(typeof(StudentClassDto), 201)]
        public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentRequest request, CancellationToken ct)
        {
            try
            {
                var dto = await _academicService.EnrollStudentAsync(request, ct);
                return Created("", dto);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpDelete("enrollments/{id}")]
        public async Task<IActionResult> UnenrollStudent(int id, [FromServices] Masarak.Infrastructure.Persistence.Context db, CancellationToken ct)
        {
            try
            {
                // id here is the StudentClassId (from StudentInClassDto.StudentClassId).
                var enrollment = await db.StudentClasses.FirstOrDefaultAsync(sc => sc.StudentClassId == id && sc.IsActive, ct);

                if (enrollment == null) return NotFound(new { message = $"Active enrollment with ID {id} not found." });

                enrollment.IsActive = false;
                
                await db.SaveChangesAsync(ct);
                return NoContent();
            }
            catch (Exception ex) { return Conflict(new { message = ex.Message }); }
        }
    }
}
