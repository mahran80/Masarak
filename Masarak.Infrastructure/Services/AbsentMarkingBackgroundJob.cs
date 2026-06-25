using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Masarak.Infrastructure.Services
{
    /// <summary>
    /// Phase 4: Background job that marks absent students after a session ends.
    /// Runs every 5 minutes.
    /// For each completed session (ScheduledAt + DurationMinutes + 15 min < UtcNow):
    ///   - Gets enrolled student IDs
    ///   - Finds students with no attendance record
    ///   - Bulk-creates Absent records
    ///   - Marks session as Completed
    /// </summary>
    public class AbsentMarkingBackgroundJob : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AbsentMarkingBackgroundJob> _logger;
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);
        private static readonly TimeSpan GracePeriod = TimeSpan.FromMinutes(15);

        public AbsentMarkingBackgroundJob(
            IServiceScopeFactory scopeFactory,
            ILogger<AbsentMarkingBackgroundJob> logger)
        {
            _scopeFactory = scopeFactory;
            _logger       = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[AbsentMarkingJob] Started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpiredSessionsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[AbsentMarkingJob] Error processing expired sessions.");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }

        private async Task ProcessExpiredSessionsAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<Context>();
            var attendanceRepo = scope.ServiceProvider.GetRequiredService<IAttendanceRepository>();

            var now = DateTime.UtcNow;

            // Find sessions that have ended (ScheduledAt + Duration + 15 min grace < now)
            // and are not cancelled, and are still in Scheduled or Live status
            var expiredSessions = await context.Sessions
                .Include(s => s.Class)
                    .ThenInclude(c => c.StudentClasses)
                        .ThenInclude(sc => sc.Student)
                .Where(s => s.Status != SessionStatus.Cancelled
                    && s.Status != SessionStatus.Completed)
                .ToListAsync(ct);

            var sessionsToProcess = expiredSessions
                .Where(s => s.ScheduledAt.AddMinutes(s.DurationMinutes).Add(GracePeriod) < now)
                .ToList();

            if (sessionsToProcess.Count == 0) return;

            _logger.LogInformation("[AbsentMarkingJob] Processing {Count} expired sessions.", sessionsToProcess.Count);

            foreach (var session in sessionsToProcess)
            {
                try
                {
                    // Get enrolled student UserIds for this session's class
                    var enrolledStudentUserIds = session.Class.StudentClasses
                        .Where(sc => sc.IsActive)
                        .Select(sc => sc.Student.UserId)
                        .ToList();

                    if (enrolledStudentUserIds.Count == 0)
                    {
                        session.Complete();
                        context.Sessions.Update(session);
                        continue;
                    }

                    // Find students without attendance records
                    var absentStudentIds = await attendanceRepo
                        .GetStudentsWithoutAttendanceAsync(session.SessionId, enrolledStudentUserIds, ct);

                    var absentList = absentStudentIds.ToList();
                    if (absentList.Count > 0)
                    {
                        var absences = absentList
                            .Select(studentUserId => Attendance.RecordAbsent(session.SessionId, studentUserId))
                            .ToList();

                        await attendanceRepo.BulkAddAbsentAsync(absences, ct);
                        _logger.LogInformation("[AbsentMarkingJob] Session {SessionId}: marked {Count} students absent.",
                            session.SessionId, absentList.Count);
                    }

                    // Mark session as completed
                    session.Complete();
                    context.Sessions.Update(session);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[AbsentMarkingJob] Error processing session {SessionId}.", session.SessionId);
                }
            }

            await context.SaveChangesAsync(ct);
        }
    }
}
