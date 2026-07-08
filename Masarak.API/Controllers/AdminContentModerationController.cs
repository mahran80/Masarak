using Masarak.API.Policies;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Phase 6: Admin content moderation endpoint.
    /// Allows admin to deactivate inappropriate content items.
    /// </summary>
    [ApiController]
    [Route("api/admin/content")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class AdminContentModerationController : ControllerBase
    {
        private readonly IContentItemRepository _contentRepo;
        private readonly Masarak.Infrastructure.Persistence.Context _context;

        public AdminContentModerationController(IContentItemRepository contentRepo, Masarak.Infrastructure.Persistence.Context context)
        {
            _contentRepo = contentRepo;
            _context = context;
        }

        /// <summary>
        /// GET /api/admin/content — Get all active content items for moderation.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetContentItems(CancellationToken ct = default)
        {
            var items = await _context.ContentItems
                .Include(c => c.TeachingAssignment)
                    .ThenInclude(t => t.Teacher)
                        .ThenInclude(t => t.User)
                .Include(c => c.TeachingAssignment)
                    .ThenInclude(t => t.Subject)
                        .ThenInclude(s => s.Grade)
                .Where(c => c.IsActive)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new {
                    Id = c.ContentItemId,
                    Title = c.Title,
                    Type = c.Type.ToString(),
                    TeacherName = c.TeachingAssignment.Teacher.User.FullName,
                    SubjectName = c.TeachingAssignment.Subject.Name,
                    GradeLabel = c.TeachingAssignment.Subject.Grade.Name,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync(ct);

            return Ok(items);
        }

        /// <summary>
        /// PUT /api/admin/content/{id}/moderate — Deactivate a content item for moderation.
        /// </summary>
        [HttpPut("{id}/moderate")]
        public async Task<IActionResult> ModerateContent(int id, [FromBody] ModerateContentRequest? request = null, CancellationToken ct = default)
        {
            var contentItem = await _contentRepo.GetByIdAsync(id, ct);
            if (contentItem == null)
                return NotFound(new { Code = "CONTENT_NOT_FOUND", Message = $"Content item with ID {id} not found." });

            contentItem.Deactivate();
            await _contentRepo.UpdateAsync(contentItem, ct);

            return NoContent();
        }
    }

    /// <summary>Request body for moderating content.</summary>
    public class ModerateContentRequest
    {
        public string? Reason { get; set; }
    }
}
