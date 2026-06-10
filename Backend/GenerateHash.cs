using System;

class Program {
    static void Main() {
        string password = "Admin@123";
        string hash = BCrypt.Net.BCrypt.HashPassword(password, 11);
        Console.WriteLine(hash);
    }
}
