using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Services
{
    public class AdminUserService : IAdminUserService
    {
        private readonly Context _db;
        private readonly IPasswordService _passwordService;

        public AdminUserService(Context db, IPasswordService passwordService)
        {
            _db = db;
            _passwordService = passwordService;
        }

        public async Task<PagedResult<AdminUserDto>> GetUsersAsync(int pageNumber, int pageSize, string? role, CancellationToken ct = default)
        {
            var query = _db.Users.Include(u => u.Role).AsQueryable();

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.Role.Name == role);
            }

            var totalCount = await query.CountAsync(ct);
            var items = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new AdminUserDto(
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.Role.Name,
                    u.IsActive,
                    u.CreatedAt,
                    _db.Subscriptions.Any(s => s.UserId == u.UserId && s.Status == Masarak.Domain.Enums.SubscriptionStatus.Active),
                    _db.Students.Where(s => s.UserId == u.UserId).Select(s => (int?)s.GradeId).FirstOrDefault(),
                    _db.Teachers.Where(t => t.UserId == u.UserId).Select(t => t.Specialization).FirstOrDefault(),
                    _db.Parents.Where(p => p.UserId == u.UserId).SelectMany(p => p.ParentStudents).Select(ps => ps.Student.UserId).ToList()
                ))
                .ToListAsync(ct);

            return new PagedResult<AdminUserDto>(items, totalCount, pageNumber, pageSize);
        }

        public async Task<IEnumerable<TeacherDto>> GetAllTeachersAsync(CancellationToken ct = default)
        {
            return await _db.Teachers
                .Include(t => t.User)
                .Select(t => new TeacherDto(
                    t.TeacherId,
                    t.UserId,
                    t.User.FullName,
                    t.User.Email,
                    t.Specialization,
                    t.HiringDate,
                    t.Bio,
                    t.User.IsActive
                ))
                .ToListAsync(ct);
        }

        public async Task<AdminUserDto> CreateUserAsync(AdminCreateUserRequest request, CancellationToken ct = default)
        {
            var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == request.Role, ct);
            if (role == null) throw new InvalidOperationException($"Role {request.Role} not found.");

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            if (await _db.Users.AnyAsync(u => u.Email == normalizedEmail, ct))
                throw new InvalidOperationException("Email is already in use.");

            var user = new User
            {
                FullName = request.FullName,
                Email = normalizedEmail,
                PasswordHash = _passwordService.HashPassword(request.Password),
                RoleId = role.RoleId,
                Country = request.Country,
                IsActive = true,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            await _db.Users.AddAsync(user, ct);
            await _db.SaveChangesAsync(ct);

            // If teacher or student, create profile
            if (role.Name == "Teacher")
            {
                _db.Teachers.Add(new Teacher { 
                    UserId = user.UserId, 
                    Specialization = request.Specialization,
                    HiringDate = DateTime.UtcNow 
                });
                await _db.SaveChangesAsync(ct);
            }
            else if (role.Name == "Student")
            {
                // Assign to provided grade, or fallback to first grade
                var gradeId = request.GradeId;
                if (gradeId == null || gradeId == 0)
                {
                    var firstGrade = await _db.Grades.OrderBy(g => g.Order).FirstOrDefaultAsync(ct);
                    gradeId = firstGrade?.GradeId;
                }

                if (gradeId != null)
                {
                    _db.Students.Add(new Student { UserId = user.UserId, GradeId = gradeId.Value, EnrollmentDate = DateTime.UtcNow, AcademicStatus = "Active" });
                    await _db.SaveChangesAsync(ct);
                }
            }
            else if (role.Name == "Parent")
            {
                var parent = new Parent { UserId = user.UserId };
                _db.Parents.Add(parent);
                await _db.SaveChangesAsync(ct);

                if (request.StudentIds != null && request.StudentIds.Any())
                {
                    foreach (var studentId in request.StudentIds)
                    {
                        // Assume studentId refers to UserId of student, so we must find the actual StudentId
                        var student = await _db.Students.FirstOrDefaultAsync(s => s.UserId == studentId, ct);
                        if (student != null)
                        {
                            _db.ParentStudents.Add(new ParentStudent
                            {
                                ParentId = parent.ParentId,
                                StudentId = student.StudentId,
                                Relationship = "Guardian"
                            });
                        }
                    }
                    await _db.SaveChangesAsync(ct);
                }
            }

            return new AdminUserDto(
                user.UserId,
                user.FullName,
                user.Email,
                role.Name,
                user.IsActive,
                user.CreatedAt,
                false,
                request.GradeId,
                request.Specialization,
                request.StudentIds ?? new List<int>()
            );
        }

        public async Task DeleteUserAsync(int userId, CancellationToken ct = default)
        {
            var user = await _db.Users.FindAsync(new object[] { userId }, ct);
            if (user == null) throw new InvalidOperationException("User not found.");

            user.IsActive = false; // Soft delete
            await _db.SaveChangesAsync(ct);
        }
    }
}