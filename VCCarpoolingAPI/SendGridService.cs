using SendGrid.Helpers.Mail;
using SendGrid;

namespace VCCarpoolingAPI
{
    public class SendGridService
    {
        private readonly string _sendGridApiKey;
        private readonly IConfiguration _configuration;

        public SendGridService(IConfiguration configuration)
        {
            _configuration = configuration;
            _sendGridApiKey = _configuration["SendGrid:ApiKey"];
        }

        public async Task SendVerificationEmailAsync(string email, string verificationLink)
        {
            var client = new SendGridClient(_sendGridApiKey);
            var from = new EmailAddress("moolmans20013@gmail.com", "Carpool App");
            var subject = "Email Verification";
            var to = new EmailAddress(email);
            var plainTextContent = $"Please verify your email by clicking on the following link: {verificationLink}";
            var htmlContent = $"<strong>Please verify your email by clicking on the following link:</strong><br><a href='{verificationLink}'>Verify Email</a>";
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);

            await client.SendEmailAsync(msg);
        }
    }
}
