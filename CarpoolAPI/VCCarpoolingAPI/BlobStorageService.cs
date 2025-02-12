using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace VCCarpoolingAPI
{
    public class BlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName;

        public BlobStorageService(IConfiguration configuration)
        {
            string connectionString = configuration.GetConnectionString("AzureBlobStorage");
            _blobServiceClient = new BlobServiceClient(connectionString);
            _containerName = configuration["AzureBlobStorage:ContainerName"];
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName)
        {
            var blobContainerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = blobContainerClient.GetBlobClient(fileName);

            // Upload the file to Blob Storage
            await blobClient.UploadAsync(fileStream, new BlobHttpHeaders { ContentType = "image/jpeg" });
            Console.WriteLine();
            Console.WriteLine("Image was uploaded"+ blobClient.Uri.ToString());
            Console.WriteLine();
            // Return the URL to access the blob
            return blobClient.Uri.ToString();
        }

        public async Task DeleteFileAsync(int groupId, string fileName)
        {
            string fullPath = $"Group{groupId}/{fileName}"; // Avoid Path.Combine
            var blobContainerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = blobContainerClient.GetBlobClient(fullPath);

            var deletionResult = await blobClient.DeleteIfExistsAsync();
            if (!deletionResult.Value)
            {
                Console.WriteLine("File deletion failed." + fullPath);
            }
        }
    }
}
