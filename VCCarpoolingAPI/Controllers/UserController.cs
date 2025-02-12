using Microsoft.AspNetCore.Mvc;
using VCCarpoolingAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace VCCarpoolingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : Controller
    {
        private readonly VarsityCollegeCarpoolingContext _dbContext;
        private readonly BlobStorageService _blobStorageService;

        public UserController(VarsityCollegeCarpoolingContext dbContext, BlobStorageService blobStorageService)
        {
            _dbContext = dbContext;
            _blobStorageService = blobStorageService;
        }

        [Authorize]
        [HttpGet("getusergroup")]
        public async Task<IActionResult> GetUserGroup()
        {
            var currentUserIdClaim = User.FindFirst("userID");

            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            var userGroupId = await _dbContext.CarpoolUsers
                .Where(user => user.UserId == currentUserId)
                .Select(user => user.GroupId)
                .FirstOrDefaultAsync();

            if (userGroupId == null)
            {
                return NotFound(new { message = "No group found for the current user." });
            }

            return Ok(new { groupId = userGroupId });
        }

        [Authorize]
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsersByName([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Name parameter is required." });
            }

            var users = await _dbContext.CarpoolUsers
                .Where(user => EF.Functions.Like(user.Name, $"%{name}%"))
                .Select(user => new
                {
                    user.UserId,
                    user.Name,
                    user.ProfileImage,
                    GroupName = user.Group != null ? user.Group.GroupName : null
                })
                .ToListAsync();

            if (users == null || !users.Any())
            {
                return NotFound(new { message = "No users found with the given name." });
            }

            return Ok(users);
        }

        [Authorize]
        [HttpPut("updateprofileimage")]
        public async Task<IActionResult> UpdateProfileImage([FromForm] UpdateProfileDto prof)
        {
            const string DefaultImageUrl = "https://vccarpoolingimagesotrage.blob.core.windows.net/url/Temp/temp.jpg";

            // Check if a file was uploaded
            if (prof.profileImage == null || prof.profileImage.Length == 0)
            {
                return BadRequest(new { message = "No image file provided." });
            }

            // Get the current user's ID from the token
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            // Retrieve the user's data
            var user = await _dbContext.CarpoolUsers.FirstOrDefaultAsync(u => u.UserId == currentUserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Define the folder for storing user profile photos
            string folderName = "UserProfilePhotos";
            string fileName = $"{currentUserId}/ProfileImage-{Guid.NewGuid()}.jpg";

            // Upload the new profile image to Blob Storage
            string profileImageUrl;
            using (var imageStream = prof.profileImage.OpenReadStream())
            {
                profileImageUrl = await _blobStorageService.UploadFileAsync(imageStream, $"{folderName}/{fileName}");
            }

            // Delete the previous profile image if it exists and isn't the default image
            if (!string.IsNullOrEmpty(user.ProfileImage) && user.ProfileImage != DefaultImageUrl)
            {
                string oldImageName = Path.GetFileName(user.ProfileImage);
                await _blobStorageService.DeleteFileAsync(currentUserId, $"{folderName}/{oldImageName}");
            }

            // Update the user's profile image in the database
            user.ProfileImage = profileImageUrl;
            _dbContext.CarpoolUsers.Update(user);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Profile image updated successfully.", profileImageUrl });
        }


    }
}
