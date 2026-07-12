using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    static void Main()
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes("Admin@12345!"), salt, 100_000, HashAlgorithmName.SHA512, 32);
        Console.WriteLine($"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}");
    }
}
