namespace VCCarpoolingAPI.Models
{
    public class PrivateMessageDto
    {
        public int SenderUserId { get; set; }
        public int ReceivingUserId { get; set; }
        public string Message { get; set; } = null!;
        public string TimeZoneId { get; set; }
    }
}
