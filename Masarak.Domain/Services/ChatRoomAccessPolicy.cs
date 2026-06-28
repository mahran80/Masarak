using Masarak.Domain.Constants;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;

namespace Masarak.Domain.Services
{
    /// <summary>
    /// Phase 4: Determines whether a user can join a specific chat room
    /// based on their role and enrollment/teaching assignments.
    ///
    /// Access rules:
    ///   Student: can join GradeCommunity rooms for their enrolled grade only
    ///   Teacher: can join TeachersCommunity + GradeCommunity for grades they teach
    ///   Parent:  read-only access to GradeCommunity for their linked students' grades
    ///   Admin:   all rooms
    /// </summary>
    public class ChatRoomAccessPolicy
    {
        /// <summary>
        /// Checks if a user with the given role can join the specified room.
        /// gradeIds = the grade IDs the user is associated with (enrolled grades for students,
        /// taught grades for teachers, linked students' grades for parents).
        /// </summary>
        public bool CanJoin(string role, IEnumerable<int> userGradeIds, ChatRoom room)
        {
            if (role == AppRoles.Admin)
                return true;

            if (room.RoomType == ChatRoomType.TeachersCommunity)
                return role == AppRoles.Teacher;

            if (room.RoomType == ChatRoomType.GradeCommunity && room.GradeId.HasValue)
            {
                return role switch
                {
                    AppRoles.Student => userGradeIds.Contains(room.GradeId.Value),
                    AppRoles.Teacher => userGradeIds.Contains(room.GradeId.Value),
                    AppRoles.Parent  => userGradeIds.Contains(room.GradeId.Value),
                    _ => false
                };
            }

            return false;
        }
    }
}
