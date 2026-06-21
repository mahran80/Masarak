using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Masarak.Infrastructure.Services
{
    /// <summary>
    /// Admin-level academic operations: grades, subjects, classes,
    /// teaching assignments, and student enrollment.
    /// Includes Redis caching for grades and subjects.
    /// </summary>
    public class AcademicService : IAcademicService
    {
        private readonly IGradeRepository _gradeRepo;
        private readonly IClassRepository _classRepo;
        private readonly ISubjectRepository _subjectRepo;
        private readonly ITeachingAssignmentRepository _assignmentRepo;
        private readonly IStudentClassRepository _studentClassRepo;
        private readonly IDistributedCache _cache;

        private const string GradesCacheKey = "grades:all";
        private const string SubjectsCachePrefix = "subjects:grade:";

        public AcademicService(
            IGradeRepository gradeRepo,
            IClassRepository classRepo,
            ISubjectRepository subjectRepo,
            ITeachingAssignmentRepository assignmentRepo,
            IStudentClassRepository studentClassRepo,
            IDistributedCache cache)
        {
            _gradeRepo        = gradeRepo;
            _classRepo        = classRepo;
            _subjectRepo      = subjectRepo;
            _assignmentRepo   = assignmentRepo;
            _studentClassRepo = studentClassRepo;
            _cache            = cache;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // GRADES
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<GradeDto>> GetAllGradesAsync(CancellationToken ct = default)
        {
            // Try cache first
            var cached = await _cache.GetStringAsync(GradesCacheKey, ct);
            if (cached != null)
                return JsonSerializer.Deserialize<IEnumerable<GradeDto>>(cached)!;

            var grades = await _gradeRepo.GetAllAsync(ct);
            var dtos = grades.Select(g => MapGrade(g)).ToList();

            // Cache for 1 hour
            await _cache.SetStringAsync(GradesCacheKey,
                JsonSerializer.Serialize(dtos),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) }, ct);

            return dtos;
        }

        public async Task<GradeDetailDto> GetGradeWithDetailsAsync(int gradeId, int? academicYear = null, CancellationToken ct = default)
        {
            var grade = await _gradeRepo.GetByIdAsync(gradeId, ct)
                ?? throw new KeyNotFoundException($"Grade {gradeId} not found.");

            var subjects = await _subjectRepo.GetByGradeIdAsync(gradeId, ct);
            var year = academicYear ?? Domain.ValueObjects.AcademicYear.Current().Year;
            var classes = await _classRepo.GetByGradeIdAsync(gradeId, year, ct);

            var classDtos = new List<ClassDto>();
            foreach (var c in classes)
            {
                var count = await _classRepo.GetEnrollmentCountAsync(c.ClassId, ct);
                classDtos.Add(new ClassDto(c.ClassId, c.GradeId, grade.Name, c.Name,
                    c.MaxCapacity, c.AcademicYear, count, c.IsActive));
            }

            return new GradeDetailDto(
                grade.GradeId, grade.Name, grade.NameAr,
                subjects.Select(s => MapSubject(s)),
                classDtos);
        }

        public async Task<GradeDto> CreateGradeAsync(CreateGradeRequest request, CancellationToken ct = default)
        {
            var grade = Grade.Create(request.Name, request.NameAr, request.Stage, request.Order);
            await _gradeRepo.AddAsync(grade, ct);
            await InvalidateGradesCacheAsync(ct);
            return MapGrade(grade);
        }

        public async Task<GradeDto> UpdateGradeAsync(int gradeId, UpdateGradeRequest request, CancellationToken ct = default)
        {
            var grade = await _gradeRepo.GetByIdAsync(gradeId, ct)
                ?? throw new KeyNotFoundException($"Grade {gradeId} not found.");

            grade.Name     = request.Name;
            grade.NameAr   = request.NameAr;
            grade.IsActive = request.IsActive;

            await _gradeRepo.UpdateAsync(grade, ct);
            await InvalidateGradesCacheAsync(ct);
            return MapGrade(grade);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // SUBJECTS
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<SubjectDto>> GetSubjectsByGradeAsync(int gradeId, CancellationToken ct = default)
        {
            var cacheKey = $"{SubjectsCachePrefix}{gradeId}";
            var cached = await _cache.GetStringAsync(cacheKey, ct);
            if (cached != null)
                return JsonSerializer.Deserialize<IEnumerable<SubjectDto>>(cached)!;

            var subjects = await _subjectRepo.GetByGradeIdAsync(gradeId, ct);
            var dtos = subjects.Select(s => MapSubject(s)).ToList();

            await _cache.SetStringAsync(cacheKey,
                JsonSerializer.Serialize(dtos),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) }, ct);

            return dtos;
        }

        public async Task<SubjectDto> CreateSubjectAsync(CreateSubjectRequest request, CancellationToken ct = default)
        {
            // Verify grade exists
            _ = await _gradeRepo.GetByIdAsync(request.GradeId, ct)
                ?? throw new KeyNotFoundException($"Grade {request.GradeId} not found.");

            var subject = Subject.Create(request.GradeId, request.Name, request.NameAr, request.Code);
            await _subjectRepo.AddAsync(subject, ct);
            await InvalidateSubjectsCacheAsync(request.GradeId, ct);
            return MapSubject(subject);
        }

        public async Task<SubjectDto> UpdateSubjectAsync(int subjectId, UpdateSubjectRequest request, CancellationToken ct = default)
        {
            var subject = await _subjectRepo.GetByIdAsync(subjectId, ct)
                ?? throw new KeyNotFoundException($"Subject {subjectId} not found.");

            subject.Name     = request.Name;
            subject.NameAr   = request.NameAr;
            subject.IsActive = request.IsActive;

            await _subjectRepo.UpdateAsync(subject, ct);
            await InvalidateSubjectsCacheAsync(subject.GradeId, ct);
            return MapSubject(subject);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // CLASSES
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<ClassDto>> GetClassesByGradeAsync(int gradeId, int academicYear, CancellationToken ct = default)
        {
            var classes = await _classRepo.GetByGradeIdAsync(gradeId, academicYear, ct);
            var result = new List<ClassDto>();
            foreach (var c in classes)
            {
                var count = await _classRepo.GetEnrollmentCountAsync(c.ClassId, ct);
                result.Add(new ClassDto(c.ClassId, c.GradeId, c.Grade?.Name ?? "", c.Name,
                    c.MaxCapacity, c.AcademicYear, count, c.IsActive));
            }
            return result;
        }

        public async Task<ClassDto> CreateClassAsync(CreateClassRequest request, CancellationToken ct = default)
        {
            var grade = await _gradeRepo.GetByIdAsync(request.GradeId, ct)
                ?? throw new KeyNotFoundException($"Grade {request.GradeId} not found.");

            var cls = Class.Create(request.GradeId, request.Name, request.MaxCapacity, request.AcademicYear);
            await _classRepo.AddAsync(cls, ct);
            return new ClassDto(cls.ClassId, cls.GradeId, grade.Name, cls.Name,
                cls.MaxCapacity, cls.AcademicYear, 0, cls.IsActive);
        }

        public async Task<ClassDto> UpdateClassAsync(int classId, UpdateClassRequest request, CancellationToken ct = default)
        {
            var cls = await _classRepo.GetByIdWithGradeAsync(classId, ct)
                ?? throw new KeyNotFoundException($"Class {classId} not found.");

            cls.Name        = request.Name;
            cls.MaxCapacity = request.MaxCapacity;
            cls.IsActive    = request.IsActive;

            await _classRepo.UpdateAsync(cls, ct);
            var count = await _classRepo.GetEnrollmentCountAsync(classId, ct);
            return new ClassDto(cls.ClassId, cls.GradeId, cls.Grade?.Name ?? "", cls.Name,
                cls.MaxCapacity, cls.AcademicYear, count, cls.IsActive);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // TEACHING ASSIGNMENTS
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<TeachingAssignmentDto>> GetAssignmentsForClassAsync(int classId, int academicYear, CancellationToken ct = default)
        {
            var assignments = await _assignmentRepo.GetByClassIdAsync(classId, academicYear, ct);
            return assignments.Select(MapAssignment);
        }

        public async Task<TeachingAssignmentDto> AssignTeacherAsync(AssignTeacherRequest request, CancellationToken ct = default)
        {
            // Check for duplicate
            if (await _assignmentRepo.AssignmentExistsAsync(request.TeacherId, request.ClassId, request.SubjectId, request.AcademicYear, ct))
                throw new InvalidOperationException("This teacher is already assigned to this subject-class combination for this academic year.");

            var assignment = TeachingAssignment.Create(request.TeacherId, request.ClassId, request.SubjectId, request.AcademicYear);
            await _assignmentRepo.AddAsync(assignment, ct);

            // Reload with navigations for the response
            var loaded = await _assignmentRepo.GetByIdWithDetailsAsync(assignment.AssignmentId, ct);
            return MapAssignment(loaded!);
        }

        public async Task UnassignTeacherAsync(int assignmentId, CancellationToken ct = default)
        {
            var assignment = await _assignmentRepo.GetByIdAsync(assignmentId, ct)
                ?? throw new KeyNotFoundException($"Teaching assignment {assignmentId} not found.");

            assignment.IsActive = false;
            await _assignmentRepo.UpdateAsync(assignment, ct);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // STUDENT ENROLLMENT
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<StudentInClassDto>> GetClassRosterAsync(int classId, CancellationToken ct = default)
        {
            var enrollments = await _studentClassRepo.GetByClassIdAsync(classId, ct);
            return enrollments.Select(sc => new StudentInClassDto(
                sc.StudentId,
                sc.Student?.User?.FullName ?? "",
                sc.Student?.User?.Email ?? ""));
        }

        public async Task<StudentClassDto> EnrollStudentAsync(EnrollStudentRequest request, CancellationToken ct = default)
        {
            // 1. Verify class exists and is active
            var cls = await _classRepo.GetByIdWithGradeAsync(request.ClassId, ct)
                ?? throw new KeyNotFoundException($"Class {request.ClassId} not found.");
            if (!cls.IsActive)
                throw new InvalidOperationException("Cannot enroll in an inactive class.");

            // 2. Check MaxCapacity
            var currentCount = await _classRepo.GetEnrollmentCountAsync(request.ClassId, ct);
            if (currentCount >= cls.MaxCapacity)
                throw new InvalidOperationException($"Class {cls.Name} is at full capacity ({cls.MaxCapacity}).");

            // 3. Check student not already enrolled in another class for same year
            var existing = await _studentClassRepo.GetByStudentAndYearAsync(request.StudentId, request.AcademicYear, ct);
            if (existing != null)
                throw new InvalidOperationException(
                    $"Student is already enrolled in class '{existing.Class?.Name}' for academic year {request.AcademicYear}.");

            // 4. Create enrollment
            var enrollment = StudentClass.Enroll(request.StudentId, request.ClassId, request.AcademicYear);
            await _studentClassRepo.AddAsync(enrollment, ct);

            // Reload for response
            var loaded = await _studentClassRepo.GetByIdAsync(enrollment.StudentClassId, ct);
            return new StudentClassDto(
                loaded!.StudentClassId,
                loaded.StudentId,
                loaded.Student?.User?.FullName ?? "",
                loaded.ClassId,
                loaded.Class?.Name ?? "");
        }

        public async Task UnenrollStudentAsync(int studentClassId, CancellationToken ct = default)
        {
            var enrollment = await _studentClassRepo.GetByIdAsync(studentClassId, ct)
                ?? throw new KeyNotFoundException($"Enrollment {studentClassId} not found.");

            enrollment.IsActive = false;
            await _studentClassRepo.UpdateAsync(enrollment, ct);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // PRIVATE HELPERS
        // ═══════════════════════════════════════════════════════════════════════

        private static GradeDto MapGrade(Grade g) =>
            new(g.GradeId, g.Name, g.NameAr, g.Stage, g.Order, g.IsActive);

        private static SubjectDto MapSubject(Subject s) =>
            new(s.SubjectId, s.GradeId, s.Name, s.NameAr, s.Code, s.IsActive);

        private static TeachingAssignmentDto MapAssignment(TeachingAssignment ta) =>
            new(ta.AssignmentId,
                ta.TeacherId,
                ta.Teacher?.User?.FullName ?? "",
                ta.Class?.Name ?? "",
                ta.Subject?.Name ?? "",
                ta.AcademicYear,
                ta.IsActive);

        private async Task InvalidateGradesCacheAsync(CancellationToken ct)
        {
            await _cache.RemoveAsync(GradesCacheKey, ct);
        }

        private async Task InvalidateSubjectsCacheAsync(int gradeId, CancellationToken ct)
        {
            await _cache.RemoveAsync($"{SubjectsCachePrefix}{gradeId}", ct);
        }
    }
}
