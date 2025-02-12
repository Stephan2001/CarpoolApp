using System;
using System.Collections.Generic;

namespace VCCarpoolingAPI.Models;

public partial class Group
{
    public int GroupId { get; set; }

    public string LocationRadius { get; set; } = null!;

    public int PassengerCount { get; set; }

    public int? AdminId { get; set; }

    public string VarsityLocation { get; set; } = null!;

    public string GroupName { get; set; } = null!;

    public string? GroupImage { get; set; }

    public string? LisencePhoto { get; set; }

    public string? CarRegistrationPhoto { get; set; }

    public virtual ICollection<CarpoolUser> CarpoolUsers { get; set; } = new List<CarpoolUser>();

    public virtual ICollection<GroupMessage> GroupMessages { get; set; } = new List<GroupMessage>();

    public virtual ICollection<JoinRequest> JoinRequests { get; set; } = new List<JoinRequest>();
}
