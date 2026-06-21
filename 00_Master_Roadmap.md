# Masarak Education Platform — Master Implementation Roadmap

**Stack:** ASP.NET Core 9 · EF Core 9 · SQL Server · Angular 17+ · Redis · RabbitMQ (MassTransit) · Azure Blob Storage · SignalR · Stripe · OpenAI/Claude/Gemini  
**Architecture:** Clean Architecture · DDD · CQRS (MediatR) · Vertical Slice delivery  
**Team:** 6 Junior .NET Developers — one phase per developer  
**Deployment:** Azure (App Service + Azure SQL + Azure Cache for Redis + Azure Service Bus optional)

---

## Executive Summary

| Phase | Developer | Domain | Complexity | Depends On |
|---|---|---|---|---|
| 1 — Identity, Auth & Subscriptions | Dev 1 | Auth, Plans, Payments, Parent-Student Link | High | None |
| 2 — Academic Core | Dev 2 | Grades, Classes, Subjects, Assignments, Schedule | High | Phase 1 |
| 3 — Assessment & Grading | Dev 3 | Exams, Questions, Submissions, AutoGrading, StudentPerformance | Very High | Phases 1, 2 |
| 4 — Attendance, Content Library & Chat | Dev 4 | Attendance, ContentItems, SignalR Chat | High | Phases 1, 2 |
| 5 — AI Recommendations & Analytics | Dev 5 | AiRecommendation, Alerts, Analytics Snapshots | Very High | Phases 1–4 |
| 6 — Notifications, Admin & Angular Shell | Dev 6 | Notifications, Admin CRUD, Platform Layout | Medium-High | All phases |

**Recommended start order:** Phase 1 must be fully complete before any other phase deploys to shared environment. Phases 2, 4, and 6 (shell only) can develop in parallel after Phase 1. Phase 3 and 5 unblock after Phase 2. Phase 6 notification consumers integrate last.

---

## Global Architecture Decisions

### 1. Solution Structure

```
Masarak.sln
├── 1. Core/
│   ├── Masarak.Domain/
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Enums/
│   │   ├── Events/           ← Domain events (records)
│   │   └── Services/         ← Domain services (pure logic, no DI)
│   └── Masarak.Application/
│       ├── Common/
│       │   ├── Interfaces/   ← All repository + service interfaces
│       │   ├── Behaviors/    ← MediatR pipeline behaviors
│       │   ├── Exceptions/   ← Domain exceptions
│       │   └── Models/       ← PagedResult<T>, Result<T>
│       ├── Auth/             ← Per-feature folders with Commands/Queries/DTOs/Validators
│       ├── Subscriptions/
│       ├── Academic/
│       ├── Assessment/
│       ├── Attendance/
│       ├── Content/
│       ├── Chat/
│       ├── AI/
│       ├── Notifications/
│       └── Admin/
├── 2. Infrastructure/
│   └── Masarak.Infrastructure/
│       ├── Persistence/
│       │   ├── Context.cs
│       │   ├── Configurations/
│       │   ├── Migrations/
│       │   ├── Repositories/
│       │   └── Seeders/
│       ├── Services/
│       │   ├── Auth/         ← AuthService, JwtService, PasswordService
│       │   ├── Storage/      ← AzureBlobStorageService
│       │   ├── AI/           ← OpenAiProvider, ClaudeProvider, GeminiProvider
│       │   ├── Stripe/       ← StripeService
│       │   └── Cache/        ← RedisCacheService
│       ├── Messaging/        ← MassTransit config, consumers
│       └── BackgroundJobs/   ← IHostedService implementations
└── 3. Presentation/
    └── Masarak.API/
        ├── Controllers/
        ├── Hubs/             ← ChatHub, NotificationHub
        ├── Middleware/       ← SubscriptionAccessMiddleware, ExceptionMiddleware
        ├── Extensions/       ← DI registration extensions per phase
        └── Program.cs
```

### 2. MediatR Pipeline Behaviors (registered globally)

```csharp
// Order matters — registered in this order:
1. LoggingBehavior<TRequest, TResponse>      // logs request type + duration
2. ValidationBehavior<TRequest, TResponse>   // runs FluentValidation; throws on failure
3. PerformanceBehavior<TRequest, TResponse>  // warns if handler > 500ms
4. AuthorizationBehavior<TRequest, TResponse>// custom role check (optional, belt+suspenders)
```

### 3. Error Handling

All API errors return a consistent envelope:

```json
{
  "code": "DOMAIN_ERROR_CODE",
  "message": "Human-readable message",
  "errors": { "fieldName": ["error detail"] }   // only for validation errors
}
```

