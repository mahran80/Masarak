using Masarak.Domain.Enums;

namespace Masarak.Application.DTOs
{


    public record AdminCreateUserRequest
    {
        public string Email { get; init; } = null!;
        public string Password { get; init; } = null!;
        public string FullName { get; init; } = null!;
        public string Role { get; init; } = null!; // "Student", "Teacher", "Parent", "Admin"
        public string? Phone { get; init; }
        public string? Country { get; init; }
        public int? GradeId { get; init; }
        public string? Specialization { get; init; }
        public List<int>? StudentIds { get; init; }
    }

    public record TeacherDto(
        int TeacherId,
        int UserId,
        string FullName,
        string Email,
        string? Specialization,
        DateTime HiringDate,
        string? Bio,
        bool IsActive
    );
}