using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    public class SubjectRepository : ISubjectRepository
    {
        private readonly Context _context;

        public SubjectRepository(Context context)
        {
            _context = context;
        }

        public async Task<Subject?> GetByIdAsync(int subjectId, CancellationToken ct = default)
        {
            return await _context.Subjects.FindAsync(new object[] { subjectId }, ct);
        }

        public async Task<IEnumerable<Subject>> GetByGradeIdAsync(int gradeId, CancellationToken ct = default)
        {
            return await _context.Subjects
                .Where(s => s.GradeId == gradeId)
                .OrderBy(s => s.Name)
                .ToListAsync(ct);
        }

        public async Task AddAsync(Subject subject, CancellationToken ct = default)
        {
            await _context.Subjects.AddAsync(subject, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(Subject subject, CancellationToken ct = default)
        {
            _context.Subjects.Update(subject);
            await _context.SaveChangesAsync(ct);
        }
    }
}
