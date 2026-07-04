using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Domain.ValueObjects;

namespace Masarak.Infrastructure.Services
{
    public class SessionAdminService : ISessionAdminService
    {
        private readonly ISessionRepository _sessionRepo;
        private readonly ITeachingAssignmentRepository _teachingAssignmentRepo;

        public SessionAdminService(ISessionRepository sessionRepo, ITeachingAssignmentRepository teachingAssignmentRepo)
        {
            _sessionRepo = sessionRepo;
            _teachingAssignmentRepo = teachingAssignmentRepo;
        }

        public async Task<IEnumerable<SessionDto>> ScheduleSessionSeriesAsync(AdminScheduleSessionRequest request, CancellationToken ct = default)
        {
            // Find the teaching assignment for the selected Class and Subject
            var assignments = await _teachingAssignmentRepo.GetByClassIdAsync(request.ClassId, AcademicYear.Current().Year, ct);
            var assignment = assignments.FirstOrDefault(a => a.SubjectId == request.SubjectId && a.IsActive);

            if (assignment == null)
            {
                throw new InvalidOperationException("No active teaching assignment found for the selected Subject and Class.");
            }

            var sessionsToCreate = new List<Session>();
            Guid seriesId = Guid.NewGuid();
            
            DateTime currentSessionStart = request.ScheduledAt;
            DateTime recurUntil = request.IsRecurring && request.RecurUntil.HasValue 
                ? request.RecurUntil.Value 
                : request.ScheduledAt.Date.AddDays(1).AddTicks(-1);

            if (request.DurationMinutes <= 0)
                throw new InvalidOperationException("Duration must be greater than zero.");

            while (currentSessionStart <= recurUntil)
            {
                DateTime currentSessionEnd = currentSessionStart.AddMinutes(request.DurationMinutes);

                // Conflict Check
                bool hasConflict = await _sessionRepo.HasConflictAsync(
                    request.ClassId, 
                    assignment.TeacherId, 
                    currentSessionStart, 
                    currentSessionEnd, 
                    null, 
                    ct);

                if (hasConflict)
                {
                    throw new InvalidOperationException($"Scheduling conflict detected on {currentSessionStart:g}. Either the class or the teacher is already occupied.");
                }

                var session = Session.Schedule(
                    assignment.AssignmentId,
                    request.ClassId,
                    request.Title,
                    request.Description,
                    currentSessionStart,
                    request.DurationMinutes,
                    null, // Admin doesn't provide embedUrl initially
                    seriesId
                );

                sessionsToCreate.Add(session);
                
                if (!request.IsRecurring) break;
                
                currentSessionStart = currentSessionStart.AddDays(7);
            }

            if (!sessionsToCreate.Any())
                throw new InvalidOperationException("No sessions could be generated within the specified timeframe.");

            await _sessionRepo.AddRangeAsync(sessionsToCreate, ct);

            // Re-fetch with details to return valid DTOs
            var createdSessions = new List<SessionDto>();
            foreach (var session in sessionsToCreate)
            {
                var s = await _sessionRepo.GetByIdWithDetailsAsync(session.SessionId, ct);
                if (s != null)
                {
                    createdSessions.Add(MapSession(s));
                }
            }

            return createdSessions;
        }

        public async Task CancelSessionSeriesAsync(Guid seriesId, CancellationToken ct = default)
        {
            var sessions = await _sessionRepo.GetBySeriesIdAsync(seriesId, ct);
            if (!sessions.Any())
                throw new KeyNotFoundException("Recurring series not found.");

            // Only cancel future, scheduled sessions. Do not affect past/completed/live ones.
            foreach (var session in sessions.Where(s => s.ScheduledAt > DateTime.UtcNow && s.Status == SessionStatus.Scheduled))
            {
                session.Cancel();
            }

            await _sessionRepo.UpdateRangeAsync(sessions, ct);
        }

        public async Task CancelSingleSessionAsync(int sessionId, CancellationToken ct = default)
        {
            var session = await _sessionRepo.GetByIdAsync(sessionId, ct);
            if (session == null)
                throw new KeyNotFoundException("Session not found.");
            
            session.Cancel();
            await _sessionRepo.UpdateAsync(session, ct);
        }

        public async Task<IEnumerable<SessionDto>> GetClassScheduleAsync(int classId, DateTime from, DateTime to, CancellationToken ct = default)
        {
            var sessions = await _sessionRepo.GetByClassIdAsync(classId, from, to, ct);
            return sessions.Select(MapSession);
        }

        public async Task<IEnumerable<SessionDto>> GetTeacherScheduleAsync(int teacherId, DateTime from, DateTime to, CancellationToken ct = default)
        {
            var sessions = await _sessionRepo.GetByTeacherIdAsync(teacherId, from, to, ct);
            return sessions.Select(MapSession);
        }

        public async Task ReactivateSessionAsync(int sessionId, CancellationToken ct = default)
        {
            var session = await _sessionRepo.GetByIdAsync(sessionId, ct)
                ?? throw new KeyNotFoundException($"Session {sessionId} not found.");

            if (session.Status != Domain.Enums.SessionStatus.Completed && session.Status != Domain.Enums.SessionStatus.Cancelled)
                throw new InvalidOperationException("Only completed or cancelled sessions can be reactivated.");

            session.Status = Domain.Enums.SessionStatus.Scheduled;
            session.EmbedUrl = null; // Clear old meeting link
            
            await _sessionRepo.UpdateAsync(session, ct);
        }

        private static SessionDto MapSession(Session s) =>
            new(s.SessionId,
                s.Title,
                s.Description,
                s.ScheduledAt,
                s.DurationMinutes,
                s.EndsAt,
                s.EmbedUrl,
                s.Status,
                s.TeachingAssignment?.Subject?.Name ?? "",
                s.ClassId,
                s.Class?.Name ?? "",
                s.TeachingAssignment?.Teacher?.User?.FullName ?? "");
    }
}