HTTP status mapping:
- `ValidationException` → 400
- `UnauthorizedException` → 401
- `ForbiddenException` → 403
- `NotFoundException` → 404
- `ConflictException` → 409
- `SubscriptionRequiredException` → 402
- All other exceptions → 500 (never expose stack traces in production)

### 4. Result Pattern

```csharp
// Used for commands/queries that have expected failure states
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public string? ErrorCode { get; }

    public static Result<T> Success(T value) => new(true, value, null, null);
    public static Result<T> Failure(string error, string errorCode) => new(false, default, error, errorCode);
}
```

### 5. Repository Pattern Rules

- Repositories are in `Masarak.Infrastructure`; interfaces in `Masarak.Application/Common/Interfaces`
- No generic `IRepository<T>` — every repository is purpose-built with named methods that express intent
- No `SaveChanges()` called inside repositories — it is called in `UnitOfWork` or directly in handlers
- Repositories never return domain entities to the API layer — handlers map to DTOs before returning

### 6. Entity Construction Rules (enforced across all phases)

- All entities have **private setters** — no direct property assignment outside the entity
- All entities have **private parameterless constructors** (for EF Core) + **public static factory methods**
- All entity state changes are via **named methods** on the entity (e.g., `submission.Grade(marks, feedback)` not `submission.MarksAwarded = marks`)
- No `DateTime.UtcNow` called directly in handlers — injected via `IDateTimeProvider` interface with `SystemDateTimeProvider` implementation (makes testing deterministic)

### 7. Pagination Standard

All list endpoints that can return more than 20 items are paginated:

```csharp
public record PagedResult<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
// Query params: ?page=1&pageSize=20
// Response header: X-Total-Count
```

### 8. Soft Delete Strategy

- **Do not use soft delete globally.** Only these entities use logical deletion: `ContentItem.IsActive`, `Notification` (never deleted), `ChatMessage.IsDeleted`, `User.IsActive`
- All other entities are hard-deleted when removed; cascade rules defined in EF configurations

---

## Cross-Cutting Infrastructure Setup (Dev 1 owns initial setup; all others consume)

### Program.cs Registration Order

```csharp
// 1. Configuration
// 2. Database (EF Core + SQL Server)
// 3. Redis (IDistributedCache + SignalR backplane)
// 4. MassTransit (RabbitMQ)
// 5. MediatR + Pipeline Behaviors
// 6. FluentValidation (all assemblies)
// 7. JWT Authentication + Authorization Policies
// 8. SignalR (ChatHub + NotificationHub)
// 9. Azure Blob Storage
// 10. Stripe
// 11. AI Provider Factory
// 12. Background Jobs
// 13. CORS (Angular dev: http://localhost:4200)
// 14. Swagger (with Bearer auth support)
// 15. Middlewares (Exception → SubscriptionAccess → Auth → Routing)
```

### appsettings.json Structure

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "",
    "Redis": ""
  },
  "JwtSettings": {
    "SecretKey": "",
    "Issuer": "MasarakApi",
    "Audience": "MasarakClients",
    "AccessTokenExpiryMinutes": 120,
    "RefreshTokenExpiryDays": 30
  },
  "Stripe": {
    "SecretKey": "",
    "PublishableKey": "",
    "WebhookSecret": ""
  },
  "Azure": {
    "BlobStorage": {
      "ConnectionString": "",
      "SubmissionsContainer": "submissions",
      "ContentContainer": "content-documents",
      "VideoContainer": "content-videos"
    }
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Username": "guest",
    "Password": "guest"
  },
  "AI": {
    "PrimaryProvider": "OpenAI",
    "OpenAI": { "ApiKey": "", "Model": "gpt-4o" },
    "Claude": { "ApiKey": "", "Model": "claude-sonnet-4-6" },
    "Gemini": { "ApiKey": "", "Model": "gemini-1.5-flash" }
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:4200"]
  }
}
```

---

## Shared Event Contracts (Dev 6 defines on Day 1; all phases implement)

All domain events published to RabbitMQ live in `Masarak.Application/Common/Events/`:

```csharp
// Phase 1 events
public record SubscriptionActivatedEvent(int UserId, int SubscriptionId, DateTime EndDate);
public record SubscriptionExpiredEvent(int UserId, int SubscriptionId);
public record SubscriptionExpiringEvent(int UserId, int SubscriptionId, int DaysRemaining);
public record ParentStudentLinkedEvent(int ParentUserId, int StudentUserId);
public record PaymentFailedEvent(int UserId, int SubscriptionId, string Reason);

