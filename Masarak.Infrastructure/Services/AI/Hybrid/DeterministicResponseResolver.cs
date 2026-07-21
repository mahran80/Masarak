using Masarak.Application.DTOs;
using Masarak.Domain.Enums;
using System;
using System.Collections.Generic;

namespace Masarak.Infrastructure.Services.AI.Hybrid
{
    public class DeterministicResponseResolver
    {
        // This is primarily for answering threshold questions without LLMs.
        // In the current AiAnalyticsService, EvaluatePerformanceAlertsAsync already does this purely with SQL.
        // We will just wrap that logic or expose helpers if needed.
        
        // Let's provide a fallback parent report if LLM fails
        public ParentReportDto GetDegradedParentReport(string studentName, string reportMonth, decimal avgScore, decimal attendance)
        {
            var perfLevel = avgScore >= 85 ? "Strong" : avgScore >= 70 ? "Average" : avgScore >= 50 ? "NeedsImprovement" : "AtRisk";
            
            return new ParentReportDto(
                studentName, 
                reportMonth, 
                avgScore, 
                attendance,
                new List<SubjectSummaryDto>(), 
                $"تم إعداد هذا التقرير كنسخة مبسطة. مستوى الطالب العام هو {perfLevel}.",
                DateTime.UtcNow
            ) { DataSource = "Quota_Exceeded_Degraded" };
        }

        public TeachingSuggestionDto GetDegradedTeachingSuggestion(string studentName, string subjectName)
        {
            return new TeachingSuggestionDto(
                studentName, 
                subjectName, 
                $"Consider providing additional practice for {studentName} in {subjectName}.",
                new[] { "Review weak areas", "Provide practice sheets", "Schedule one-on-one session" },
                DateTime.UtcNow
            ) { DataSource = "Quota_Exceeded_Degraded" };
        }
    }
}
