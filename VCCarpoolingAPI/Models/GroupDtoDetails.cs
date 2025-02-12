namespace VCCarpoolingAPI.Models
{
    public class GroupDtoDetails
    {
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public string VarsityLocation { get; set; }
        public string Registration {  get; set; }
        public int? AdminId { get; set; }
        public string? GroupImage { get; set; }
        public List<GroupUserDto> Users { get; set; }
    }
}
