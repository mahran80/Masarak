using System;
using System.Collections.Generic;

namespace Masarak.Domain.Entities
{
    /// <summary>
    /// Represents a Lesson (topic/chapter) within a TeachingAssignment.
    /// Can group ContentItems, Exams, and Assignments.
    /// </summary>
    public class Lesson
    {
        public int      LessonId             { get; set; }
        public int      TeachingAssignmentId { get; set; }
        public string   Title                { get; set; } = null!;
        public string?  Description          { get; set; }
        public int      OrderNum             { get; set; }
        public bool     IsPublished          { get; set; } = false;
        public DateTime CreatedAt            { get; set; }

        // Navigation
        public virtual TeachingAssignment TeachingAssignment { get; set; } = null!;
        public virtual ICollection<ContentItem> ContentItems { get; set; } = new List<ContentItem>();
        public virtual ICollection<Exam>        Exams        { get; set; } = new List<Exam>();
        public virtual ICollection<Assignment>  Assignments  { get; set; } = new List<Assignment>();

        // Factory
        public static Lesson Create(int teachingAssignmentId, string title, string? description, int orderNum)
        {
            return new Lesson
            {
                TeachingAssignmentId = teachingAssignmentId,
                Title                = title,
                Description          = description,
                OrderNum             = orderNum,
                IsPublished          = false,
                CreatedAt            = DateTime.UtcNow
            };
        }

        public void Publish()   => IsPublished = true;
        public void Unpublish() => IsPublished = false;
        
        public void Update(string title, string? description)
        {
            Title = title;
            Description = description;
        }

        public void UpdateOrder(int orderNum)
        {
            OrderNum = orderNum;
        }
    }
}
