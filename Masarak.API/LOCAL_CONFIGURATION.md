# Local configuration (do not commit secrets)

The repository contains safe placeholders only. Development secrets must be
stored with the ASP.NET Core Secret Manager. The project already has a
`UserSecretsId`, so run these commands from the repository root and replace
the placeholder values locally:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "YOUR_LOCAL_CONNECTION_STRING" --project Masarak.API/Masarak.API.csproj
dotnet user-secrets set "JwtSettings:SecretKey" "YOUR_LONG_RANDOM_JWT_SECRET" --project Masarak.API/Masarak.API.csproj
dotnet user-secrets set "StripeSettings:SecretKey" "YOUR_STRIPE_SECRET_KEY" --project Masarak.API/Masarak.API.csproj
dotnet user-secrets set "StripeSettings:WebhookSecret" "YOUR_STRIPE_WEBHOOK_SECRET" --project Masarak.API/Masarak.API.csproj
dotnet user-secrets set "SmtpSettings:UserName" "YOUR_SMTP_USERNAME" --project Masarak.API/Masarak.API.csproj
dotnet user-secrets set "SmtpSettings:Password" "YOUR_SMTP_APP_PASSWORD" --project Masarak.API/Masarak.API.csproj
dotnet user-secrets set "Agora:AppCertificate" "YOUR_AGORA_APP_CERTIFICATE" --project Masarak.API/Masarak.API.csproj
dotnet user-secrets set "AI:Gemini:ApiKey" "YOUR_GEMINI_API_KEY" --project Masarak.API/Masarak.API.csproj
```

For production, configure the same keys through the hosting provider's secret
store/environment variables. Never put real credentials in `appsettings.json`.

The checked-in SQL Server connection uses `Server=.` with Windows
Authentication as a safe local default. A User Secret overrides it when set.