// Phase 2 events
public record SessionScheduledEvent(int SessionId, int ClassId, string Title, DateTime ScheduledAt);
public record StudentEnrolledEvent(int StudentUserId, int ClassId, int TeacherUserId);

// Phase 3 events
public record ExamSubmittedEvent(int StudentExamId, int StudentUserId, int ExamId);
public record ExamFullyGradedEvent(int StudentExamId, int StudentUserId, int SubjectId, int ClassId, int FinalScore, int TotalMarks);
public record AssignmentGradedEvent(int SubmissionId, int StudentUserId, int SubjectId, int ClassId, int MarksAwarded, int MaxMarks);
public record PerformanceRecalculatedEvent(int StudentUserId, int SubjectId, int ClassId, int AcademicYear);

// Phase 5 events
public record AlertCreatedEvent(int StudentUserId, int? SubjectId, AlertType AlertType, string Message);
public record ParentReportReadyEvent(int StudentUserId, string ReportMonth);
```

---

## Angular Application Architecture

### Tech Stack

```
Angular 17+
NgRx (state management)
Angular Material OR PrimeNG (UI component library — choose one, enforce consistency)
ngx-translate (i18n Arabic/English)
@microsoft/signalr (SignalR client)
ng2-charts / Chart.js (analytics charts)
ngx-toastr OR Angular Material Snackbar (toast notifications)
Stripe.js (Stripe Elements on subscription page)
```

### Folder Structure

```
src/
  app/
    core/                   ← singleton services, interceptors, guards, shell layout
    shared/                 ← reusable dumb components, pipes, directives
    features/               ← one folder per phase (auth, subscription, academic, assessment, attendance, content, chat, analytics, admin)
    store/                  ← root NgRx store imports
  assets/
    i18n/
      en.json
      ar.json
  environments/
    environment.ts          ← apiUrl, signalRUrl, stripePublishableKey
    environment.prod.ts
```

### State Management Conventions

```typescript
// Every feature has its own state slice:
// feature.state.ts    ← interface + initialState
// feature.actions.ts  ← createAction with typed props
// feature.effects.ts  ← @Effect() using createEffect + switchMap/mergeMap
// feature.selectors.ts← createSelector
// feature.reducer.ts  ← createReducer with on()

// Naming convention for actions:
// [Feature] Load Data
// [Feature] Load Data Success
// [Feature] Load Data Failure
// [Feature API] Action Performed
```

---

## Database Migration Execution Order

Migrations must be applied in phase order on a shared environment:

```
1. (Existing) InitialMigration        — Phase 2 of original plan (users, roles, refresh_tokens)
2. Phase1_SubscriptionTables          — Dev 1: plans, subscriptions, payments, parent_student_links
3. Phase2_AcademicCore                — Dev 2: grades, classes, subjects, teaching_assignments, student_classes, sessions
4. Phase3_AssessmentAndGrading        — Dev 3: assignments, submissions, exams, questions, question_options, student_exams, student_answers, student_performances
5. Phase4_AttendanceContentChat       — Dev 4: attendance, content_items, chat_rooms, chat_messages
6. Phase5_AiAndAnalytics              — Dev 5: ai_recommendations, performance_alerts, ai_prompt_templates, analytics_snapshots
7. Phase6_Notifications               — Dev 6: notifications
```

---

## Development Environment Setup (Day 1 Checklist)

Every developer must have running locally:

```
□ .NET 9 SDK
□ SQL Server (LocalDB or Docker: mcr.microsoft.com/mssql/server:2022-latest)
□ Redis (Docker: redis:latest on port 6379)
□ RabbitMQ (Docker: rabbitmq:3-management on ports 5672/15672)
□ Node.js 20+ (Angular CLI)
□ Azure Storage Emulator (Azurite — Docker: mcr.microsoft.com/azure-storage/azurite)
□ Stripe CLI (for webhook testing: https://stripe.com/docs/stripe-cli)
```

Docker Compose for local dev (Dev 1 creates and commits this):

```yaml
version: '3.8'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment: { SA_PASSWORD: "Dev@12345!", ACCEPT_EULA: "Y" }
    ports: ["1433:1433"]
  redis:
    image: redis:latest
    ports: ["6379:6379"]
  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]
    environment: { RABBITMQ_DEFAULT_USER: guest, RABBITMQ_DEFAULT_PASS: guest }
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports: ["10000:10000", "10001:10001", "10002:10002"]
```

---

## NuGet Packages (Master List)

```xml
<!-- Core -->
<PackageReference Include="MediatR" Version="12.*" />
<PackageReference Include="FluentValidation.DependencyInjectionExtensions" Version="11.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.*" />
<PackageReference Include="AutoMapper" Version="13.*" /> <!-- or manual mapping — no generated mapping -->

