using Masarak.Application.DTOs;
using System.IO;
using System.Threading.Tasks;

namespace Masarak.Application.Interfaces
{
    public interface IProfileService
    {
        Task<UserProfileDto?> GetProfileAsync(int userId, string role);
        Task<UserProfileDto?> GetStudentProfileForParentAsync(int parentUserId, int childUserId);
        Task<MessageResponse> UpdateProfileAsync(int userId, string role, UpdateProfileDto request);
        Task<MessageResponse> UploadAvatarAsync(int userId, Stream fileStream, string fileName, long contentLength);
        Task<MessageResponse> RemoveAvatarAsync(int userId);
        
        Task<MessageResponse> UpdateStudentProfileForParentAsync(int parentUserId, int childUserId, UpdateProfileDto request);
        Task<MessageResponse> UploadStudentAvatarForParentAsync(int parentUserId, int childUserId, Stream fileStream, string fileName, long contentLength);
        Task<MessageResponse> RemoveStudentAvatarForParentAsync(int parentUserId, int childUserId);
    }
}
