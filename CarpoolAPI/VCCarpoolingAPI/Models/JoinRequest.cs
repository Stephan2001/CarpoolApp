using System;
using System.Collections.Generic;

namespace VCCarpoolingAPI.Models;

public partial class JoinRequest
{
    public int JoinRequestId { get; set; }

    public string? RequestMessage { get; set; }

    public int SenderUserId { get; set; }

    public int RecieverUserId { get; set; }

    public int? GroupId { get; set; }

    public virtual Group? Group { get; set; }

    public virtual CarpoolUser RecieverUser { get; set; } = null!;

    public virtual CarpoolUser SenderUser { get; set; } = null!;
}
