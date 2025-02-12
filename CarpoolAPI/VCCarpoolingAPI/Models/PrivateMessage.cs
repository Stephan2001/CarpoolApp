using System;
using System.Collections.Generic;

namespace VCCarpoolingAPI.Models;

public partial class PrivateMessage
{
    public int PrivateMessageId { get; set; }

    public int SenderUserId { get; set; }

    public int ReceivingUserId { get; set; }

    public string Message { get; set; } = null!;

    public DateOnly MessageDate { get; set; }

    public TimeOnly MessageTime { get; set; }

    public virtual CarpoolUser ReceivingUser { get; set; } = null!;

    public virtual CarpoolUser SenderUser { get; set; } = null!;
}
