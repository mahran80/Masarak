using System;
using Masarak.Application.Interfaces;
using Microsoft.Extensions.Configuration;
// using Agora.Rtc;
// using AgoraIO.Media;

namespace Masarak.Infrastructure.Services
{
    public class AgoraTokenService : IAgoraTokenService
    {
        private readonly string _appId;
        private readonly string _appCertificate;

        public AgoraTokenService(IConfiguration configuration)
        {
            _appId = configuration["Agora:AppId"] ?? throw new ArgumentNullException("Agora:AppId");
            _appCertificate = configuration["Agora:AppCertificate"] ?? throw new ArgumentNullException("Agora:AppCertificate");
        }

        public string GenerateRtcToken(string channelName, string uid, string role = "publisher", int expireTimeInSeconds = 3600)
        {
            uint privilegeExpiredTs = (uint)(DateTimeOffset.UtcNow.ToUnixTimeSeconds() + expireTimeInSeconds);
            bool isPublisher = role.Equals("publisher", StringComparison.OrdinalIgnoreCase);

            var builder = new AgoraIO.Rtc.RtcTokenBuilder();
            return builder.BuildToken(_appId, _appCertificate, channelName, isPublisher, privilegeExpiredTs);
        }
    }
}
