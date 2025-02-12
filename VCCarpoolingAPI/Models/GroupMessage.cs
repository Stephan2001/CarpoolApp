using System;
using System.Collections.Generic;

namespace VCCarpoolingAPI.Models;

public partial class GroupMessage
{
    public int GroupMessageId { get; set; }

    public int GroupId { get; set; }

    public int UserId { get; set; }

    public string Message { get; set; } = null!;

    public DateOnly MessageDate { get; set; }

    public TimeOnly MessageTime { get; set; }

    public virtual Group Group { get; set; } = null!;

    public virtual CarpoolUser User { get; set; } = null!;
}
