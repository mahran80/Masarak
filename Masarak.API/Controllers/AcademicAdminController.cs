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
        
        // ── Grades ──────────────────────────────────────────────────────────

        [HttpGet("grades")]
        [ProducesResponseType(typeof(IEnumerable<GradeDto>), 200)]
        public async Task<IActionResult> GetAllGrades(CancellationToken ct)
        {
            var grades = await _academicService.GetAllGradesAsync(ct);
            return Ok(grades);
        }

        [HttpPost("grades")]
        [ProducesResponseType(typeof(GradeDto), 201)]
        public async Task<IActionResult> CreateGrade([FromBody] CreateGradeRequest request, CancellationToken ct)
        {
            var grade = await _academicService.CreateGradeAsync(request, ct);
            return CreatedAtAction(nameof(GetAllGrades), new { }, grade);
        }

        [HttpPut("grades/{id}")]
        [ProducesResponseType(typeof(GradeDto), 200)]
        public async Task<IActionResult> UpdateGrade(int id, [FromBody] UpdateGradeRequest request, CancellationToken ct)
        {
            try
            {
                var grade = await _academicService.UpdateGradeAsync(id, request, ct);
                return Ok(grade);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        // ── Subjects ────────────────────────────────────────────────────────

        [HttpGet("grades/{gradeId}/subjects")]
        [ProducesResponseType(typeof(IEnumerable<SubjectDto>), 200)]
        public async Task<IActionResult> GetSubjectsByGrade(int gradeId, CancellationToken ct)
        {
            var subjects = await _academicService.GetSubjectsByGradeAsync(gradeId, ct);
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
        public async Task<IActionResult> EnrollStudent(
            [FromBody] EnrollStudentRequest request,
            [FromServices] Masarak.Infrastructure.Persistence.Context db,
            CancellationToken ct)
        {
            try
            {
                var studentUser = await db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == request.StudentId, ct);
                if (studentUser == null) return NotFound(new { message = $"Student user {request.StudentId} not found." });
                if (studentUser.Role.Name != "Student") return Conflict(new { message = $"User {request.StudentId} is not a Student." });

                var student = await db.Students.FirstOrDefaultAsync(s => s.UserId == request.StudentId, ct);
                if (student == null) return NotFound(new { message = "Student profile not found." });

                var cls = await db.Classes.FirstOrDefaultAsync(c => c.ClassId == request.ClassId, ct);
                if (cls == null) return NotFound(new { message = $"Class {request.ClassId} not found." });
                if (!cls.IsActive) return Conflict(new { message = "Cannot enroll in an inactive class." });

                var currentCount = await db.StudentClasses.CountAsync(sc => sc.ClassId == request.ClassId && sc.IsActive, ct);
                if (currentCount >= cls.MaxCapacity) return Conflict(new { message = $"Class {cls.Name} is at full capacity." });

                var existing = await db.StudentClasses.FirstOrDefaultAsync(sc => sc.StudentId == student.StudentId && sc.AcademicYear == request.AcademicYear, ct);
                
                Masarak.Domain.Entities.StudentClass finalEnrollment;

                if (existing != null)
                {
                    if (existing.IsActive)
                    {
                        return Conflict(new { message = $"Student is already enrolled in a class for academic year {request.AcademicYear}." });
                    }
                    else
                    {
                        // Reactivate existing enrollment to avoid unique constraint violation
                        existing.ClassId = request.ClassId;
                        existing.IsActive = true;
                        existing.EnrolledAt = DateTime.UtcNow;
                        db.StudentClasses.Update(existing);
                        finalEnrollment = existing;
                    }
                }
                else
                {
                    var enrollment = new Masarak.Domain.Entities.StudentClass
                    {
                        StudentId = student.StudentId,
                        ClassId = request.ClassId,
                        AcademicYear = request.AcademicYear,
                        EnrolledAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    db.StudentClasses.Add(enrollment);
                    finalEnrollment = enrollment;
                }

                await db.SaveChangesAsync(ct);

                return Created("", new StudentClassDto(
                    finalEnrollment.StudentClassId,
                    student.StudentId,
                    studentUser.FullName,
                    cls.ClassId,
                    cls.Name));
            }
            catch (Exception ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpDelete("enrollments/{id}")]
        public async Task<IActionResult> UnenrollStudent(int id, [FromServices] Masarak.Infrastructure.Persistence.Context db, CancellationToken ct)
        {
            try
            {
                // id here is the StudentId (from StudentInClassDto.StudentId).
                // Find all active enrollments for this student and deactivate them.
                var enrollments = await db.StudentClasses.Where(sc => sc.StudentId == id && sc.IsActive).ToListAsync(ct);
                if (!enrollments.Any())
                {
                    // Fallback: If no enrollment found by StudentId, maybe the frontend passed UserId?
                    var student = await db.Students.FirstOrDefaultAsync(s => s.UserId == id, ct);
                    if (student != null)
                    {
                        enrollments = await db.StudentClasses.Where(sc => sc.StudentId == student.StudentId && sc.IsActive).ToListAsync(ct);
                    }
                }

                if (!enrollments.Any()) return NotFound(new { message = $"Active enrollment for student {id} not found." });

                foreach (var enrollment in enrollments)
                {
                    enrollment.IsActive = false;
                }
                
                await db.SaveChangesAsync(ct);
                return NoContent();
            }
            catch (Exception ex) { return Conflict(new { message = ex.Message }); }
        }
    }
}
