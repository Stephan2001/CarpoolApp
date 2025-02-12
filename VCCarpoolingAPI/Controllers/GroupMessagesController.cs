using Azure.Messaging.ServiceBus;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using VCCarpoolingAPI.Models;

namespace VCCarpoolingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupMessagesController : ControllerBase
    {
        private readonly VarsityCollegeCarpoolingContext _context;
        private readonly ServiceBusClient _client;
        private readonly ServiceBusSender _sender;

        public GroupMessagesController(VarsityCollegeCarpoolingContext context, ServiceBusClient client)
        {
            _context = context;
            _client = client;
            _sender = _client.CreateSender("vccarpoolingtopic");
        }

        //endpoint to send message
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] GroupMessageDto messageDto)
        {
            try
            {
                var nowUtc = DateTime.UtcNow;

                TimeZoneInfo userTimeZone = null;
                if (!string.IsNullOrEmpty(messageDto.TimeZoneId))
                {
                    userTimeZone = TimeZoneInfo.FindSystemTimeZoneById(messageDto.TimeZoneId);
                }
                else
                {
                    // Fallback to a default timezone if no timezone is provided
                    userTimeZone = TimeZoneInfo.Local;
                }

                var userLocalTime = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, userTimeZone);

                var groupMessage = new GroupMessage
                {
                    GroupId = messageDto.GroupId,
                    UserId = messageDto.UserId,
                    Message = messageDto.Message,
                    MessageDate = DateOnly.FromDateTime(userLocalTime),
                    MessageTime = TimeOnly.FromDateTime(userLocalTime)
                };

                // Save the message to the database
                _context.GroupMessages.Add(groupMessage);
                await _context.SaveChangesAsync();

                var messageId = groupMessage.GroupMessageId;

                //get group members to send message to
                var groupMembers = _context.CarpoolUsers
                                    .Where(u => u.GroupId == messageDto.GroupId)
                                    .Select(u => u.UserId)
                                    .ToList();

                var user = _context.CarpoolUsers.FirstOrDefault(u => u.UserId == messageDto.UserId);

                var formattedTime = userLocalTime.ToString("HH:mm");
                var currentDate = DateOnly.FromDateTime(userLocalTime);
                var currentDateFormatted = currentDate.ToString("dd MMM");

                // Prepare the Service Bus message
                var messagePayload = new
                {
                    GroupMessageId = messageId,
                    messageDto.GroupId,
                    messageDto.UserId,
                    user.Name,
                    messageDto.Message,
                    Date = currentDateFormatted,
                    Time = formattedTime,
                    GroupMembers = groupMembers
                };

                var messageBody = JsonSerializer.Serialize(messagePayload);

                var serviceBusMessage = new ServiceBusMessage
                {
                    Body = BinaryData.FromString(messageBody),
                    Subject = messageDto.GroupId.ToString(),
                    ApplicationProperties = { ["GroupId"] = messageDto.GroupId, ["MessageType"] = "GroupMessage"}
                };

                // Send the message to Azure Service Bus
                await _sender.SendMessageAsync(serviceBusMessage);

                return Ok(new { MessageText = "Message sent successfully!", UserId = messageDto.UserId, Name = user.Name, Message = messageDto.Message, Date = currentDateFormatted, Time = userLocalTime.ToString("HH:mm") });
            }
            catch (Exception ex)
            {
                // Return a 500 status with the exception message
                return StatusCode(500, $"Error sending message: {ex.Message}");
            }
        }

        //will use this endpoint to populate group chat UI
        [HttpGet("history/{groupId}")]
        public async Task<IActionResult> GetGroupMessages(int groupId)
        {
            var messages = _context.GroupMessages
                .Where(m => m.GroupId == groupId)
                .Join(_context.CarpoolUsers, //joning carpoolUsers and GroupMessages to get the user's name in the message
                message => message.UserId,
                user => user.UserId,
                (message, user) => new
                {
                    message.GroupMessageId,
                    message.GroupId,
                    message.UserId,
                    user.Name,
                    message.Message,
                    message.MessageDate,
                    MessageTime = message.MessageTime.ToString().Substring(0, 5)
                })
                .OrderBy(m => m.MessageDate)
                .ThenBy(m => m.MessageTime)
                .ToList();

            var formattedMessages = messages.Select(m => new
            {
                m.GroupMessageId,
                m.GroupId,
                m.UserId,
                m.Name,
                m.Message,
                // Format the date after sorting
                MessageDate = m.MessageDate.ToString("dd MMM"),
                m.MessageTime
            }).ToList();

            //return empty list if no messages are found
            if (formattedMessages == null || !formattedMessages.Any())
            {
                return Ok(new List<GroupMessage>());
            }

            return Ok(formattedMessages);
        }
    }
}
