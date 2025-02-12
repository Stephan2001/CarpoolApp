namespace VCCarpoolingAPI.Models
{
    public class UserDto
    {
        public int UserId { get; set; }

        public int? GroupId { get; set; }
        public string GroupName { get; set; }

        public decimal? RatingCalc { get; set; }

        public string Name { get; set; } = null!;

        public string Email { get; set; } = null!;
        public string? ProfileImage { get; set; }
    }
}
