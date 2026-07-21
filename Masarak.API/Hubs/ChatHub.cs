using System.Security.Claims;
using Masarak.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Masarak.API.Hubs
{
    /// <summary>
    /// Phase 4: SignalR hub for real-time chat messaging.
    /// Client methods: ReceiveMessage, UserJoined, UserLeft
    /// Server methods: JoinRoom, LeaveRoom, SendMessage
    /// Groups are named "room:{chatRoomId}"
    /// </summary>
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IChatService _chatService;

        public ChatHub(IChatService chatService)
        {
            _chatService = chatService;
        }

        /// <summary>
        /// Joins a chat room — validates access then adds to SignalR group.
        /// </summary>
        public async Task JoinRoom(int chatRoomId)
        {
            var userId = GetUserId();
            var role = GetRole();
            var groupName = $"room:{chatRoomId}";

            // Validate access by trying to get messages (will throw if unauthorized)
            await _chatService.GetRoomMessagesAsync(userId, role, chatRoomId, 1, 1, CancellationToken.None);

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            var userName = Context.User?.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
            await Clients.Group(groupName).SendAsync("UserJoined", userName);
        }

        /// <summary>
        /// Leaves a chat room.
        /// </summary>
        public async Task LeaveRoom(int chatRoomId)
        {
            var groupName = $"room:{chatRoomId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

            var userName = Context.User?.FindFirstValue(ClaimTypes.Name) ?? "Unknown";
            await Clients.Group(groupName).SendAsync("UserLeft", userName);
        }

        /// <summary>
        /// Sends a message to a chat room — persists and broadcasts.
        /// </summary>
        public async Task SendMessage(int chatRoomId, string content)
        {
            var userId = GetUserId();
            var role = GetRole();

            var messageDto = await _chatService.SendMessageAsync(userId, role, chatRoomId, content, CancellationToken.None);

            var groupName = $"room:{chatRoomId}";
            await Clients.Group(groupName).SendAsync("ReceiveMessage", messageDto);
        }

        private int GetUserId() => int.Parse(Context.User?.FindFirstValue("userid") ?? "0");
        private string GetRole() => Context.User?.FindFirstValue(ClaimTypes.Role) ?? "";
    }
}
