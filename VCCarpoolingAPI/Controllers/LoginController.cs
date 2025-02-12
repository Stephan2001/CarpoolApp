using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using VCCarpoolingAPI.Models;

namespace VCCarpoolingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        //declaring the encryption and dbContext class
        private readonly VarsityCollegeCarpoolingContext dbContextVC;
        private readonly Encryption encryptionVC;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _memoryCache;


        //initilizing/injecting the encryption and dbContext class into the controller
        public LoginController(VarsityCollegeCarpoolingContext dbContext, Encryption encryption, IConfiguration configuration, IMemoryCache memoryCache)
        {
            dbContextVC = dbContext;
            encryptionVC = encryption;
            _configuration = configuration;
            _memoryCache = memoryCache;
        }

        //HttpPost method to handle user login
        [HttpPost]
        public IActionResult Login([FromBody] LoginDto login)
        {
            string cacheKey = $"LoginAttempts-{login.Email}";
            int maxAttempts = 5;
            TimeSpan lockoutDuration = TimeSpan.FromMinutes(15);

            // Check the number of failed login attempts from the cache
            if (!_memoryCache.TryGetValue(cacheKey, out int failedAttempts))
            {
                failedAttempts = 0;
            }

            var user = dbContextVC.CarpoolUsers.SingleOrDefault(u => u.Email == login.Email);

            // If user exists, check if account is locked
            if (failedAttempts >= maxAttempts)
            {
                return BadRequest($"Too many login attempts. Please try again after {lockoutDuration.TotalMinutes} minutes.");
            }

            if (user == null)
            {
                IncrementFailedAttempts(cacheKey, failedAttempts, lockoutDuration);
                return BadRequest("Invalid username or password");
            }

            if (user.Verified != true) // This checks for both false and null.
            {
                return BadRequest("Please verify your email before logging in.");
            }

            bool passwordVerified = encryptionVC.VerifyPasssword(login.Password, user.Password);

            if (passwordVerified)
            {
                // Reset the cache on successful login
                _memoryCache.Remove(cacheKey);

                var response = new
                {
                    UserId = user.UserId,
                    GroupId = user.GroupId
                };

                return Ok(response);
            }
            else
            {
                IncrementFailedAttempts(cacheKey, failedAttempts, lockoutDuration);
                return BadRequest("Invalid username or password");
            }
        }

        // Helper method to increment failed login attempts
        private void IncrementFailedAttempts(string cacheKey, int currentAttempts, TimeSpan lockoutDuration)
        {
            int newAttempts = currentAttempts + 1;

            // Add or update the cache entry
            _memoryCache.Set(cacheKey, newAttempts, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = lockoutDuration
            });
        }

        [HttpPost("token")]
        public async Task<IActionResult> GenerateToken([FromBody] TokenGenerationRequest request)
        {
            var user = await dbContextVC.CarpoolUsers.FirstOrDefaultAsync(u => u.UserId == request.userID);
            if (user == null) {
                return BadRequest("Invalid user id");
            }
            var tokenHandler = new JwtSecurityTokenHandler();
            var secretKey = _configuration["Jwt:SecretKey"];
            Console.WriteLine("secretKey1: " + secretKey);
            var key = new SymmetricSecurityKey(Convert.FromBase64String(secretKey)); // Decode from Base64
            Console.WriteLine("secretKey decoded1: " + key);
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            // Define claims for the token
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new("userID", request.userID.ToString()),
                new("name", user.Name),
                new("email", user.Email)
            };

            if (user.GroupId != null)
            {
                claims.Add(new Claim("groupID", user.GroupId.ToString()));
            }

            foreach (var claimPair in request.CustomClaimPairs)
            {
                var jsonElement = (JsonElement)claimPair.Value;
                var claimValue = jsonElement.ValueKind switch
                {
                    JsonValueKind.True => "true",
                    JsonValueKind.False => "false",
                    JsonValueKind.Number => jsonElement.GetDouble().ToString(),
                    _ => jsonElement.ToString(),
                };

                var claim = new Claim(claimPair.Key, claimValue, ClaimValueTypes.String);
                claims.Add(claim);
            }

            var expires = DateTime.UtcNow.AddHours(2);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = expires,
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            return Ok(new { Token = jwt });
        }

    }
}
