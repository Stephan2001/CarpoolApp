using Azure.Messaging.ServiceBus;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using VCCarpoolingAPI.Models;

namespace VCCarpoolingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrivateMessagesController : ControllerBase
    {
        private readonly VarsityCollegeCarpoolingContext _context;
        private readonly ServiceBusClient _client;
        private readonly ServiceBusSender _sender;

        public PrivateMessagesController(VarsityCollegeCarpoolingContext context, ServiceBusClient client)
        {
            _context = context;
            _client = client;
            _sender = _client.CreateSender("vccarpoolingtopic");
        }

        // Endpoint to send a private message
        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] PrivateMessageDto messageDto)
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
                    userTimeZone = TimeZoneInfo.Local;
                }

                var userLocalTime = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, userTimeZone);

                var privateMessage = new PrivateMessage
                {
                    SenderUserId = messageDto.SenderUserId,
                    ReceivingUserId = messageDto.ReceivingUserId,
                    Message = messageDto.Message,
                    MessageDate = DateOnly.FromDateTime(userLocalTime),
                    MessageTime = TimeOnly.FromDateTime(userLocalTime)
                };

                // Save the message to the database
                _context.PrivateMessages.Add(privateMessage);
                await _context.SaveChangesAsync();

                var messageId = privateMessage.PrivateMessageId;

                // Get sender and receiver user details
                var sender = _context.CarpoolUsers.FirstOrDefault(u => u.UserId == messageDto.SenderUserId);
                var receiver = _context.CarpoolUsers.FirstOrDefault(u => u.UserId == messageDto.ReceivingUserId);

                if (sender == null || receiver == null)
                {
                    return BadRequest("Invalid Sender or Receiver ID.");
                }

                var formattedTime = userLocalTime.ToString("HH:mm");
                var currentDate = DateOnly.FromDateTime(userLocalTime);
                var currentDateFormatted = currentDate.ToString("dd MMM");

                // Prepare the Service Bus message
                var messagePayload = new
                {
                    PrivateMessageId = messageId,
                    SenderUserId = messageDto.SenderUserId,
                    SenderName = sender?.Name,
                    ReceivingUserId = messageDto.ReceivingUserId,
                    ReceiverName = receiver?.Name,
                    messageDto.Message,
                    Date = currentDateFormatted,
                    Time = formattedTime
                };

                var messageBody = JsonSerializer.Serialize(messagePayload);

                var serviceBusMessage = new ServiceBusMessage
                {
                    Body = BinaryData.FromString(messageBody),
                    Subject = $"{messageDto.SenderUserId}-{messageDto.ReceivingUserId}",
                    ApplicationProperties = { ["MessageType"] = "PrivateMessage", ["ReceiverUserId"] = messageDto.ReceivingUserId, ["SenderUserId"] = messageDto.SenderUserId }
                };
                
                // Send the message to the privateMessages subscription
                await _sender.SendMessageAsync(serviceBusMessage);

                return Ok(new
                {
                    privateMessageId = messageId,
                    senderUserId = messageDto.SenderUserId,
                    receiverUserId = messageDto.ReceivingUserId,
                    senderName = sender?.Name,
                    receiverName = receiver?.Name,
                    message = messageDto.Message,
                    date = currentDateFormatted,
                    time = userLocalTime.ToString("HH:mm")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error sending message: {ex.Message}");
            }
        }

        //get message history
        [HttpGet("history/{senderUserId}/{receiverUserId}")]
        public IActionResult GetMessageHistory(int senderUserId, int receiverUserId)
        {
            var messages = _context.PrivateMessages
                .Where(m => (m.SenderUserId == senderUserId && m.ReceivingUserId == receiverUserId)
                            || (m.SenderUserId == receiverUserId && m.ReceivingUserId == senderUserId))
                .Join(_context.CarpoolUsers,
                    message => message.SenderUserId,
                    user => user.UserId,
                    (message, senderUser) => new
                    {
                        message.PrivateMessageId,
                        message.SenderUserId,
                        SenderName = senderUser.Name,
                        message.ReceivingUserId,
                        message.Message,
                        message.MessageDate,
                        MessageTime = message.MessageTime.ToString().Substring(0, 5)
                    })
                .OrderBy(m => m.MessageDate)
                .ThenBy(m => m.MessageTime)
                .ToList();

            var formattedMessages = messages.Select(m => new
            {
                m.PrivateMessageId,
                m.SenderUserId,
                m.SenderName,
                m.ReceivingUserId,
                m.Message,
                MessageDate = m.MessageDate.ToString("dd MMM"),
                MessageTime = m.MessageTime                
            }).ToList();

            //return an empty list if no messages are found
            if (!formattedMessages.Any())
            {
                return Ok(new List<object>());
            }

            return Ok(formattedMessages);
        }

    }
}
