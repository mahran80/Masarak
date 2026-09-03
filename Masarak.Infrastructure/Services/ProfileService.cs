using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Constants;
using Masarak.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace Masarak.Infrastructure.Services
{
    public class ProfileService : IProfileService
    {
        private readonly Context _db;
        private readonly IFileStorageService _fileStorage;
        private const string AvatarsContainer = "avatars";

        public ProfileService(Context db, IFileStorageService fileStorage)
        {
            _db = db;
            _fileStorage = fileStorage;
        }

        public async Task<UserProfileDto?> GetProfileAsync(int userId, string role)
        {
            var user = await _db.Users
                .Include(u => u.Role)
                .Include(u => u.Teacher)
                .Include(u => u.Parent)
                .Include(u => u.Student)
                .ThenInclude(s => s!.Grade)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return null;

            var dto = new UserProfileDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.Name,
                Phone = user.Phone,
                Country = user.Country,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt
            };

            if (role == AppRoles.Teacher && user.Teacher != null)
            {
                dto.Bio = user.Teacher.Bio;
                dto.Headline = user.Teacher.Specialization;
                dto.TeacherDetails = new TeacherProfileDetails
                {
                    HiringDate = user.Teacher.HiringDate
                };
            }
            else if (role == AppRoles.Parent && user.Parent != null)
            {
                dto.Bio = user.Parent.Bio;
                dto.Headline = user.Parent.Headline;
                
                // Load Linked Children using the new Phase 4 ParentStudentLink table
                var children = await _db.ParentStudentLinks
                    .Include(l => l.Student)
                    .ThenInclude(u => u.Student)
                    .ThenInclude(s => s!.Grade)
                    .Include(l => l.Student)
                    .ThenInclude(u => u.Student)
                    .ThenInclude(s => s!.StudentClasses)
                    .ThenInclude(sc => sc.Class)
                    .Where(l => l.ParentUserId == userId)
                    .Select(l => new LinkedChildDto
                    {
                        StudentId = l.Student.Student!.StudentId,
                        UserId = l.StudentUserId,
                        FullName = l.Student.FullName,
                        AvatarUrl = l.Student.AvatarUrl,
                        GradeName = l.Student.Student.Grade.Name,
                        ClassName = l.Student.Student.StudentClasses
                            .Where(sc => sc.IsActive)
                            .Select(sc => sc.Class.Name)
                            .FirstOrDefault(),
                        HasActiveSubscription = _db.Subscriptions.Any(sub => 
                            sub.UserId == l.StudentUserId && 
                            sub.Status == Masarak.Domain.Enums.SubscriptionStatus.Active)
                    })
                    .ToListAsync();
                    
                dto.LinkedChildren = children;
            }
            else if (role == AppRoles.Student && user.Student != null)
            {
                dto.Bio = user.Student.Bio;
                dto.Headline = user.Student.Headline;
                dto.StudentDetails = new StudentProfileDetails
                {
                    EnrollmentDate = user.Student.EnrollmentDate,
                    AcademicStatus = user.Student.AcademicStatus,
                    GradeId = user.Student.GradeId
                };
            }

            return dto;
        }

        public async Task<UserProfileDto?> GetStudentProfileForParentAsync(int parentUserId, int childUserId)
        {
            var linkExists = await IsParentLinkedToStudent(parentUserId, childUserId);
                
            if (!linkExists) return null; // Parent is not linked to this student

            return await GetProfileAsync(childUserId, AppRoles.Student);
        }

        public async Task<MessageResponse> UpdateProfileAsync(int userId, string role, UpdateProfileDto request)
        {
            if (role == AppRoles.Student)
                return new MessageResponse { Success = false, Message = "Students cannot edit their profile." };

            var user = await _db.Users
                .Include(u => u.Teacher)
                .Include(u => u.Parent)
                .Include(u => u.Student)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return new MessageResponse { Success = false, Message = "User not found." };

            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.Country = request.Country;

            if (role == AppRoles.Teacher && user.Teacher != null)
            {
                user.Teacher.Bio = request.Bio;
                user.Teacher.Specialization = request.Headline;
            }
            else if (role == AppRoles.Parent && user.Parent != null)
            {
                user.Parent.Bio = request.Bio;
                user.Parent.Headline = request.Headline;
            }
            else if (role == AppRoles.Student && user.Student != null)
            {
                user.Student.Bio = request.Bio;
                user.Student.Headline = request.Headline;
            }

            await _db.SaveChangesAsync();
            return new MessageResponse { Success = true, Message = "Profile updated successfully." };
        }

        public async Task<MessageResponse> UploadAvatarAsync(int userId, Stream fileStream, string fileName, long contentLength)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return new MessageResponse { Success = false, Message = "User not found." };


            if (fileStream == null || contentLength == 0)
                return new MessageResponse { Success = false, Message = "File is empty." };

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
                return new MessageResponse { Success = false, Message = "Invalid image type. Allowed: jpg, jpeg, png, gif." };

            // 5MB limit
            if (contentLength > 5 * 1024 * 1024)
                return new MessageResponse { Success = false, Message = "Image size exceeds 5MB limit." };

            var (blobName, publicUrl) = await _fileStorage.UploadAsync(fileStream, fileName, AvatarsContainer);

            user.AvatarUrl = publicUrl;
            await _db.SaveChangesAsync();

            return new MessageResponse { Success = true, Message = publicUrl };
        }

        public async Task<MessageResponse> RemoveAvatarAsync(int userId)
        {
            var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return new MessageResponse { Success = false, Message = "User not found." };
                
            if (user.Role?.Name == AppRoles.Student)
                return new MessageResponse { Success = false, Message = "Students cannot remove avatars." };

            user.AvatarUrl = null;
            await _db.SaveChangesAsync();

            return new MessageResponse { Success = true, Message = "Avatar removed successfully." };
        }

        private async Task<bool> IsParentLinkedToStudent(int parentUserId, int childUserId)
        {
            return await _db.ParentStudentLinks
                .AnyAsync(l => l.ParentUserId == parentUserId && l.StudentUserId == childUserId);
        }

        public async Task<MessageResponse> UpdateStudentProfileForParentAsync(int parentUserId, int childUserId, UpdateProfileDto request)
        {
            if (!await IsParentLinkedToStudent(parentUserId, childUserId))
                return new MessageResponse { Success = false, Message = "Student not found or access denied." };

            var user = await _db.Users
                .Include(u => u.Student)
                .FirstOrDefaultAsync(u => u.UserId == childUserId);

            if (user == null || user.Student == null)
                return new MessageResponse { Success = false, Message = "Student not found." };

            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.Country = request.Country;
            user.Student.Bio = request.Bio;
            user.Student.Headline = request.Headline;

            await _db.SaveChangesAsync();
            return new MessageResponse { Success = true, Message = "Student profile updated successfully." };
        }

        public async Task<MessageResponse> UploadStudentAvatarForParentAsync(int parentUserId, int childUserId, Stream fileStream, string fileName, long contentLength)
        {
            if (!await IsParentLinkedToStudent(parentUserId, childUserId))
                return new MessageResponse { Success = false, Message = "Student not found or access denied." };

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == childUserId);
            if (user == null)
                return new MessageResponse { Success = false, Message = "Student not found." };

            if (fileStream == null || contentLength == 0)
                return new MessageResponse { Success = false, Message = "File is empty." };

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
                return new MessageResponse { Success = false, Message = "Invalid image type. Allowed: jpg, jpeg, png, gif." };

            if (contentLength > 5 * 1024 * 1024)
                return new MessageResponse { Success = false, Message = "Image size exceeds 5MB limit." };

            var (blobName, publicUrl) = await _fileStorage.UploadAsync(fileStream, fileName, AvatarsContainer);

            user.AvatarUrl = publicUrl;
            await _db.SaveChangesAsync();

            return new MessageResponse { Success = true, Message = publicUrl };
        }

        public async Task<MessageResponse> RemoveStudentAvatarForParentAsync(int parentUserId, int childUserId)
        {
            if (!await IsParentLinkedToStudent(parentUserId, childUserId))
                return new MessageResponse { Success = false, Message = "Student not found or access denied." };

            var user = await _db.Users.FirstOrDefaultAsync(u => u.UserId == childUserId);
            if (user == null)
                return new MessageResponse { Success = false, Message = "Student not found." };

            user.AvatarUrl = null;
            await _db.SaveChangesAsync();

            return new MessageResponse { Success = true, Message = "Avatar removed successfully." };
        }
    }
}
