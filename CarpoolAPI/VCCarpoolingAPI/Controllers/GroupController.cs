using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols;
using Microsoft.Win32;
using System.Security.Claims;
using VCCarpoolingAPI;
using VCCarpoolingAPI.Models;
/*
 * This controller handles group related activities
 * To do list:
 * Implement encryption for images - license and registration if we end up displaying them
 * change get groups to consider open spaces left in group
 */
namespace CarpoolAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupController : Controller
    {
        private readonly VarsityCollegeCarpoolingContext _dbContext;
        private readonly BlobStorageService _blobStorageService;

        public GroupController(VarsityCollegeCarpoolingContext dbContext, BlobStorageService blobStorageService)
        {
            _dbContext = dbContext;
            _blobStorageService = blobStorageService;
        }

        // POST: api/creategroup
        [Authorize]
        [HttpPost("creategroup")]
        public async Task<IActionResult> CreateGroup([FromForm] CreateGroupDto groupDto)
        {
            if (groupDto == null || groupDto.CarRegistrationPhoto == null)
            {
                return BadRequest("Invalid data");
            }

            // Get the current userID from the JWT claims
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized("User ID claim not found");
            }

            // Retrieve user data
            CarpoolUser user = await _dbContext.CarpoolUsers.FirstOrDefaultAsync(u => u.UserId == currentUserId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Create the group object
            var newGroup = new Group
            {
                VarsityLocation = groupDto.VarsityLocation,
                GroupName = groupDto.groupName,
                LocationRadius = groupDto.LocationRadius,
                PassengerCount = groupDto.PassengerCount,
                AdminId = currentUserId,
            };

            // Add the new group to the database and save changes to get the GroupId
            _dbContext.Groups.Add(newGroup);
            await _dbContext.SaveChangesAsync(); // Save to generate GroupId

            // Associate the user with the newly created group
            user.GroupId = newGroup.GroupId;
            _dbContext.CarpoolUsers.Update(user);
            await _dbContext.SaveChangesAsync();


            // Upload car registration photo to Blob Storage
            string carRegistrationPhotoUrl;
            using (var carRegistrationStream = groupDto.CarRegistrationPhoto.OpenReadStream())
            {
                carRegistrationPhotoUrl = await _blobStorageService.UploadFileAsync(carRegistrationStream, $"Group{newGroup.GroupId}/CarRegistrationPhoto.jpg");
                Console.WriteLine();
                Console.WriteLine("MY PHOOTOOO: " + carRegistrationPhotoUrl);
                Console.WriteLine();
            }

            newGroup.CarRegistrationPhoto = carRegistrationPhotoUrl;

            newGroup.GroupImage = "https://vccarpoolingimagesotrage.blob.core.windows.net/url/Temp/temp.jpg";

            _dbContext.Groups.Update(newGroup);
            await _dbContext.SaveChangesAsync();

            return Ok("New group created with images stored.");

        }

        // GET: api/group/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GroupDto>> GetGroup(int id)
        {
            var group = await _dbContext.Groups
                .Include(g => g.CarpoolUsers)
                .FirstOrDefaultAsync(g => g.GroupId == id);

            if (group == null)
            {
                return NotFound();
            }

            // Map Group entity to GroupDto
            var groupDto = new GroupDtoDetails
            {
                GroupId = group.GroupId,
                GroupName = group.GroupName,
                VarsityLocation = group.VarsityLocation,
                AdminId = group.AdminId,
                Registration = group.CarRegistrationPhoto,
                GroupImage = group.GroupImage,
                Users = group.CarpoolUsers.Select(u => new GroupUserDto
                {
                    UserId = u.UserId,
                    UserName = u.Name
                }).ToList() // Map User entity to UserDto
            };

            return Ok(groupDto);
        }

        [Authorize]
        [HttpDelete("removegroup/{groupId}")]
        public async Task<IActionResult> RemoveGroup(int groupId)
        {
            // Fetch the group by groupId, including related group messages and users
            var group = await _dbContext.Groups
                                        .Include(g => g.GroupMessages)
                                        .Include(g => g.CarpoolUsers)
                                        .FirstOrDefaultAsync(g => g.GroupId == groupId);

            // Check if the group exists
            if (group == null)
            {
                return NotFound($"Group with ID {groupId} not found.");
            }

            // Get the ID of the currently authenticated user from the JWT claims
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized("Invalid or missing user ID claim.");
            }

            // Ensure the current user is the admin of the group
            if (group.AdminId != currentUserId)
            {
                return Unauthorized("You are not authorized to delete this group.");
            }

            // Disassociate users from the group by setting their GroupId to null
            foreach (var user in group.CarpoolUsers)
            {
                user.GroupId = null;
            }

            // Delete images from Blob Storage
            if (!string.IsNullOrEmpty(group.LisencePhoto))
                await _blobStorageService.DeleteFileAsync(groupId, GetFileNameFromUrl(group.LisencePhoto));
            if (!string.IsNullOrEmpty(group.CarRegistrationPhoto))
                await _blobStorageService.DeleteFileAsync(groupId, GetFileNameFromUrl(group.CarRegistrationPhoto));
            if (!string.IsNullOrEmpty(group.GroupImage))
                await _blobStorageService.DeleteFileAsync(groupId, GetFileNameFromUrl(group.GroupImage));

            // Delete associated group messages
            _dbContext.GroupMessages.RemoveRange(group.GroupMessages);

            // Remove the group from the database
            _dbContext.Groups.Remove(group);

            // Save changes (this will update the CarpoolUsers' GroupId and remove the group)
            await _dbContext.SaveChangesAsync();

            return Ok($"Group with ID {groupId} and its associated files and messages have been deleted successfully, and users have been disassociated from the group.");
        }

        // GET: api/groups
        [HttpGet("groups")]
        public async Task<IActionResult> GetAllGroups()
        {
            // Query the database to get all groups with available space
            var groups = await _dbContext.Groups
                .Select(g => new
                {
                    Group = g,
                    UserCount = g.CarpoolUsers.Count() // Count associated carpool users
                })
                .Where(g => g.UserCount < g.Group.PassengerCount +1) // Filter groups with available space
                .Select(g => new GroupDto
                {
                    GroupId = g.Group.GroupId,
                    groupName = g.Group.GroupName,
                    varsity = g.Group.VarsityLocation,
                    radius = g.Group.LocationRadius,
                    size = g.Group.PassengerCount + 1 - g.UserCount,

                    Admin = _dbContext.CarpoolUsers
                        .Where(u => u.UserId == g.Group.AdminId)
                        .Select(u => u.UserId.ToString())
                        .FirstOrDefault() ?? "Unknown Admin",

                    GroupImage = !string.IsNullOrEmpty(g.Group.GroupImage)
                                ? g.Group.GroupImage
                                : "https://vccarpoolingimagesotrage.blob.core.windows.net/url/Temp/temp.jpg" // Full URL of temp image in Blob Storage
                })
                .ToListAsync(); // https://vccarpoolingimagesotrage.blob.core.windows.net/url/Temp/temp.jpg

            // Check if there are any groups
            if (groups == null || groups.Count == 0)
            {
                return NotFound("No groups found.");
            }

            // Return the list of groups
            return Ok(groups);
        }



        // GET: api/groups?locationRadius={locationRadius}
        [HttpGet("groups/filter")]
        public async Task<IActionResult> GetGroupsByLocationRadius([FromQuery] string location)
        {
            // Query the database to get groups with the specified LocationRadius
            var groups = await _dbContext.Groups
                .Where(g => g.VarsityLocation == location)
                .Select(g => new
                {
                    Group = g,
                    UserCount = g.CarpoolUsers.Count() // Count associated carpool users
                })
                .Where(g => g.UserCount < g.Group.PassengerCount) // Filter groups with available space
                .Select(g => new GroupDto
                {
                    GroupId = g.Group.GroupId,
                    groupName = g.Group.GroupName,
                    varsity = g.Group.VarsityLocation,
                    radius = g.Group.LocationRadius,
                    size = g.Group.PassengerCount + 1 - g.UserCount,

                    Admin = _dbContext.CarpoolUsers
                        .Where(u => u.UserId == g.Group.AdminId)
                        .Select(u => u.Name)
                        .FirstOrDefault() ?? "Unknown Admin",

                    GroupImage = !string.IsNullOrEmpty(g.Group.GroupImage)
                        ? $"{Request.Scheme}://{Request.Host}/{g.Group.GroupImage}" // Return full URL of group image
                        : $"{Request.Scheme}://{Request.Host}/url/TempIcon.png" // If no image, return temp image
                })
                .ToListAsync();

            if (groups == null || groups.Count == 0)
            {
                return NotFound($"No groups found for location radius: {location}");
            }

            return Ok(groups);
        }

        [Authorize]
        [HttpPut("addusertogroup")]
        public async Task<IActionResult> AddUserToGroup([FromQuery] int groupID, [FromQuery] int userID)
        {
            // Fetch the user from the database
            var user = await _dbContext.CarpoolUsers.FirstOrDefaultAsync(u => u.UserId == userID);

            // Check if the user exists
            if (user == null)
            {
                return NotFound($"User with ID {userID} not found.");
            }

            // Fetch the group from the database
            var group = await _dbContext.Groups.FirstOrDefaultAsync(g => g.GroupId == groupID);

            // Check if the group exists
            if (group == null)
            {
                return NotFound($"Group with ID {groupID} not found.");
            }

            // Check if the user is already in the group
            if (user.GroupId == groupID)
            {
                return BadRequest("User is already a member of this group.");
            }

            // Assign the user to the group by setting the GroupId property
            user.GroupId = group.GroupId;

            // Update the user record in the database
            _dbContext.CarpoolUsers.Update(user);
            await _dbContext.SaveChangesAsync();

            // Return a success response
            return Ok($"User with ID {userID} has been successfully added to group with ID {groupID}.");
        }

        [Authorize]
        [HttpPut("updategroup/{groupId}")]
        public async Task<IActionResult> UpdateGroup(int groupId, [FromForm] CreateGroupDto groupDto)
        {
            if (groupDto == null)
            {
                return BadRequest("Invalid data.");
            }

            var group = await _dbContext.Groups.FirstOrDefaultAsync(g => g.GroupId == groupId);
            if (group == null)
            {
                return NotFound("Group not found.");
            }

            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized("User ID claim not found.");
            }

            if (group.AdminId != currentUserId)
            {
                return Unauthorized("You are not authorized to update this group.");
            }

            // Update basic group properties
            group.GroupName = groupDto.groupName;
            group.LocationRadius = groupDto.LocationRadius;
            group.PassengerCount = groupDto.PassengerCount;
            group.VarsityLocation = groupDto.VarsityLocation;

            // Handle GroupImage update
            if (groupDto.GroupImage != null)
            {
                // Check if the current image is the temporary default
                const string tempImageUrl = "https://vccarpoolingimagesotrage.blob.core.windows.net/url/Temp/temp.jpg";

                // Delete the old image first if it's not the default temp image
                if (!string.IsNullOrEmpty(group.GroupImage) && group.GroupImage != tempImageUrl)
                {
                    string oldImageName = Path.GetFileName(group.GroupImage); // Extract filename from the URL
                    await _blobStorageService.DeleteFileAsync(groupId, oldImageName); // Correct file name for deletion
                }

                // Upload new GroupImage to Blob Storage
                string newGroupImageUrl;
                using (var groupImageStream = groupDto.GroupImage.OpenReadStream())
                {
                    newGroupImageUrl = await _blobStorageService.UploadFileAsync(groupImageStream, $"Group{group.GroupId}/GroupImage.jpg");
                }

                Console.WriteLine();
                Console.WriteLine("newGroupImageUrl " + newGroupImageUrl);
                Console.WriteLine();

                // Update the group image URL in the database
                group.GroupImage = newGroupImageUrl;
            }

            // Handle CarRegistrationPhoto update
            if (groupDto.CarRegistrationPhoto != null)
            {
                // Check if the current CarRegistrationPhoto is not the temporary image
                const string tempCarRegPhotoUrl = "https://vccarpoolingimagesotrage.blob.core.windows.net/url/Temp/tempCarReg.jpg";

                // Delete the old CarRegistrationPhoto first if it's not the default temp image
                if (!string.IsNullOrEmpty(group.CarRegistrationPhoto) && group.CarRegistrationPhoto != tempCarRegPhotoUrl)
                {
                    string oldCarRegPhotoName = Path.GetFileName(group.CarRegistrationPhoto); // Extract filename
                    await _blobStorageService.DeleteFileAsync(groupId, oldCarRegPhotoName); // Correct file name for deletion
                }

                // Upload the new Car Registration Photo to Blob Storage
                string newCarRegPhotoUrl;
                using (var carRegPhotoStream = groupDto.CarRegistrationPhoto.OpenReadStream())
                {
                    newCarRegPhotoUrl = await _blobStorageService.UploadFileAsync(carRegPhotoStream, $"Group{group.GroupId}/CarRegistrationPhoto.jpg");
                }

                Console.WriteLine();
                Console.WriteLine("newCarRegPhotoUrl " + newCarRegPhotoUrl);
                Console.WriteLine();

                // Update the Car Registration Photo URL in the database
                group.CarRegistrationPhoto = newCarRegPhotoUrl;
            }

            // Save the updated group back to the database
            _dbContext.Groups.Update(group);
            await _dbContext.SaveChangesAsync();

            return Ok(new { GroupImageUrl = group.GroupImage });
        }




        [Authorize]
        [HttpDelete("leavegroup")]
        public async Task<IActionResult> LeaveGroup()
        {
            // Get the ID of the currently authenticated user from the JWT claims
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized("Invalid or missing user ID claim.");
            }

            // Find the user in the database
            var user = await _dbContext.CarpoolUsers
                                       .Include(u => u.Group)
                                       .FirstOrDefaultAsync(u => u.UserId == currentUserId);

            // Check if the user exists and is part of a group
            if (user == null)
            {
                return NotFound("User not found.");
            }

            if (user.GroupId == null)
            {
                return BadRequest("You are not part of any group.");
            }

            // Find the group the user is part of
            var group = await _dbContext.Groups
                                         .Include(g => g.CarpoolUsers)
                                         .FirstOrDefaultAsync(g => g.GroupId == user.GroupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Check if the user is the admin of the group
            if (group.AdminId == user.UserId)
            {
                return BadRequest("Admins cannot leave the group. Disband the group to leave.");
            }

            // Disassociate the user from the group
            user.GroupId = null;

            await _dbContext.SaveChangesAsync();

            return Ok($"You have successfully left the group '{group.GroupName}'.");
        }

        [Authorize]
        [HttpDelete("removeuser/{userId}")]
        public async Task<IActionResult> RemoveUserFromGroup(int userId)
        {
            // Get the ID of the currently authenticated user from the JWT claims
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized("Invalid or missing user ID claim.");
            }

            // Find the current user
            var currentUser = await _dbContext.CarpoolUsers
                                               .Include(u => u.Group)
                                               .FirstOrDefaultAsync(u => u.UserId == currentUserId);

            // Check if the current user is part of a group
            if (currentUser == null || currentUser.GroupId == null)
            {
                return BadRequest("You are not part of any group.");
            }

            // Find the group the current user is part of
            var group = await _dbContext.Groups
                                         .FirstOrDefaultAsync(g => g.GroupId == currentUser.GroupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            // Check if the current user is the admin of the group
            if (group.AdminId != currentUserId)
            {
                return Unauthorized("You are not authorized to remove users from this group.");
            }

            // Find the user to be removed
            var userToRemove = await _dbContext.CarpoolUsers
                                                .FirstOrDefaultAsync(u => u.UserId == userId && u.GroupId == group.GroupId);

            // Check if the user exists and is part of the same group
            if (userToRemove == null)
            {
                return NotFound($"User with ID {userId} not found in the group.");
            }

            // Disassociate the user from the group
            userToRemove.GroupId = null;

            await _dbContext.SaveChangesAsync();

            return Ok($"User with ID {userId} has been successfully removed from the group '{group.GroupName}'.");
        }

        private string GetFileNameFromUrl(string url)
        {
            var uri = new Uri(url);
            Console.WriteLine();
            Console.WriteLine("What is my deletion uri? " + Path.GetFileName(uri.LocalPath));
            Console.WriteLine();
            return Path.GetFileName(uri.LocalPath);
        }
    }
}
