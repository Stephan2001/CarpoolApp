using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace VCCarpoolingAPI.Models;

public partial class VarsityCollegeCarpoolingContext : DbContext
{
    public VarsityCollegeCarpoolingContext()
    {
    }

    public VarsityCollegeCarpoolingContext(DbContextOptions<VarsityCollegeCarpoolingContext> options)
        : base(options)
    {
    }

    public virtual DbSet<BlockedUser> BlockedUsers { get; set; }

    public virtual DbSet<CarpoolUser> CarpoolUsers { get; set; }

    public virtual DbSet<Group> Groups { get; set; }

    public virtual DbSet<GroupMessage> GroupMessages { get; set; }

    public virtual DbSet<JoinRequest> JoinRequests { get; set; }

    public virtual DbSet<PrivateMessage> PrivateMessages { get; set; }

    public virtual DbSet<Rating> Ratings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BlockedUser>(entity =>
        {
            entity.ToTable("BlockedUser");

            entity.Property(e => e.BlockedUserId).HasColumnName("BlockedUserID");
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.UserIdblocked).HasColumnName("UserIDBlocked");

            entity.HasOne(d => d.User).WithMany(p => p.BlockedUserUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BlockedUser_CarpoolUsers");

            entity.HasOne(d => d.UserIdblockedNavigation).WithMany(p => p.BlockedUserUserIdblockedNavigations)
                .HasForeignKey(d => d.UserIdblocked)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BlockedUser_CarpoolUsers1");
        });

        modelBuilder.Entity<CarpoolUser>(entity =>
        {
            entity.HasKey(e => e.UserId);

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.GroupId).HasColumnName("GroupID");

            entity.HasOne(d => d.Group).WithMany(p => p.CarpoolUsers)
                .HasForeignKey(d => d.GroupId)
                .HasConstraintName("FK_CarpoolUsers_Groups");
        });

        modelBuilder.Entity<Group>(entity =>
        {
            entity.Property(e => e.GroupId).HasColumnName("GroupID");
            entity.Property(e => e.AdminId).HasColumnName("AdminID");
            entity.Property(e => e.GroupName).HasMaxLength(100);
            entity.Property(e => e.VarsityLocation).HasMaxLength(100);
        });

        modelBuilder.Entity<GroupMessage>(entity =>
        {
            entity.Property(e => e.GroupMessageId).HasColumnName("GroupMessageID");
            entity.Property(e => e.GroupId).HasColumnName("GroupID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Group).WithMany(p => p.GroupMessages)
                .HasForeignKey(d => d.GroupId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GroupMessages_Groups");

            entity.HasOne(d => d.User).WithMany(p => p.GroupMessages)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_GroupMessages_CarpoolUsers");
        });

        modelBuilder.Entity<JoinRequest>(entity =>
        {
            entity.Property(e => e.JoinRequestId).HasColumnName("JoinRequestID");
            entity.Property(e => e.GroupId).HasColumnName("GroupID");
            entity.Property(e => e.RecieverUserId).HasColumnName("RecieverUserID");
            entity.Property(e => e.SenderUserId).HasColumnName("SenderUserID");

            entity.HasOne(d => d.Group).WithMany(p => p.JoinRequests)
                .HasForeignKey(d => d.GroupId)
                .HasConstraintName("FK_JoinRequests_Groups");

            entity.HasOne(d => d.RecieverUser).WithMany(p => p.JoinRequestRecieverUsers)
                .HasForeignKey(d => d.RecieverUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_JoinRequests_CarpoolUsers1");

            entity.HasOne(d => d.SenderUser).WithMany(p => p.JoinRequestSenderUsers)
                .HasForeignKey(d => d.SenderUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_JoinRequests_CarpoolUsers");
        });

        modelBuilder.Entity<PrivateMessage>(entity =>
        {
            entity.Property(e => e.PrivateMessageId).HasColumnName("PrivateMessageID");
            entity.Property(e => e.ReceivingUserId).HasColumnName("ReceivingUserID");
            entity.Property(e => e.SenderUserId).HasColumnName("SenderUserID");

            entity.HasOne(d => d.ReceivingUser).WithMany(p => p.PrivateMessageReceivingUsers)
                .HasForeignKey(d => d.ReceivingUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PrivateMessages_CarpoolUsers1");

            entity.HasOne(d => d.SenderUser).WithMany(p => p.PrivateMessageSenderUsers)
                .HasForeignKey(d => d.SenderUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PrivateMessages_CarpoolUsers");
        });

        modelBuilder.Entity<Rating>(entity =>
        {
            entity.ToTable("Rating");

            entity.Property(e => e.RatingId).HasColumnName("RatingID");
            entity.Property(e => e.Rating1)
                .HasColumnType("decimal(4, 2)")
                .HasColumnName("Rating");
            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.UserRatedId).HasColumnName("UserRatedID");

            entity.HasOne(d => d.User).WithMany(p => p.RatingUsers)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Rating_UserID");

            entity.HasOne(d => d.UserRated).WithMany(p => p.RatingUserRateds)
                .HasForeignKey(d => d.UserRatedId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Rating_UserRatedID");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
