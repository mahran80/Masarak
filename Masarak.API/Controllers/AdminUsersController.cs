using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Enums;
using Masarak.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Masarak.Infrastructure.Persistence;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Phase 6: Admin user management endpoints.
    /// Provides user listing, detail view, activation/deactivation, and password reset.
    /// Restricted to Admin role only.
    /// </summary>
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class AdminUsersController : ControllerBase
    {
        private readonly IAdminUserRepository _adminUserRepo;
        private readonly IPasswordService _passwordService;
        private readonly IUserRepository _userRepo;

        public AdminUsersController(
            IAdminUserRepository adminUserRepo,
            IPasswordService passwordService,
            IUserRepository userRepo)
        {
            _adminUserRepo = adminUserRepo;
            _passwordService = passwordService;
            _userRepo = userRepo;
        }

        /// <summary>
        /// GET /api/admin/users — List all users with optional role filter and search.
        /// Query params: role, search, page, pageSize
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllUsers(
            [FromQuery] string? role = null,
            [FromQuery] string? search = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            var (items, totalCount) = await _adminUserRepo.GetAllAsync(role, search, page, pageSize, ct);

            // Workaround to populate Specialization, GradeId, StudentIds without modifying Masarak.Infrastructure 
            // to bypass the local Antivirus FileLoadException on newly compiled Infrastructure DLLs.
            var dbContext = HttpContext.RequestServices.GetService<Context>();
            if (dbContext != null && items.Any())
            {
                var userIds = items.Select(i => i.UserId).ToList();
                var usersWithDetails = await dbContext.Users
                    .Where(u => userIds.Contains(u.UserId))
                    .Select(u => new 
                    { 
                        u.UserId, 
                        GradeId = u.Student != null ? (int?)u.Student.GradeId : null,
                        Specialization = u.Teacher != null ? u.Teacher.Specialization : null,
                        StudentIds = u.ParentStudentLinks.Select(l => l.StudentUserId).ToList()
                    })
                    .ToDictionaryAsync(u => u.UserId, ct);

                items = items.Select(i => 
                {
                    if (usersWithDetails.TryGetValue(i.UserId, out var details))
                    {
                        return i with 
                        { 
                            GradeId = details.GradeId, 
                            Specialization = details.Specialization, 
                            StudentIds = details.StudentIds 
                        };
                    }
                    return i;
                }).ToList();
            }

            Response.Headers["X-Total-Count"] = totalCount.ToString();

            return Ok(new
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                HasNextPage = page < (int)Math.Ceiling(totalCount / (double)pageSize),
                HasPreviousPage = page > 1
            });
        }

        /// <summary>
        /// GET /api/admin/users/{id} — Get detailed user information.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserDetail(int id, CancellationToken ct = default)
        {
            var user = await _adminUserRepo.GetByIdWithDetailsAsync(id, ct);
            if (user == null)
                return NotFound(new { Code = "USER_NOT_FOUND", Message = $"User with ID {id} not found." });

            var examsTaken = user.Student?.StudentExams?.Count ?? 0;
            var assignmentsSubmitted = user.Student?.Submissions?.Count ?? 0;
            var hasActiveSub = user.Subscriptions?.Any(s => s.Status == SubscriptionStatus.Active) ?? false;

            var dto = new AdminUserDetailDto(
                user.UserId,
                user.FullName,
                user.Email,
                user.Role.Name,
                user.IsActive,
                user.CreatedAt,
                hasActiveSub,
                examsTaken,
                assignmentsSubmitted,
                0m); // AttendancePercentage — requires separate query

            return Ok(dto);
        }

        /// <summary>
        /// Request body for updating a user's details.
        /// Role cannot be changed — only name, email, phone, and role-specific fields.
        /// </summary>
        public class AdminUpdateUserRequest
        {
            public string? FullName { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            // Role-specific
            public int? GradeId { get; set; }          // Student
            public string? Specialization { get; set; } // Teacher
            public List<int>? StudentIds { get; set; }  // Parent
        }

        /// <summary>
        /// PUT /api/admin/users/{id} — Update user details (name, email, phone, role-specific fields).
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] AdminUpdateUserRequest request, CancellationToken ct = default)
        {
            var user = await _userRepo.GetByIdAsync(id, ct);
            if (user == null)
                return NotFound(new { Code = "USER_NOT_FOUND", Message = $"User with ID {id} not found." });

            // Update basic fields if provided
            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName.Trim();

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                var normalizedEmail = request.Email.Trim().ToLowerInvariant();
                var dbContext = HttpContext.RequestServices.GetService<Context>()!;
                var emailTaken = await dbContext.Users.AnyAsync(u => u.Email == normalizedEmail && u.UserId != id, ct);
                if (emailTaken)
                    return BadRequest(new { Code = "EMAIL_TAKEN", Message = "البريد الإلكتروني مستخدم بالفعل." });
                user.Email = normalizedEmail;
            }

            user.Phone = request.Phone; // nullable, always set

            await _userRepo.UpdateAsync(user, ct);

            // Update role-specific fields using Context directly
            var db = HttpContext.RequestServices.GetService<Context>()!;

            var role = await db.Roles.FirstOrDefaultAsync(r => r.RoleId == user.RoleId, ct);
            var roleName = role?.Name ?? "";

            if (roleName == "Student" && request.GradeId.HasValue)
            {
                var student = await db.Students.FirstOrDefaultAsync(s => s.UserId == id, ct);
                if (student != null)
                {
                    student.GradeId = request.GradeId.Value;
                    await db.SaveChangesAsync(ct);
                }
            }
            else if (roleName == "Teacher")
            {
                var teacher = await db.Teachers.FirstOrDefaultAsync(t => t.UserId == id, ct);
                if (teacher != null)
                {
                    teacher.Specialization = request.Specialization;
                    await db.SaveChangesAsync(ct);
                }
            }
            else if (roleName == "Parent" && request.StudentIds != null)
            {
                var parent = await db.Parents.FirstOrDefaultAsync(p => p.UserId == id, ct);
                if (parent != null)
                {
                    // Remove existing links
                    var existingLinks = db.ParentStudents.Where(ps => ps.ParentId == parent.ParentId);
                    db.ParentStudents.RemoveRange(existingLinks);
                    
                    // Add new links
                    foreach (var studentUserId in request.StudentIds)
                    {
                        var student = await db.Students.FirstOrDefaultAsync(s => s.UserId == studentUserId, ct);
                        if (student != null)
                        {
                            db.ParentStudents.Add(new Masarak.Domain.Entities.ParentStudent
                            {
                                ParentId = parent.ParentId,
                                StudentId = student.StudentId,
                                Relationship = "Guardian"
                            });
                        }
                    }
                    await db.SaveChangesAsync(ct);
                }
            }

            return Ok(new AdminUserDto(
                user.UserId,
                user.FullName,
                user.Email,
                roleName,
                user.IsActive,
                user.CreatedAt,
                user.Subscriptions?.Any(s => s.Status == Masarak.Domain.Enums.SubscriptionStatus.Active) ?? false,
                request.GradeId,
                request.Specialization,
                request.StudentIds
            ));
        }

        /// <summary>
        /// PUT /api/admin/users/{id}/deactivate — Deactivate a user account.
        /// </summary>
        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> DeactivateUser(int id, [FromBody] DeactivateUserRequest? request = null, CancellationToken ct = default)
        {
            var user = await _userRepo.GetByIdAsync(id, ct);
            if (user == null)
                return NotFound(new { Code = "USER_NOT_FOUND", Message = $"User with ID {id} not found." });

            await _adminUserRepo.DeactivateAsync(id, ct);
            return NoContent();
        }

        /// <summary>
        /// PUT /api/admin/users/{id}/activate — Activate a user account.
        /// </summary>
        [HttpPut("{id}/activate")]
        public async Task<IActionResult> ActivateUser(int id, CancellationToken ct = default)
        {
            var user = await _userRepo.GetByIdAsync(id, ct);
            if (user == null)
                return NotFound(new { Code = "USER_NOT_FOUND", Message = $"User with ID {id} not found." });

            await _adminUserRepo.ActivateAsync(id, ct);
            return NoContent();
        }

        public class AdminResetPasswordRequest
        {
            public string? NewPassword { get; set; }
        }

        /// <summary>
        /// POST /api/admin/users/{id}/reset-password — Reset a user's password and return a temporary password.
        /// </summary>
        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, [FromBody] AdminResetPasswordRequest? request = null, CancellationToken ct = default)
        {
            var user = await _userRepo.GetByIdAsync(id, ct);
            if (user == null)
                return NotFound(new { Code = "USER_NOT_FOUND", Message = $"User with ID {id} not found." });

            // Use provided password or generate a temporary one
            var newPassword = string.IsNullOrWhiteSpace(request?.NewPassword) 
                ? GenerateTemporaryPassword() 
                : request.NewPassword;

            user.PasswordHash = _passwordService.HashPassword(newPassword);
            await _userRepo.UpdateAsync(user, ct);

            return Ok(new { password = newPassword });
        }

        private static string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
            var random = System.Security.Cryptography.RandomNumberGenerator.Create();
            var password = new char[12];
            var randomBytes = new byte[12];
            random.GetBytes(randomBytes);
            for (int i = 0; i < 12; i++)
                password[i] = chars[randomBytes[i] % chars.Length];
            return new string(password);
        }
    }

    /// <summary>Request body for deactivating a user.</summary>
    public class DeactivateUserRequest
    {
        public string? Reason { get; set; }
    }
}
