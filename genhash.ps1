Add-Type -TypeDefinition @"
using System;
using System.Security.Cryptography;
using System.Text;
public class PwdHash {
    public static void Gen() {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes("Admin@12345!"), salt, 100000, HashAlgorithmName.SHA512, 32);
        Console.WriteLine(Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash));
    }
}
"@
[PwdHash]::Gen()
