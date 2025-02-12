namespace VCCarpoolingAPI.Models
{
    public class TokenGenerationRequest
    {
        public int userID { get; set; }
        public Dictionary<string, object> CustomClaimPairs { get; set; }
    }
}
