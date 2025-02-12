using System.ComponentModel.DataAnnotations;

namespace VCCarpoolingAPI.Models
{
    public class LoginDto
    {
        [Required]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }
    }
}
