namespace VCCarpoolingAPI.Models
{
    public class CreateGroupDto
    {
        public string groupName { get; set; } = null!;
        public string LocationRadius { get; set; } = null!;
        public int PassengerCount { get; set; }
        public string VarsityLocation { get; set; } = null!;
        public IFormFile? GroupImage { get; set; }
        public IFormFile CarRegistrationPhoto { get; set; } = null!;
    }
}
