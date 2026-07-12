using System.ComponentModel.DataAnnotations;

namespace Masarak.Application.DTOs
{
    public class UserProfileDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Country { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public string? Headline { get; set; }
        public DateTime CreatedAt { get; set; }

        // Role specific properties
        public TeacherProfileDetails? TeacherDetails { get; set; }
        public StudentProfileDetails? StudentDetails { get; set; }
        
        // Only populated for Parents viewing their children
        public IEnumerable<LinkedChildDto>? LinkedChildren { get; set; }
    }

    public class TeacherProfileDetails
    {
        public DateTime HiringDate { get; set; }
    }

    public class StudentProfileDetails
    {
        public DateTime EnrollmentDate { get; set; }
        public string AcademicStatus { get; set; } = null!;
        public int GradeId { get; set; }
    }

    public class LinkedChildDto
    {
        public int StudentId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? GradeName { get; set; }
        public string? ClassName { get; set; }
        public bool HasActiveSubscription { get; set; }
    }

    public class UpdateProfileDto
    {
        [Required, MaxLength(150)]
        public string FullName { get; set; } = null!;

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        public string? Bio { get; set; }
        
        [MaxLength(150)]
        public string? Headline { get; set; }
    }
}
