using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Services
{
    public class LessonService : ITeacherLessonService, IStudentLessonService
    {
        private readonly Context _context;

        public LessonService(Context context)
        {
            _context = context;
        }

        // ── Teacher: Lesson Management ──────────────────────────────────────

        public async Task<LessonDto> CreateLessonAsync(int teacherUserId, CreateLessonRequest request, CancellationToken ct = default)
        {
            await VerifyTeacherOwnershipAsync(teacherUserId, request.TeachingAssignmentId, ct);

            // Determine the next OrderNum
            var maxOrder = await _context.Lessons
                .Where(l => l.TeachingAssignmentId == request.TeachingAssignmentId)
                .MaxAsync(l => (int?)l.OrderNum, ct) ?? 0;

            var lesson = Lesson.Create(request.TeachingAssignmentId, request.Title, request.Description, maxOrder + 1);

            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync(ct);

            return MapToDto(lesson);
        }

        public async Task<LessonDto> UpdateLessonAsync(int teacherUserId, int lessonId, UpdateLessonRequest request, CancellationToken ct = default)
        {
            var lesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct);

            lesson.Update(request.Title, request.Description);
            await _context.SaveChangesAsync(ct);

            return MapToDto(lesson);
        }

        public async Task DeleteLessonAsync(int teacherUserId, int lessonId, CancellationToken ct = default)
        {
            var lesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct, includeChildren: true);

            // Soft-detach children
            foreach (var item in lesson.ContentItems) item.DetachFromLesson();
            foreach (var exam in lesson.Exams) exam.DetachFromLesson();
            foreach (var assignment in lesson.Assignments) assignment.DetachFromLesson();

            _context.Lessons.Remove(lesson);
            await _context.SaveChangesAsync(ct);
        }

        public async Task<IEnumerable<LessonDto>> GetTeacherLessonsAsync(int teacherUserId, int teachingAssignmentId, CancellationToken ct = default)
        {
            await VerifyTeacherOwnershipAsync(teacherUserId, teachingAssignmentId, ct);

            var lessons = await _context.Lessons
                .Where(l => l.TeachingAssignmentId == teachingAssignmentId)
                .Include(l => l.ContentItems)
                .Include(l => l.Exams)
                .Include(l => l.Assignments)
                .OrderBy(l => l.OrderNum)
                .ToListAsync(ct);

            return lessons.Select(MapToDto);
        }

        public async Task<LessonDetailDto> GetTeacherLessonDetailAsync(int teacherUserId, int lessonId, CancellationToken ct = default)
        {
            var lesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct, includeChildren: true);
            return MapToDetailDto(lesson);
        }

        public async Task PublishLessonAsync(int teacherUserId, int lessonId, CancellationToken ct = default)
        {
            var lesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct);
            lesson.Publish();
            await _context.SaveChangesAsync(ct);
        }

        public async Task ReorderLessonsAsync(int teacherUserId, int teachingAssignmentId, ReorderLessonsRequest request, CancellationToken ct = default)
        {
            await VerifyTeacherOwnershipAsync(teacherUserId, teachingAssignmentId, ct);

            var lessons = await _context.Lessons
                .Where(l => l.TeachingAssignmentId == teachingAssignmentId)
                .ToListAsync(ct);

            var lessonDict = lessons.ToDictionary(l => l.LessonId);
            var expectedIds = request.LessonIdsInOrder.ToList();

            if (lessons.Count != expectedIds.Count || !lessons.All(l => expectedIds.Contains(l.LessonId)))
            {
                throw new InvalidOperationException("Invalid lesson IDs provided for reordering.");
            }

            for (int i = 0; i < expectedIds.Count; i++)
            {
                if (lessonDict.TryGetValue(expectedIds[i], out var lesson))
                {
                    lesson.UpdateOrder(i + 1);
                }
            }

            await _context.SaveChangesAsync(ct);
        }

        // ── Teacher: Clone Lesson ───────────────────────────────────────────
        
        public async Task CloneLessonAsync(int teacherUserId, int lessonId, CloneLessonRequest request, CancellationToken ct = default)
        {
            var sourceLesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct, includeChildren: true);
            
            var targetIds = request.TargetTeachingAssignmentIds.Distinct().Where(id => id != sourceLesson.TeachingAssignmentId).ToList();
            if (!targetIds.Any()) return;

            // Bulk ownership verification
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == teacherUserId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found.");

            var assignments = await _context.TeachingAssignments
                .Where(ta => targetIds.Contains(ta.AssignmentId))
                .ToListAsync(ct);

            if (assignments.Count != targetIds.Count || assignments.Any(ta => ta.TeacherId != teacher.TeacherId))
            {
                throw new UnauthorizedAccessException("You are not assigned to one or more of the target teaching assignments.");
            }

            // Bulk max order fetch
            var maxOrders = await _context.Lessons
                .Where(l => targetIds.Contains(l.TeachingAssignmentId))
                .GroupBy(l => l.TeachingAssignmentId)
                .Select(g => new { TaId = g.Key, MaxOrder = g.Max(l => l.OrderNum) })
                .ToDictionaryAsync(x => x.TaId, x => x.MaxOrder, ct);

            foreach (var targetTaId in targetIds)
            {
                var maxOrder = maxOrders.TryGetValue(targetTaId, out var order) ? order : 0;

                var clonedLesson = Lesson.Create(targetTaId, sourceLesson.Title, sourceLesson.Description, maxOrder + 1);
                clonedLesson.IsPublished = sourceLesson.IsPublished;
                
                _context.Lessons.Add(clonedLesson);
            }
            
            await _context.SaveChangesAsync(ct);
            // Note: We only clone the Lesson container. The items inside (Content, Exams, Assignments) 
            // are tightly coupled to the original TeachingAssignment and their own files/marks.
            // A full deep-clone of exams and assignments would require duplicating them as well, 
            // which is highly complex and error prone. We just clone the lesson structure here.
        }

        // ── Teacher: Attach/Detach ──────────────────────────────────────────

        public async Task AttachContentToLessonAsync(int teacherUserId, int lessonId, int contentItemId, CancellationToken ct = default)
        {
            var lesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct);
            var content = await _context.ContentItems.FirstOrDefaultAsync(c => c.ContentItemId == contentItemId, ct)
                ?? throw new KeyNotFoundException("Content not found.");

            if (content.TeachingAssignmentId != lesson.TeachingAssignmentId)
                throw new InvalidOperationException("Content does not belong to the same teaching assignment.");

            content.AttachToLesson(lessonId);
            await _context.SaveChangesAsync(ct);
        }

        public async Task DetachContentFromLessonAsync(int teacherUserId, int contentItemId, CancellationToken ct = default)
        {
            var content = await _context.ContentItems
                .Include(c => c.Lesson)
                .ThenInclude(l => l.TeachingAssignment)
                .FirstOrDefaultAsync(c => c.ContentItemId == contentItemId, ct)
                ?? throw new KeyNotFoundException("Content not found.");

            if (content.Lesson == null) return;
            await VerifyTeacherOwnershipAsync(teacherUserId, content.Lesson.TeachingAssignmentId, ct);

            content.DetachFromLesson();
            await _context.SaveChangesAsync(ct);
        }

        public async Task AttachExamToLessonAsync(int teacherUserId, int lessonId, int examId, CancellationToken ct = default)
        {
            var lesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct);
            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examId, ct)
                ?? throw new KeyNotFoundException("Exam not found.");

            if (exam.AssignmentId != lesson.TeachingAssignmentId)
                throw new InvalidOperationException("Exam does not belong to the same teaching assignment.");

            exam.AttachToLesson(lessonId);
            await _context.SaveChangesAsync(ct);
        }

        public async Task DetachExamFromLessonAsync(int teacherUserId, int examId, CancellationToken ct = default)
        {
            var exam = await _context.Exams
                .Include(e => e.Lesson)
                .ThenInclude(l => l.TeachingAssignment)
                .FirstOrDefaultAsync(e => e.ExamId == examId, ct)
                ?? throw new KeyNotFoundException("Exam not found.");

            if (exam.Lesson == null) return;
            await VerifyTeacherOwnershipAsync(teacherUserId, exam.Lesson.TeachingAssignmentId, ct);

            exam.DetachFromLesson();
            await _context.SaveChangesAsync(ct);
        }

        public async Task AttachAssignmentToLessonAsync(int teacherUserId, int lessonId, int assignmentId, CancellationToken ct = default)
        {
            var lesson = await GetLessonAndVerifyOwnershipAsync(teacherUserId, lessonId, ct);
            var assignment = await _context.Assignments.FirstOrDefaultAsync(a => a.AssignmentId == assignmentId, ct)
                ?? throw new KeyNotFoundException("Assignment not found.");

            if (assignment.AssignmentRef != lesson.TeachingAssignmentId)
                throw new InvalidOperationException("Assignment does not belong to the same teaching assignment.");

            assignment.AttachToLesson(lessonId);
            await _context.SaveChangesAsync(ct);
        }

        public async Task DetachAssignmentFromLessonAsync(int teacherUserId, int assignmentId, CancellationToken ct = default)
        {
            var assignment = await _context.Assignments
                .Include(a => a.Lesson)
                .ThenInclude(l => l.TeachingAssignment)
                .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId, ct)
                ?? throw new KeyNotFoundException("Assignment not found.");

            if (assignment.Lesson == null) return;
            await VerifyTeacherOwnershipAsync(teacherUserId, assignment.Lesson.TeachingAssignmentId, ct);

            assignment.DetachFromLesson();
            await _context.SaveChangesAsync(ct);
        }

        // ── Student: Lesson Viewing ─────────────────────────────────────────

        public async Task<IEnumerable<LessonDto>> GetStudentLessonsAsync(int studentUserId, int subjectId, CancellationToken ct = default)
        {
            var enrollment = await GetStudentActiveEnrollmentAsync(studentUserId, ct);

            var lessons = await _context.Lessons
                .Include(l => l.TeachingAssignment)
                .Include(l => l.ContentItems.Where(c => c.IsActive))
                .Include(l => l.Exams.Where(e => e.Status == Domain.Enums.ExamStatus.Published || e.Status == Domain.Enums.ExamStatus.Closed))
                .Include(l => l.Assignments.Where(a => a.Status == Domain.Enums.AssignmentStatus.Published || a.Status == Domain.Enums.AssignmentStatus.Closed))
                .Where(l => l.TeachingAssignment.ClassId == enrollment.ClassId && 
                            l.TeachingAssignment.SubjectId == subjectId &&
                            l.IsPublished)
                .OrderBy(l => l.OrderNum)
                .ToListAsync(ct);

            return lessons.Select(MapToDto);
        }

        public async Task<LessonDetailDto> GetStudentLessonDetailAsync(int studentUserId, int lessonId, CancellationToken ct = default)
        {
            var enrollment = await GetStudentActiveEnrollmentAsync(studentUserId, ct);

            var lesson = await _context.Lessons
                .Include(l => l.TeachingAssignment)
                .Include(l => l.ContentItems.Where(c => c.IsActive))
                .Include(l => l.Exams.Where(e => e.Status == Domain.Enums.ExamStatus.Published || e.Status == Domain.Enums.ExamStatus.Closed))
                .Include(l => l.Assignments.Where(a => a.Status == Domain.Enums.AssignmentStatus.Published || a.Status == Domain.Enums.AssignmentStatus.Closed))
                .FirstOrDefaultAsync(l => l.LessonId == lessonId && l.IsPublished, ct)
                ?? throw new KeyNotFoundException("Lesson not found or not published.");

            if (lesson.TeachingAssignment.ClassId != enrollment.ClassId)
                throw new UnauthorizedAccessException("You are not enrolled in this class.");

            return MapToDetailDto(lesson);
        }

        // ── Private Helpers ─────────────────────────────────────────────────

        private async Task<StudentClass> GetStudentActiveEnrollmentAsync(int studentUserId, CancellationToken ct)
        {
            var student = await _context.Students
                .Include(s => s.StudentClasses)
                .FirstOrDefaultAsync(s => s.UserId == studentUserId, ct)
                ?? throw new KeyNotFoundException("Student profile not found.");

            var enrollment = student.StudentClasses.FirstOrDefault(sc => sc.IsActive)
                ?? throw new InvalidOperationException("Student is not enrolled in any class.");

            return enrollment;
        }

        private async Task VerifyTeacherOwnershipAsync(int teacherUserId, int teachingAssignmentId, CancellationToken ct)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == teacherUserId, ct)
                ?? throw new KeyNotFoundException("Teacher profile not found.");

            var ta = await _context.TeachingAssignments.FirstOrDefaultAsync(t => t.AssignmentId == teachingAssignmentId, ct)
                ?? throw new KeyNotFoundException($"Teaching assignment {teachingAssignmentId} not found.");

            if (ta.TeacherId != teacher.TeacherId)
                throw new UnauthorizedAccessException("You are not assigned to this teaching assignment.");
        }

        private async Task<Lesson> GetLessonAndVerifyOwnershipAsync(int teacherUserId, int lessonId, CancellationToken ct, bool includeChildren = false)
        {
            var query = _context.Lessons.AsQueryable();

            if (includeChildren)
            {
                query = query
                    .Include(l => l.ContentItems)
                    .Include(l => l.Exams)
                    .Include(l => l.Assignments);
            }

            var lesson = await query.FirstOrDefaultAsync(l => l.LessonId == lessonId, ct)
                ?? throw new KeyNotFoundException("Lesson not found.");

            await VerifyTeacherOwnershipAsync(teacherUserId, lesson.TeachingAssignmentId, ct);
            return lesson;
        }

        private static LessonDto MapToDto(Lesson l) => new(
            LessonId: l.LessonId,
            TeachingAssignmentId: l.TeachingAssignmentId,
            Title: l.Title,
            Description: l.Description,
            OrderNum: l.OrderNum,
            IsPublished: l.IsPublished,
            CreatedAt: l.CreatedAt,
            ContentCount: l.ContentItems?.Count ?? 0,
            ExamCount: l.Exams?.Count ?? 0,
            AssignmentCount: l.Assignments?.Count ?? 0
        );

        private static LessonDetailDto MapToDetailDto(Lesson l) => new(
            LessonId: l.LessonId,
            TeachingAssignmentId: l.TeachingAssignmentId,
            Title: l.Title,
            Description: l.Description,
            OrderNum: l.OrderNum,
            IsPublished: l.IsPublished,
            CreatedAt: l.CreatedAt,
            ContentItems: l.ContentItems?.Select(c => new ContentItemDto(c.ContentItemId, c.Type, c.SourceType, c.Title, c.Description, c.ResourceUrl, c.FileSizeBytes, c.CreatedAt, c.IsActive)) ?? Array.Empty<ContentItemDto>(),
            Exams: l.Exams?.Select(e => new ExamDto(e.ExamId, e.Title, e.StartTime, e.EndTime, e.DurationMins, e.TotalMarks, e.Status, e.Questions?.Count ?? 0)) ?? Array.Empty<ExamDto>(),
            Assignments: l.Assignments?.Select(a => new AssignmentDto(a.AssignmentId, a.Title, a.DueDate, a.MaxScore, a.Status, "", "", a.Submissions?.Count ?? 0)) ?? Array.Empty<AssignmentDto>()
        );
    }
}
