namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Phase 4: A message sent in a ChatRoom.
    /// Messages are persisted to DB and soft-deleted via IsDeleted.
    /// Max content length: 1000 characters.
    /// </summary>
    public class ChatMessage
    {
        public int      ChatMessageId { get; private set; }
        public int      ChatRoomId    { get; private set; }  // FK → chat_rooms.ChatRoomId
        public int      SenderUserId  { get; private set; }  // FK → users.UserId
        public string   Content       { get; private set; } = null!;  // max 1000 chars
        public DateTime SentAt        { get; private set; }
        public bool     IsDeleted     { get; private set; }

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual ChatRoom ChatRoom { get; private set; } = null!;
        public virtual User     Sender   { get; private set; } = null!;

        // ── Private parameterless constructor (for EF Core) ─────────────────
        private ChatMessage() { }

        // ── Factory ─────────────────────────────────────────────────────────
        public static ChatMessage Create(int chatRoomId, int senderUserId, string content)
            => new()
            {
                ChatRoomId   = chatRoomId,
                SenderUserId = senderUserId,
                Content      = content,
                SentAt       = DateTime.UtcNow,
                IsDeleted    = false
            };

        // ── Domain Methods ──────────────────────────────────────────────────
        public void SoftDelete() => IsDeleted = true;
    }
}
