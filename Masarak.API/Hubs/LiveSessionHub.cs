using System.Security.Claims;
using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Masarak.API.Hubs
{
    [Authorize]
    public class LiveSessionHub : Hub
    {
        // Simple in-memory tracker for active session participants
        private static readonly ConcurrentDictionary<string, List<object>> _activeSessions = new();

        public async Task JoinSession(int sessionId)
        {
            var userId = Context.User?.FindFirstValue("userid");
            var name = Context.User?.FindFirstValue("name");
            var role = Context.User?.FindFirstValue(ClaimTypes.Role);
            var groupName = $"session:{sessionId}";

            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

            var participant = new {
                Uid = userId,
                Name = name,
                Role = role
            };

            // Add to tracker
            var participants = _activeSessions.GetOrAdd(groupName, _ => new List<object>());
            lock (participants)
            {
                // Remove existing if reconnecting
                participants.RemoveAll(p => ((dynamic)p).Uid == userId);
                participants.Add(participant);
            }

            // Send existing participants to the user who just joined
            await Clients.Caller.SendAsync("ExistingParticipants", participants);

            // Broadcast that a user joined to everyone else in the room
            await Clients.OthersInGroup(groupName).SendAsync("UserJoined", participant);
        }

        public async Task LeaveSession(int sessionId)
        {
            var userId = Context.User?.FindFirstValue("userid");
            var groupName = $"session:{sessionId}";

            if (_activeSessions.TryGetValue(groupName, out var participants))
            {
                lock (participants)
                {
                    participants.RemoveAll(p => ((dynamic)p).Uid == userId);
                }
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
            await Clients.Group(groupName).SendAsync("UserLeft", userId);
        }

        // --- Whiteboard Sync ---
        public async Task DrawWhiteboard(int sessionId, object drawData)
        {
            // Broadcast drawing action to others (exclude sender to prevent double drawing)
            await Clients.GroupExcept($"session:{sessionId}", Context.ConnectionId)
                         .SendAsync("OnWhiteboardDraw", drawData);
        }

        public async Task ClearWhiteboard(int sessionId)
        {
            await Clients.OthersInGroup($"session:{sessionId}")
                         .SendAsync("OnWhiteboardClear");
        }

        public async Task ToggleWhiteboard(int sessionId, bool isActive)
        {
            await Clients.OthersInGroup($"session:{sessionId}")
                         .SendAsync("OnWhiteboardToggled", isActive);
        }

        // --- Permissions ---
        public async Task GrantWhiteboardAccess(int sessionId, string targetUserId)
        {
            if (IsTeacher())
            {
                await Clients.Group($"session:{sessionId}").SendAsync("WhiteboardAccessGranted", targetUserId);
            }
        }

        public async Task RevokeWhiteboardAccess(int sessionId, string targetUserId)
        {
            if (IsTeacher())
            {
                await Clients.Group($"session:{sessionId}").SendAsync("WhiteboardAccessRevoked", targetUserId);
            }
        }

        private bool IsTeacher()
        {
            return Context.User?.FindFirstValue(ClaimTypes.Role) == "Teacher";
        }
    }
}
