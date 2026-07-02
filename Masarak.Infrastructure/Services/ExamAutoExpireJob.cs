using Masarak.Application.Interfaces;
using Masarak.Domain.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Masarak.Infrastructure.Services
{
    /// <summary>
    /// Background service that periodically sweeps for StudentExam attempts 
    /// where ExpiresAt has passed but Status is still InProgress.
    /// It auto-submits them and triggers grading.
    /// </summary>
    public class ExamAutoExpireJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ExamAutoExpireJob> _logger;

        public ExamAutoExpireJob(IServiceProvider serviceProvider, ILogger<ExamAutoExpireJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ExamAutoExpireJob is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpiredExamsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing ExamAutoExpireJob.");
                }

                // Wait 5 minutes before next sweep (spec requirement)
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }

            _logger.LogInformation("ExamAutoExpireJob is stopping.");
        }

        private async Task ProcessExpiredExamsAsync(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var studentExamRepo = scope.ServiceProvider.GetRequiredService<IStudentExamRepository>();
            var dbContext = scope.ServiceProvider.GetRequiredService<Masarak.Infrastructure.Persistence.Context>();
            
            var now = DateTime.UtcNow;

            // 1. Auto-close published Exams whose EndTime has passed
            var expiredParentExams = dbContext.Exams.Where(e => e.Status == ExamStatus.Published && e.EndTime < now);
            foreach (var exam in expiredParentExams)
            {
                exam.Close();
                _logger.LogInformation($"Auto-closed Exam {exam.ExamId} as its deadline has passed.");
            }

            // 2. Auto-close published Assignments whose DueDate has passed
            var expiredAssignments = dbContext.Assignments.Where(a => a.Status == AssignmentStatus.Published && a.DueDate < now);
            foreach (var assignment in expiredAssignments)
            {
                assignment.Close();
                _logger.LogInformation($"Auto-closed Assignment {assignment.AssignmentId} as its deadline has passed.");
            }

            if (expiredParentExams.Any() || expiredAssignments.Any())
            {
                await dbContext.SaveChangesAsync(ct);
            }

            // 3. Auto-submit Student Exam Attempts
            var expiredExams = await studentExamRepo.GetExpiredInProgressAsync(now, ct);

            if (!expiredExams.Any()) return;

            _logger.LogInformation($"Found {expiredExams.Count()} expired student exam attempts to auto-submit.");

            foreach (var attempt in expiredExams)
            {
                attempt.Status = StudentExamStatus.AutoExpired;
                attempt.SubmittedAt = attempt.ExpiresAt; // Mark submission time as the exact expiry time

                // Run auto-grading logic over it
                decimal totalAutoScore = 0;
                bool needsManualGrading = false;
                var autoGradingService = new Masarak.Domain.Services.AutoGradingService();

                foreach (var answer in attempt.StudentAnswers)
                {
                    if (answer.Question.IsAutoGraded)
                    {
                        var score = autoGradingService.Grade(answer.Question, answer);
                        totalAutoScore += score;
                    }
                    else
                    {
                        needsManualGrading = true;
                    }
                }

                attempt.ApplyAutoGrading(totalAutoScore);

                if (!needsManualGrading)
                {
                    attempt.FinalizeFullAutoGrading(totalAutoScore);
                }
                else
                {
                    attempt.HasPendingManualGrading = true;
                }

                await studentExamRepo.UpdateAsync(attempt, ct);

                // Future: Dispatch ExamSubmittedEvent here
            }
        }
    }
}
