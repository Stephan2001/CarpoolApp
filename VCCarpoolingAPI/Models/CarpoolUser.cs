using System;
using System.Collections.Generic;

namespace VCCarpoolingAPI.Models;

public partial class CarpoolUser
{
    public int UserId { get; set; }

    public int? GroupId { get; set; }

    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public string? Role { get; set; }

    public string? ProfileImage { get; set; }

    public bool? Verified { get; set; }

    public virtual ICollection<BlockedUser> BlockedUserUserIdblockedNavigations { get; set; } = new List<BlockedUser>();

    public virtual ICollection<BlockedUser> BlockedUserUsers { get; set; } = new List<BlockedUser>();

    public virtual Group? Group { get; set; }

    public virtual ICollection<GroupMessage> GroupMessages { get; set; } = new List<GroupMessage>();

    public virtual ICollection<JoinRequest> JoinRequestRecieverUsers { get; set; } = new List<JoinRequest>();

    public virtual ICollection<JoinRequest> JoinRequestSenderUsers { get; set; } = new List<JoinRequest>();

    public virtual ICollection<PrivateMessage> PrivateMessageReceivingUsers { get; set; } = new List<PrivateMessage>();

    public virtual ICollection<PrivateMessage> PrivateMessageSenderUsers { get; set; } = new List<PrivateMessage>();

    public virtual ICollection<Rating> RatingUserRateds { get; set; } = new List<Rating>();

    public virtual ICollection<Rating> RatingUsers { get; set; } = new List<Rating>();
}
