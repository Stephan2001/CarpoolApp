using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VCCarpoolingAPI.Models;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.Win32;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
/*
 * This controller handles user creation
 * Create/delete/getDetails
 * Needs:
 * testing
 */
namespace VCCarpoolingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterController : ControllerBase
    {
        private readonly VarsityCollegeCarpoolingContext _dbContext;
        private readonly Encryption encryptionVC;
        private readonly IConfiguration _configuration;

        public RegisterController(VarsityCollegeCarpoolingContext dbContext, Encryption encryption, IConfiguration configuration)
        {
            _dbContext = dbContext;
            encryptionVC = encryption;
            _configuration = configuration;
        }

        // POST: api/register
        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterDto register)
        {
            if (register == null || string.IsNullOrEmpty(register.Email) || string.IsNullOrEmpty(register.Name) || string.IsNullOrEmpty(register.Password))
            {
                return BadRequest("Invalid data");
            }

            // Check if user with the same email already exists
            var user = await _dbContext.CarpoolUsers.SingleOrDefaultAsync(u => u.Email == register.Email);
            if (user != null)
            {
                return BadRequest("User already exists");
            }

            // Create a new CarpoolUser
            var newUser = new CarpoolUser
            {
                Email = register.Email,
                Name = register.Name,
                Password = encryptionVC.HashPassword(register.Password),
                Role = "AppUser",
                GroupId = null,
                ProfileImage = "https://vccarpoolingimagesotrage.blob.core.windows.net/url/Temp/temp.jpg",
                Verified = false  // Add IsVerified flag for email verification
            };

            // Add the new user to the database and save changes
            _dbContext.CarpoolUsers.Add(newUser);
            await _dbContext.SaveChangesAsync();

            // Send email verification link
            var verificationToken = GenerateVerificationToken(newUser.UserId);  
            var verificationLink = $"https://vccarpoolingapi.azurewebsites.net/api/Register/verify-email?token={Uri.EscapeDataString(verificationToken)}";
            Console.WriteLine(verificationToken);
            var sendGridService = new SendGridService(_configuration);
            await sendGridService.SendVerificationEmailAsync(newUser.Email, verificationLink);

            return Ok("Profile created successfully. Please check your email to verify your account.");
        }


        [Authorize]
        [HttpPost("changepassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            if (changePasswordDto == null || string.IsNullOrEmpty(changePasswordDto.CurrentPassword) || string.IsNullOrEmpty(changePasswordDto.NewPassword))
            {
                return BadRequest(new { message = "Invalid request data." });
            }

            // Retrieve the user ID from the token
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            // Find the user in the database
            var user = await _dbContext.CarpoolUsers.SingleOrDefaultAsync(u => u.UserId == currentUserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Validate the current password
            if (!encryptionVC.VerifyPasssword(changePasswordDto.CurrentPassword, user.Password))
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            // Hash the new password
            user.Password = encryptionVC.HashPassword(changePasswordDto.NewPassword);

            // Save the updated password to the database
            _dbContext.CarpoolUsers.Update(user);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }


        // GET: api/register/user/{userId}
        [Authorize]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserDetails(int userId)
        {
            // Fetch the user details along with the group details
            var user = await _dbContext.CarpoolUsers
                .Include(u => u.Group) // Include the related Group entity
                .FirstOrDefaultAsync(u => u.UserId == userId);

            // Check if the user exists
            if (user == null)
            {
                return NotFound($"User with ID {userId} not found.");
            }

            // Calculate the user's rating
            decimal? averageRating = await CalculateUserRating(userId);

            var userDto = new UserDto
            {
                UserId = user.UserId,
                GroupId = user.GroupId,
                GroupName = user.Group?.GroupName,
                RatingCalc = averageRating,  // Average rating of the user
                Name = user.Name,
                Email = user.Email,
                ProfileImage = user.ProfileImage
            };

            // Return the user details if found
            return Ok(userDto);
        }


        private async Task<decimal?> CalculateUserRating(int userId)
        {
            // Fetch all ratings for the specified user
            var ratings = await _dbContext.Ratings
                .Where(r => r.UserRatedId == userId)
                .ToListAsync();

            if (ratings.Count == 0)
            {
                // Return null if no ratings exist
                return null;
            }

            // Calculate the average rating
            return ratings.Average(r => r.Rating1 ?? 0); // Use ?? 0 to handle null ratings gracefully
        }

        [Authorize]
        [HttpPost("rate")]
        public async Task<IActionResult> RateUser([FromBody] RateUserRequest request)
        {
            // Validate the rating value
            if (request.Rating < 0 || request.Rating > 5)
            {
                return BadRequest("Rating must be between 0 and 5.");
            }

            // Get the current user's ID from the claims
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out var currentUserId))
            {
                return Unauthorized("Unauthenticated");
            }

            // Check if the user being rated exists
            var userBeingRated = await _dbContext.CarpoolUsers.FirstOrDefaultAsync(u => u.UserId == request.UserRatedId);
            if (userBeingRated == null)
            {
                return NotFound($"User with ID {request.UserRatedId} not found.");
            }

            // Check if a rating already exists between the current user and the user being rated
            var existingRating = await _dbContext.Ratings
                .FirstOrDefaultAsync(r => r.UserId == currentUserId && r.UserRatedId == request.UserRatedId);

            if (existingRating != null)
            {
                // Update the existing rating
                existingRating.Rating1 = request.Rating;
                _dbContext.Ratings.Update(existingRating);
            }
            else
            {
                // Create a new rating record
                var newRating = new Rating
                {
                    UserId = currentUserId,
                    UserRatedId = request.UserRatedId,
                    Rating1 = request.Rating
                };
                _dbContext.Ratings.Add(newRating);
            }

            // Save changes to the database
            await _dbContext.SaveChangesAsync();

            return Ok("Rating submitted successfully.");
        }


        // DELETE: api/register/user
        [Authorize]  // Require the user to be authenticated
        [HttpDelete("user")]
        public async Task<IActionResult> DeleteUser()
        {
            // Get the ID of the currently authenticated user from the JWT claims
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int currentUserId))
            {
                return Unauthorized("User ID claim not found or invalid.");
            }

            // Fetch the user from the database using the currentUserId
            var user = await _dbContext.CarpoolUsers.FirstOrDefaultAsync(u => u.UserId == currentUserId);

            // Check if the user exists
            if (user == null)
            {
                return NotFound($"User with ID {currentUserId} not found.");
            }

            // Remove the user from the database
            _dbContext.CarpoolUsers.Remove(user);
            await _dbContext.SaveChangesAsync();

            return Ok(new { Message = $"User with ID {currentUserId} deleted successfully." });
        }

        private string GenerateVerificationToken(int userId)
        {
            var tissuer = _configuration["Jwt:Issuer"];
            var taudience = _configuration["Jwt:Audience"];
            var tsecretKey = _configuration["Jwt:SecretKey"];

            var claims = new[] { new Claim("userID", userId.ToString()) };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tsecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: tissuer,
                audience: taudience,
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest("Invalid token.");
            }

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(token) as JwtSecurityToken;

            if (jsonToken == null)
            {
                return BadRequest("Invalid token.");
            }

            var userIdClaim = jsonToken?.Claims.FirstOrDefault(c => c.Type == "userID")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return BadRequest("Invalid token.");
            }

            var user = await _dbContext.CarpoolUsers.SingleOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            user.Verified = true;
            _dbContext.CarpoolUsers.Update(user);
            await _dbContext.SaveChangesAsync();

            return Ok("Email verified successfully.");
        }
    }
}
