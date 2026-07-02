using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.EntityFrameworkCore;
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
        private readonly IUserRepository _userRepo;
        private readonly IDistributedCache _cache;
        private readonly Masarak.Infrastructure.Persistence.Context _context;

        private const string GradesCacheKey = "grades:all";
        private const string SubjectsCachePrefix = "subjects:grade:";

        public AcademicService(
            IGradeRepository gradeRepo,
            IClassRepository classRepo,
            ISubjectRepository subjectRepo,
            ITeachingAssignmentRepository assignmentRepo,
            IStudentClassRepository studentClassRepo,
            IUserRepository userRepo,
            IDistributedCache cache,
            Masarak.Infrastructure.Persistence.Context context)
        {
            _gradeRepo        = gradeRepo;
            _classRepo        = classRepo;
            _subjectRepo      = subjectRepo;
            _assignmentRepo   = assignmentRepo;
            _studentClassRepo = studentClassRepo;
            _userRepo         = userRepo;
            _cache            = cache;
            _context          = context;
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

            return subjects.Select(MapSubject);
        }

        public async Task<IEnumerable<SubjectCategoryDto>> GetAllSubjectCategoriesAsync(CancellationToken ct = default)
        {
            var categories = await _context.SubjectCategories
                .AsNoTracking()
                .ToListAsync(ct);
            return categories.Select(c => new SubjectCategoryDto(c.SubjectCategoryId, c.Name, c.NameAr, c.IsActive));
        }

        public async Task<IEnumerable<SubjectDto>> GetAllSubjectsAsync(CancellationToken ct = default)
        {
            var subjects = await _context.Subjects
                .AsNoTracking()
                .ToListAsync(ct);
            return subjects.Select(MapSubject);
        }

        public async Task<SubjectDto> CreateSubjectAsync(CreateSubjectRequest request, CancellationToken ct = default)
        {
            // Verify grade exists
            _ = await _gradeRepo.GetByIdAsync(request.GradeId, ct)
                ?? throw new KeyNotFoundException($"Grade {request.GradeId} not found.");

            // Create subject (using a default category of 1 for now if not provided in DTO, we will update DTO later if needed)
            var subject = Subject.Create(request.GradeId, 1, request.Name, request.NameAr, request.Code);
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
        // TEACHING ASSIGNMENTS & SPECIALIZATIONS
        // ═══════════════════════════════════════════════════════════════════════

        public async Task<IEnumerable<SubjectCategoryDto>> GetTeacherSpecializationsAsync(int teacherId, CancellationToken ct = default)
        {
            var categories = await _context.TeacherSubjects
                .Where(ts => ts.TeacherId == teacherId)
                .Include(ts => ts.SubjectCategory)
                .Select(ts => ts.SubjectCategory)
                .ToListAsync(ct);

            return categories.Select(c => new SubjectCategoryDto(c.SubjectCategoryId, c.Name, c.NameAr, c.IsActive));
        }

        public async Task UpdateTeacherSpecializationAsync(int teacherId, UpdateTeacherSpecializationRequest request, CancellationToken ct = default)
        {
            var existing = await _context.TeacherSubjects
                .Where(ts => ts.TeacherId == teacherId)
                .ToListAsync(ct);
            
            _context.TeacherSubjects.RemoveRange(existing);

            foreach (var categoryId in request.SubjectIds)
            {
                _context.TeacherSubjects.Add(new TeacherSubject
                {
                    TeacherId = teacherId,
                    SubjectCategoryId = categoryId
                });
            }

            await _context.SaveChangesAsync(ct);
        }

        public async Task<IEnumerable<TeachingAssignmentDto>> GetAssignmentsForClassAsync(int classId, int academicYear, CancellationToken ct = default)
        {
            var assignments = await _assignmentRepo.GetByClassIdAsync(classId, academicYear, ct);
            return assignments.Select(MapAssignment);
        }

        public async Task<TeachingAssignmentDto> AssignTeacherAsync(AssignTeacherRequest request, CancellationToken ct = default)
        {
            var targetSubject = await _context.Subjects.FindAsync(new object[] { request.SubjectId }, ct);
            if (targetSubject == null) throw new KeyNotFoundException("Subject not found.");

            // Validate that the teacher has the requested subject category in their specializations
            var hasSpecialization = await _context.TeacherSubjects
                .AnyAsync(ts => ts.TeacherId == request.TeacherId && ts.SubjectCategoryId == targetSubject.SubjectCategoryId, ct);

            if (!hasSpecialization)
                throw new InvalidOperationException("Teacher is not specialized in the requested subject. Please add it to their specializations first.");

            var existing = await _assignmentRepo.GetAssignmentBySubjectClassYearAsync(request.ClassId, request.SubjectId, request.AcademicYear, ct);
            
            if (existing != null)
            {
                if (existing.IsActive)
                {
                    if (existing.TeacherId == request.TeacherId)
                        throw new InvalidOperationException("This teacher is already assigned to this subject-class combination for this academic year.");
                    else
                        throw new InvalidOperationException("Another teacher is already assigned to this subject-class combination.");
                }

                existing.TeacherId = request.TeacherId;
                existing.IsActive = true;
                await _assignmentRepo.UpdateAsync(existing, ct);

                var reloaded = await _assignmentRepo.GetByIdWithDetailsAsync(existing.AssignmentId, ct);
                return MapAssignment(reloaded!);
            }

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
                sc.StudentClassId,
                sc.StudentId,
                sc.Student?.UserId ?? 0,
                sc.Student?.User?.FullName ?? "",
                sc.Student?.User?.Email ?? "",
                sc.EnrollmentType,
                sc.StudentClassSubjects.Select(scs => scs.Subject.Name).ToList()
            ));
        }

        public async Task<IEnumerable<StudentInClassDto>> GetStudentsByTeachingAssignmentAsync(int userId, int taId, CancellationToken ct = default)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found for this user.");

            var ta = await _assignmentRepo.GetByIdAsync(taId, ct);
            if (ta == null)
                throw new KeyNotFoundException($"Teaching Assignment {taId} not found.");
            if (ta.TeacherId != teacher.TeacherId)
                throw new UnauthorizedAccessException($"Teacher {teacher.TeacherId} is not assigned to this assignment.");

            var enrollments = await _studentClassRepo.GetByClassIdAsync(ta.ClassId, ct);
            
            // Filter out partial students who are NOT taking this specific subject
            var enrolledStudents = enrollments.Where(sc => 
                sc.EnrollmentType == Masarak.Domain.Enums.EnrollmentType.FullClass || 
                sc.StudentClassSubjects.Any(scs => scs.SubjectId == ta.SubjectId));

            return enrolledStudents.Select(sc => new StudentInClassDto(
                sc.StudentClassId,
                sc.StudentId,
                sc.Student?.UserId ?? 0,
                sc.Student?.User?.FullName ?? "",
                sc.Student?.User?.Email ?? "",
                sc.EnrollmentType,
                sc.StudentClassSubjects.Select(scs => scs.Subject.Name).ToList()
            ));
        }

        public async Task<StudentClassDto> EnrollStudentAsync(EnrollStudentRequest request, CancellationToken ct = default)
        {
            var studentUser = await _userRepo.GetByIdAsync(request.StudentId, ct);
            if (studentUser == null)
                throw new KeyNotFoundException($"Student {request.StudentId} not found.");
            if (studentUser.Role.Name != "Student")
                throw new InvalidOperationException($"User {request.StudentId} is not a Student.");

            // 1. Verify class exists and is active
            var cls = await _classRepo.GetByIdWithGradeAsync(request.ClassId, ct)
                ?? throw new KeyNotFoundException($"Class {request.ClassId} not found.");
            if (!cls.IsActive)
                throw new InvalidOperationException("Cannot enroll in an inactive class.");

            // Validate Student profile exists
            var studentEntity = await _context.Students.FirstOrDefaultAsync(s => s.UserId == request.StudentId, ct);
            if (studentEntity == null)
                throw new KeyNotFoundException($"Student profile for user {request.StudentId} not found.");

            // Validate Student.GradeId == Class.GradeId
            if (studentEntity.GradeId != cls.GradeId)
                throw new InvalidOperationException("Student belongs to a different educational level than this class.");

            // 1.5 Fetch Active Subscription to determine EnrollmentType and Subjects
            var activeSub = await _context.Subscriptions
                .Include(s => s.Plan)
                .Include(s => s.SubscriptionSubjects)
                .FirstOrDefaultAsync(s => s.UserId == request.StudentId && s.Status == SubscriptionStatus.Active, ct);

            if (activeSub == null)
                throw new InvalidOperationException("Student does not have an active subscription and cannot be enrolled.");

            var enrollmentType = activeSub.Plan.Type == PlanType.PerSubject ? EnrollmentType.PerSubject : EnrollmentType.FullClass;
            var subjectIds = enrollmentType == EnrollmentType.PerSubject 
                ? activeSub.SubscriptionSubjects.Select(ss => ss.SubjectId).ToList() 
                : new List<int>();

            // 2. Check MaxCapacity
            var currentCount = await _classRepo.GetEnrollmentCountAsync(request.ClassId, ct);
            if (currentCount >= cls.MaxCapacity)
                throw new InvalidOperationException($"Class {cls.Name} is at full capacity ({cls.MaxCapacity}).");

            // 3. Check student not already enrolled in another class for same year (active or inactive)
            var existing = await _context.StudentClasses
                .Include(sc => sc.Class)
                .Include(sc => sc.StudentClassSubjects)
                .FirstOrDefaultAsync(sc => sc.StudentId == studentEntity.StudentId && sc.AcademicYear == request.AcademicYear, ct);

            StudentClass enrollment;

            if (existing != null)
            {
                if (existing.IsActive)
                {
                    throw new InvalidOperationException(
                        $"Student is already enrolled in class '{existing.Class?.Name}' for academic year {request.AcademicYear}.");
                }

                // Reactivate and update
                existing.IsActive = true;
                existing.ClassId = request.ClassId;
                existing.EnrollmentType = enrollmentType;
                existing.EnrolledAt = DateTime.UtcNow;
                existing.StudentClassSubjects.Clear();

                if (enrollmentType == EnrollmentType.PerSubject && subjectIds.Any())
                {
                    foreach (var subjectId in subjectIds)
                    {
                        existing.StudentClassSubjects.Add(new StudentClassSubject { SubjectId = subjectId });
                    }
                }
                
                await _studentClassRepo.UpdateAsync(existing, ct);
                enrollment = existing;
            }
            else
            {
                // 4. Create new enrollment
                enrollment = StudentClass.Enroll(studentEntity.StudentId, request.ClassId, request.AcademicYear, enrollmentType);
                
                if (enrollmentType == EnrollmentType.PerSubject && subjectIds.Any())
                {
                    foreach (var subjectId in subjectIds)
                    {
                        enrollment.StudentClassSubjects.Add(new StudentClassSubject { SubjectId = subjectId });
                    }
                }

                await _studentClassRepo.AddAsync(enrollment, ct);
            }

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
            new(s.SubjectId, s.GradeId, s.Grade?.Name ?? "", s.SubjectCategoryId, s.Name, s.NameAr, s.Code, s.IsActive);

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
