namespace Masarak.Application.Interfaces
{
    public interface IAgoraTokenService
    {
        string GenerateRtcToken(string channelName, string uid, string role = "publisher", int expireTimeInSeconds = 3600);
    }
}
