using Masarak.Domain.Enums;

namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Phase 4: Chat room for community messaging.
    /// One GradeCommunity room per grade, one TeachersCommunity room.
    /// Messages are persisted to DB.
    /// </summary>
    public class ChatRoom
    {
        public int                          ChatRoomId { get; private set; }
        public string                       Name       { get; private set; } = null!;  // "Grade 5 Community", "Teachers Community"
        public ChatRoomType                 RoomType   { get; private set; }           // GradeCommunity, TeachersCommunity
        public int?                         GradeId    { get; private set; }           // set for GradeCommunity rooms
        public bool                         IsActive   { get; private set; }

        // ── Navigation ──────────────────────────────────────────────────────
        public virtual Grade?                       Grade    { get; private set; }
        public virtual ICollection<ChatMessage> Messages { get; private set; } = new List<ChatMessage>();

        // ── Private parameterless constructor (for EF Core) ─────────────────
        private ChatRoom() { }

        // ── Factory Methods ─────────────────────────────────────────────────
        public static ChatRoom CreateGradeCommunity(int gradeId, string name)
            => new()
            {
                Name     = name,
                RoomType = ChatRoomType.GradeCommunity,
                GradeId  = gradeId,
                IsActive = true
            };

        public static ChatRoom CreateTeachersCommunity()
            => new()
            {
                Name     = "Teachers Community",
                RoomType = ChatRoomType.TeachersCommunity,
                GradeId  = null,
                IsActive = true
            };
    }
}
