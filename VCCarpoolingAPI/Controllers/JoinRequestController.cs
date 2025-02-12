using Azure.Messaging.ServiceBus;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VCCarpoolingAPI.Models;
using System.Text.Json;

namespace VCCarpoolingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JoinRequestController : ControllerBase
    {
        private readonly VarsityCollegeCarpoolingContext _dbContext;
        private readonly ServiceBusClient _client;
        private readonly ServiceBusSender _sender;

        public JoinRequestController(VarsityCollegeCarpoolingContext dbContext, ServiceBusClient client)
        {
            _dbContext = dbContext;
            _client = client;
            _sender = _client.CreateSender("vccarpoolingtopic");
        }

        [Authorize]
        [HttpPost("joinrequest")]
        public async Task<IActionResult> JoinRequest([FromForm] JoinGroupDto joinGroupDto)
        {
            if (joinGroupDto == null || joinGroupDto.SenderUserId == null || joinGroupDto.RecieverUserId == null || joinGroupDto.GroupId == null)
            {
                return BadRequest("Invalid data");
            }

            // Get the current userID from the JWT claims
            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int SenderUserId))
            {
                return Unauthorized("User ID claim not found");
            }

            //create join request
            var newJoinRequest = new JoinRequest
            {
                SenderUserId = SenderUserId,
                RecieverUserId = joinGroupDto.RecieverUserId,
                GroupId = joinGroupDto.GroupId,
                
            };
            
            //add the join request to the database
            _dbContext.JoinRequests.Add(newJoinRequest);
            await _dbContext.SaveChangesAsync();

            var senderUser = _dbContext.CarpoolUsers.FirstOrDefault(u => u.UserId == SenderUserId);
            var receiverUser = _dbContext.CarpoolUsers.FirstOrDefault(u => u.UserId == joinGroupDto.RecieverUserId);

            if (senderUser == null || receiverUser == null)
            {
                return NotFound("Invalid sender or receiver.");
            }

            var notificationPayload = new
            {
                JoinRequestId = newJoinRequest.JoinRequestId,
                SenderUserId,
                joinGroupDto.RecieverUserId,
                joinGroupDto.GroupId,
                SenderName = senderUser.Name,
                Message = $"{senderUser.Name} has requested to join your group."
            };

            var messageBody = JsonSerializer.Serialize(notificationPayload);

            var serviceBusMessage = new ServiceBusMessage
            {
                Body = BinaryData.FromString(messageBody),
                Subject = "NewJoinRequest",
                ApplicationProperties = { ["RecieverUserId"] = joinGroupDto.RecieverUserId, ["MessageType"] = "GroupMessage" }
            };

            // Send the message to the Azure Service Bus
            await _sender.SendMessageAsync(serviceBusMessage);

            var responseDto = new
            {
                JoinRequestId = newJoinRequest.JoinRequestId,
                SenderUserId = newJoinRequest.SenderUserId,
                RecieverUserId = newJoinRequest.RecieverUserId,
                GroupId = newJoinRequest.GroupId,
                Status = "Group Request Added"
            };

            return Ok(responseDto);
        }


        [HttpGet("alljoinrequests")]
        public async Task<IActionResult> GetAllJoinRequests()
        {
            // Fetch all join requests with the sender's ID and name
            var joinRequests = await _dbContext.JoinRequests
                .Include(jr => jr.SenderUser) // Join with CarpoolUser
                .Select(jr => new
                {
                    jr.JoinRequestId,
                    jr.SenderUserId,
                    jr.RecieverUserId,
                    jr.GroupId,
                    SenderName = jr.SenderUser.Name // Fetch the sender's name
                })
                .ToListAsync();

            if (joinRequests == null || !joinRequests.Any())
            {
                return NotFound("No join requests found.");
            }

            return Ok(joinRequests);
        }

        //accept request
        [Authorize]
        [HttpPost("acceptrequest/{joinRequestId}")]
        public async Task<IActionResult> AcceptJoinRequest(int joinRequestId)
        {
            //find join request
            var joinRequest = await _dbContext.JoinRequests
                .Include(jr => jr.SenderUser)
                .Include(jr => jr.Group)
                .FirstOrDefaultAsync(jr => jr.JoinRequestId == joinRequestId);

            if (joinRequest == null)
            {
                return NotFound("Join request not found.");
            }

            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int groupAdminId))
            {
                return Unauthorized("User ID claim not found");
            }

            //add user
            var group = await _dbContext.Groups
                .Include(g => g.CarpoolUsers)
                .FirstOrDefaultAsync(g => g.GroupId == joinRequest.GroupId);

            if (group == null)
            {
                return NotFound("Group not found.");
            }

            //get user to add to group
            var userToAdd = await _dbContext.CarpoolUsers
                .FirstOrDefaultAsync(u => u.UserId == joinRequest.SenderUserId);

            if (userToAdd == null)
            {
                return NotFound("User not found.");
            }

            if (group.AdminId != groupAdminId)
            {
                return Unauthorized("You are not authorized to accept the request.");
            }

            //add the user
            group.CarpoolUsers.Add(userToAdd);

            //remove join request after acceptance
            _dbContext.JoinRequests.Remove(joinRequest);

            //delete join requests related to sender
            var otherJoinRequests = await _dbContext.JoinRequests
                .Where(jr => jr.SenderUserId == joinRequest.SenderUserId)
                .ToListAsync();

            _dbContext.JoinRequests.RemoveRange(otherJoinRequests);

            await _dbContext.SaveChangesAsync();

            var notificationPayload = new
            {
                JoinRequestId = joinRequest.JoinRequestId,
                SenderUserId = joinRequest.SenderUserId,
                ReceiverUserId = joinRequest.RecieverUserId,
                GroupId = joinRequest.GroupId,
                SenderName = joinRequest.SenderUser.Name,
                Message = $"{joinRequest.RecieverUser.Name} accepted your join request."
            };

            var messageBody = JsonSerializer.Serialize(notificationPayload);

            var serviceBusMessage = new ServiceBusMessage
            {
                Body = BinaryData.FromString(messageBody),
                Subject = "JoinRequestAccepted",
                ApplicationProperties = { ["ReceiverUserId"] = joinRequest.RecieverUserId, ["MessageType"] = "GroupMessage", ["GetMessage"] = joinRequest.SenderUserId }
            };

            await _sender.SendMessageAsync(serviceBusMessage);

            return Ok(new { Message = "User added to group and join request deleted." });
        }

        [HttpPost("declinerequest/{joinRequestId}")]
        public async Task<IActionResult> DeclineJoinRequest(int joinRequestId)
        {
            //find request
            var joinRequest = await _dbContext.JoinRequests
                .FirstOrDefaultAsync(jr => jr.JoinRequestId == joinRequestId);

            if (joinRequest == null)
            {
                return NotFound("Join request not found.");
            }

            var currentUserIdClaim = User.FindFirst("userID");
            if (currentUserIdClaim == null || !int.TryParse(currentUserIdClaim.Value, out int groupAdminId))
            {
                return Unauthorized("User ID claim not found");
            }

            var group = await _dbContext.Groups
                .Include(g => g.CarpoolUsers)
                .FirstOrDefaultAsync(g => g.GroupId == joinRequest.GroupId);

            if (group == null)
            {
                return NotFound("Not found");
            }

            if (group.AdminId != groupAdminId)
            {
                return Unauthorized("You are not authorized to decline the request.");
            }

            //delete request
            _dbContext.JoinRequests.Remove(joinRequest);

            await _dbContext.SaveChangesAsync();

            return Ok(new { Message = "Join request declined and deleted." });
        }
    }
}
