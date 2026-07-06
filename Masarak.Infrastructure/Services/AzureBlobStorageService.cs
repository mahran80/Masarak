using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Masarak.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Masarak.Infrastructure.Services
{
    public class AzureBlobStorageService : IFileStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly ILogger<AzureBlobStorageService> _logger;

        public AzureBlobStorageService(IConfiguration configuration, ILogger<AzureBlobStorageService> logger)
        {
            var connectionString = configuration.GetConnectionString("AzureBlobStorage");
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("AzureBlobStorage connection string is missing.");
            }
            
            _blobServiceClient = new BlobServiceClient(connectionString);
            _logger = logger;
        }

        public async Task<(string BlobName, string PublicUrl)> UploadAsync(Stream content, string fileName, string containerName, CancellationToken ct = default)
        {
            var blobContainerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            await blobContainerClient.CreateIfNotExistsAsync(cancellationToken: ct);
            
            var extension = Path.GetExtension(fileName);
            var blobName = $"{Guid.NewGuid()}{extension}";
            
            var blobClient = blobContainerClient.GetBlobClient(blobName);
            await blobClient.UploadAsync(content, overwrite: true, cancellationToken: ct);
            
            return (blobName, blobClient.Uri.ToString());
        }

        public async Task<string> GenerateSignedDownloadUrlAsync(string blobName, string containerName, TimeSpan expiry, CancellationToken ct = default)
        {
            var blobContainerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = blobContainerClient.GetBlobClient(blobName);

            if (!await blobClient.ExistsAsync(ct))
                throw new FileNotFoundException($"Blob {blobName} not found in container {containerName}");

            var sasBuilder = new BlobSasBuilder
            {
                BlobContainerName = containerName,
                BlobName = blobName,
                Resource = "b",
                ExpiresOn = DateTimeOffset.UtcNow.Add(expiry)
            };
            sasBuilder.SetPermissions(BlobSasPermissions.Read);

            var sasUri = blobClient.GenerateSasUri(sasBuilder);
            return sasUri.ToString();
        }

        public async Task DeleteAsync(string blobName, string containerName, CancellationToken ct = default)
        {
            var blobContainerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = blobContainerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync(cancellationToken: ct);
        }
    }
}
