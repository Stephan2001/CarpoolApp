using BCryptNet = BCrypt.Net.BCrypt;
namespace VCCarpoolingAPI
{
    public class Encryption
    {
        // this encrypts a string password
        public string HashPassword(string password)
        {
            string salt = BCryptNet.GenerateSalt(12);
            String hashedPassword = BCryptNet.HashPassword(password, salt);
            return hashedPassword;
        }

        // this decrypts and verifies a user password
        public bool VerifyPasssword(string password, string hashedPassword)
        {
            bool isValid = BCryptNet.Verify(password, hashedPassword);
            return isValid;
        }
    }
}
