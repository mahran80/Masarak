using System.Security.Claims;
using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Phase 4: Chat REST endpoints — room listing, message history, and message deletion.
    /// Real-time messaging is handled via SignalR ChatHub at /hubs/chat.
    /// </summary>
    [ApiController]
    [Route("api/chat")]
    [Authorize(Policy = AppPolicies.AnyAuthenticated)]
    [Produces("application/json")]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue("userid") ?? "0");
        private string GetRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

        /// <summary>
        /// Gets all accessible chat rooms for the current user.
        /// </summary>
        [HttpGet("rooms")]
        [ProducesResponseType(typeof(IEnumerable<ChatRoomDto>), 200)]
        public async Task<IActionResult> GetMyRooms(CancellationToken ct)
        {
            try
            {
                var rooms = await _chatService.GetMyRoomsAsync(GetUserId(), GetRole(), ct);
                return Ok(rooms);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        }

        /// <summary>
        /// Gets paginated message history for a chat room.
        /// </summary>
        [HttpGet("rooms/{roomId}/messages")]
        [ProducesResponseType(typeof(object), 200)]
        public async Task<IActionResult> GetRoomMessages(
            int roomId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            CancellationToken ct = default)
        {
            if (pageSize > 100) pageSize = 100; // max 100 per page per spec

            try
            {
                var (messages, totalCount) = await _chatService.GetRoomMessagesAsync(
                    GetUserId(), GetRole(), roomId, page, pageSize, ct);

                Response.Headers["X-Total-Count"] = totalCount.ToString();

                return Ok(new
                {
                    items = messages,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    hasNextPage = page < (int)Math.Ceiling(totalCount / (double)pageSize),
                    hasPreviousPage = page > 1
                });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }

        /// <summary>
        /// Soft-deletes a chat message. Only the sender or an admin can delete.
        /// </summary>
        [HttpDelete("messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(int messageId, CancellationToken ct)
        {
            try
            {
                await _chatService.DeleteMessageAsync(GetUserId(), GetRole(), messageId, ct);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (UnauthorizedAccessException ex) { return StatusCode(403, new { message = ex.Message }); }
        }
    }
}
