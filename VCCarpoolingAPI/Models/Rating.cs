using System;
using System.Collections.Generic;

namespace VCCarpoolingAPI.Models;

public partial class Rating
{
    public int RatingId { get; set; }

    public int UserId { get; set; }

    public int UserRatedId { get; set; }

    public decimal? Rating1 { get; set; }

    public virtual CarpoolUser User { get; set; } = null!;

    public virtual CarpoolUser UserRated { get; set; } = null!;
}
