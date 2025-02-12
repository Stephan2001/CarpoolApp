using System;
using System.Collections.Generic;

namespace VCCarpoolingAPI.Models;

public partial class BlockedUser
{
    public int BlockedUserId { get; set; }

    public int UserId { get; set; }

    public int UserIdblocked { get; set; }

    public virtual CarpoolUser User { get; set; } = null!;

    public virtual CarpoolUser UserIdblockedNavigation { get; set; } = null!;
}
