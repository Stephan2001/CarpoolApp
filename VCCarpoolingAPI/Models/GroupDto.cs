namespace VCCarpoolingAPI.Models
{
    public class GroupDto
    {
        public int GroupId { get; set; }
        public string groupName { get; set; }
        public string varsity { get; set; }
        public string radius { get; set; } = null!;
        public int size { get; set; }
        public string Admin { get; set; } = null!;
        public string? GroupImage { get; set; }
    }
}
