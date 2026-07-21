using Masarak.Application.Interfaces;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Masarak.Infrastructure.Services.AI.Hybrid
{
    public class HybridAuthGuard
    {
        private readonly Context _context;
        private readonly ISubscriptionAccessService _accessService;

        public HybridAuthGuard(Context context, ISubscriptionAccessService accessService)
        {
            _context = context;
            _accessService = accessService;
        }

        public async Task ValidateParentStudentLinkAsync(int parentUserId, int studentUserId, CancellationToken ct)
        {
            var linked = await _context.ParentStudentLinks
                .AnyAsync(l => l.ParentUserId == parentUserId && l.StudentUserId == studentUserId, ct);
            if (!linked) throw new UnauthorizedAccessException("Parent is not linked to this student");

            var hasSub = await _accessService.HasActiveSubscriptionAsync(studentUserId, ct);
            if (!hasSub) throw new UnauthorizedAccessException("Student does not have an active subscription.");
        }

        public async Task ValidateTeacherClassLinkAsync(int teacherUserId, int classId, int subjectId, CancellationToken ct)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == teacherUserId, ct);
            if (teacher == null) throw new UnauthorizedAccessException("Teacher profile not found.");

            var assignment = await _context.TeachingAssignments
                .AnyAsync(ta => ta.TeacherId == teacher.TeacherId && ta.ClassId == classId && ta.SubjectId == subjectId && ta.IsActive, ct);
            
            if (!assignment) throw new UnauthorizedAccessException("Teacher is not assigned to this class and subject.");
        }

        public async Task ValidateTeacherStudentLinkAsync(int teacherUserId, int studentUserId, int subjectId, CancellationToken ct)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == teacherUserId, ct);
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == studentUserId, ct);

            if (teacher == null || student == null) throw new UnauthorizedAccessException("Teacher or Student not found.");

            // Check if student is in any class taught by this teacher for this subject
            var isAssigned = await _context.StudentClasses
                .Join(_context.TeachingAssignments, 
                      sc => sc.ClassId, 
                      ta => ta.ClassId, 
                      (sc, ta) => new { sc, ta })
                .AnyAsync(x => x.sc.StudentId == student.StudentId 
                            && x.ta.TeacherId == teacher.TeacherId 
                            && x.ta.SubjectId == subjectId 
                            && x.ta.IsActive, ct);

            if (!isAssigned) throw new UnauthorizedAccessException("Teacher does not teach this student in this subject.");
        }
    }
}
