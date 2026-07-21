using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    public class GradeRepository : IGradeRepository
    {
        private readonly Context _context;

        public GradeRepository(Context context)
        {
            _context = context;
        }

        public async Task<Grade?> GetByIdAsync(int gradeId, CancellationToken ct = default)
        {
            return await _context.Grades.FindAsync(new object[] { gradeId }, ct);
        }

        public async Task<IEnumerable<Grade>> GetAllActiveAsync(CancellationToken ct = default)
        {
            return await _context.Grades
                .Where(g => g.IsActive)
                .OrderBy(g => g.Order)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Grade>> GetAllAsync(CancellationToken ct = default)
        {
            return await _context.Grades
                .OrderBy(g => g.Order)
                .ToListAsync(ct);
        }

        public async Task AddAsync(Grade grade, CancellationToken ct = default)
        {
            await _context.Grades.AddAsync(grade, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(Grade grade, CancellationToken ct = default)
        {
            _context.Grades.Update(grade);
            await _context.SaveChangesAsync(ct);
        }
    }
}