<!-- Auth -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.*" />

<!-- Redis -->
<PackageReference Include="StackExchange.Redis" Version="2.*" />
<PackageReference Include="Microsoft.AspNetCore.SignalR.StackExchangeRedis" Version="9.*" />
<PackageReference Include="Microsoft.Extensions.Caching.StackExchangeRedis" Version="9.*" />

<!-- Messaging -->
<PackageReference Include="MassTransit.RabbitMQ" Version="8.*" />

<!-- Storage -->
<PackageReference Include="Azure.Storage.Blobs" Version="12.*" />

<!-- Payments -->
<PackageReference Include="Stripe.net" Version="45.*" />

<!-- AI -->
<PackageReference Include="OpenAI" Version="2.*" />         <!-- official OpenAI SDK -->
<PackageReference Include="Anthropic.SDK" Version="3.*" />

<!-- Testing -->
<PackageReference Include="xunit" Version="2.*" />
<PackageReference Include="Moq" Version="4.*" />
<PackageReference Include="FluentAssertions" Version="6.*" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.*" />
<PackageReference Include="Testcontainers.SqlEdge" Version="3.*" />  <!-- integration tests -->
<PackageReference Include="Testcontainers.Redis" Version="3.*" />
```

---

## npm Packages (Angular Master List)

```json
{
  "@angular/core": "^17.0.0",
  "@ngrx/store": "^17.0.0",
  "@ngrx/effects": "^17.0.0",
  "@ngrx/entity": "^17.0.0",
  "@ngrx/devtools": "^17.0.0",
  "@microsoft/signalr": "^8.0.0",
  "@ngx-translate/core": "^15.0.0",
  "@ngx-translate/http-loader": "^8.0.0",
  "chart.js": "^4.0.0",
  "ng2-charts": "^5.0.0",
  "ngx-toastr": "^18.0.0",
  "@stripe/stripe-js": "^3.0.0",
  "primeng": "^17.0.0",           // OR "@angular/material": "^17.0.0"
  "primeicons": "^6.0.0",
  "rxjs": "^7.8.0"
}
```

---

## Testing Strategy (All Phases)

### Unit Tests
- Location: `tests/Masarak.Application.Tests/`
- One test class per command/query handler
- Mock all interfaces; test only handler logic
- Name convention: `[HandlerName]_[Scenario]_[ExpectedOutcome]`
  - e.g.: `SubmitExamHandler_WhenExamExpired_AutoSubmitsWithExistingAnswers`

### Integration Tests
- Location: `tests/Masarak.Integration.Tests/`
- Uses `WebApplicationFactory<Program>`
- Uses Testcontainers for real SQL Server and Redis
- Uses MassTransit `InMemoryTestHarness` for messaging
- Each phase has one integration test class covering the happy path end-to-end

### Angular Tests
- Unit: Jasmine/Karma or Jest (choose one per team)
- E2E: Cypress (Phase 6 Dev sets up, other devs add specs for their flows)

---

## Branching & Integration Strategy

```
main           ← protected; only merges from develop via PR
develop        ← integration branch; all devs target here
feature/phase1-identity
feature/phase2-academic
feature/phase3-assessment
feature/phase4-attendance-content
feature/phase5-ai-analytics
feature/phase6-notifications-shell
```

**Merge rules:**
1. Phase 1 merges to `develop` first — unblocks all others
2. Each phase merges after its dependency phases are in `develop`
3. No direct commits to `main` or `develop`
4. PR requires: all tests green + one peer review
5. Migration conflicts resolved by: rebasing feature branch on latest `develop` before PR

---

## Definition of Done — Platform Level

The platform is considered shippable when:

- [ ] All 6 phases pass their individual Definition of Done
- [ ] End-to-end smoke test: register student → subscribe → view schedule → take exam → view result → parent sees report
- [ ] All DB migrations apply cleanly on a fresh Azure SQL instance
- [ ] Angular build produces zero compilation errors (`ng build --configuration production`)
- [ ] All sensitive config in Azure Key Vault (no secrets in appsettings.json in production)
- [ ] SignalR Redis backplane verified under multi-instance App Service deployment
- [ ] Stripe webhook tested end-to-end with Stripe CLI
- [ ] AI provider fallback tested by temporarily revoking primary provider key
- [ ] Arabic RTL layout verified on all key pages
- [ ] CORS restricted to production Angular domain only
