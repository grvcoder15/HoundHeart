using System;
using System.IO;

class Program {
    static void Main() {
        string password = "Admin@123";
        string hash = BCrypt.Net.BCrypt.HashPassword(password, 11);
        File.WriteAllText("hash.txt", hash);
        Console.WriteLine("✅ Hash written to hash.txt");
    }
}
