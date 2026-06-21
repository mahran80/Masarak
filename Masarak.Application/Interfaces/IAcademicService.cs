using Masarak.Application.DTOs;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Admin-level academic operations: grades, subjects, classes,
    /// teaching assignments, and student enrollment.
    /// </summary>
    public interface IAcademicService
    {
        // ── Grades ──────────────────────────────────────────────────────────
        Task<IEnumerable<GradeDto>> GetAllGradesAsync(CancellationToken ct = default);
        Task<GradeDetailDto> GetGradeWithDetailsAsync(int gradeId, int? academicYear = null, CancellationToken ct = default);
        Task<GradeDto> CreateGradeAsync(CreateGradeRequest request, CancellationToken ct = default);
        Task<GradeDto> UpdateGradeAsync(int gradeId, UpdateGradeRequest request, CancellationToken ct = default);

        // ── Subjects ────────────────────────────────────────────────────────
        Task<IEnumerable<SubjectDto>> GetSubjectsByGradeAsync(int gradeId, CancellationToken ct = default);
        Task<SubjectDto> CreateSubjectAsync(CreateSubjectRequest request, CancellationToken ct = default);
        Task<SubjectDto> UpdateSubjectAsync(int subjectId, UpdateSubjectRequest request, CancellationToken ct = default);

        // ── Classes ─────────────────────────────────────────────────────────
        Task<IEnumerable<ClassDto>> GetClassesByGradeAsync(int gradeId, int academicYear, CancellationToken ct = default);
        Task<ClassDto> CreateClassAsync(CreateClassRequest request, CancellationToken ct = default);
        Task<ClassDto> UpdateClassAsync(int classId, UpdateClassRequest request, CancellationToken ct = default);

        // ── Teaching Assignments ────────────────────────────────────────────
        Task<IEnumerable<TeachingAssignmentDto>> GetAssignmentsForClassAsync(int classId, int academicYear, CancellationToken ct = default);
        Task<TeachingAssignmentDto> AssignTeacherAsync(AssignTeacherRequest request, CancellationToken ct = default);
        Task UnassignTeacherAsync(int assignmentId, CancellationToken ct = default);

        // ── Student Enrollment ──────────────────────────────────────────────
        Task<IEnumerable<StudentInClassDto>> GetClassRosterAsync(int classId, CancellationToken ct = default);
        Task<StudentClassDto> EnrollStudentAsync(EnrollStudentRequest request, CancellationToken ct = default);
        Task UnenrollStudentAsync(int studentClassId, CancellationToken ct = default);
    }
}
