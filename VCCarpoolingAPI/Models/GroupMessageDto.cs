namespace VCCarpoolingAPI.Models
{
    public class GroupMessageDto
    {
        public int GroupId { get; set; }
        public int UserId { get; set; }
        public string Message { get; set; } = null!;
        public string TimeZoneId { get; set; }
    }
}
