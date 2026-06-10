using Google.Apis.Auth;
using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Services.ServiceResult;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;

using Microsoft.IdentityModel.Tokens;

namespace Hounded_Heart.Services.Services
{
    public class AuthService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthService(IConfiguration configuration, AppDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        #region GoogleLogin
        public async Task<ApiResponse<object>> GoogleLoginAsync(GoogleLoginDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.Token))
                    return ResponseHelper.Fail<object>("Google token is required.", 400);

                // ✅ Validate Google token
                var audience = new[]
                {
                    _configuration["GoogleAuth:WebClientId"],
                }.Where(x => !string.IsNullOrEmpty(x)).ToArray();

                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.Token,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = audience
                    });

                if (payload == null)
                    return ResponseHelper.Fail<object>("Invalid Google token.", 401);

                // 🔍 Check if user exists
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

                if (user == null)
                {
                    // 🟢 Signup flow
                    user = new User
                    {
                        UserId = Guid.NewGuid(),
                        FullName = payload.GivenName,
                        Email = payload.Email,
                        RoleId = 2,
                        CreatedOn = DateTime.UtcNow,
                        IsActive = true,
                        IsDeleted = false,
                        IsTermAccepted = true,
                        PasswordHash = "",
                        IsGoogleSignIn = true,
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Check status for existing users
                    if (user.Status == "Suspended")
                    {
                        return ResponseHelper.Fail<object>("Your account is suspended. Please contact support.", 403);
                    }
                    if (user.Status == "Banned")
                    {
                        return ResponseHelper.Fail<object>("Your account is banned.", 403);
                    }
                }

                var token = GenerateJwtToken(user.UserId, user.Email);

                // ✅ Final response
                return ResponseHelper.Success<object>(
                    new
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        Email = user.Email,
                        Token = token,
                    },
                    "Signin successful via Google.",
                    200
                );
            }
            catch (Exception)
            {
                return ResponseHelper.Fail<object>("Internal server error during Google login.", 500);
            }
        }
        #endregion GoogleLogin

        #region AppleLogin
        public async Task<ApiResponse<object>> AppleLoginAsync(string appleToken)
        {
            // For Sandbox Mode: We simulate a successful Apple login
            // In production, we would use an Apple ID token validator (like JWT)
            
            try
            {
                if (string.IsNullOrEmpty(appleToken))
                    return ResponseHelper.Fail<object>("Apple token is required.", 400);

                // Mock payload (In reality, this comes from Apple's JWT)
                var appleEmail = "apple_user@houndheart.example";
                var appleFullName = "Apple User";

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == appleEmail);

                if (user == null)
                {
                    user = new User
                    {
                        UserId = Guid.NewGuid(),
                        FullName = appleFullName,
                        Email = appleEmail,
                        RoleId = 2,
                        CreatedOn = DateTime.UtcNow,
                        IsActive = true,
                        IsDeleted = false,
                        IsTermAccepted = true,
                        PasswordHash = "",
                        IsGoogleSignIn = false, // Could add IsAppleSignIn but using this for logic parity
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                var token = GenerateJwtToken(user.UserId, user.Email);

                return ResponseHelper.Success<object>(
                    new
                    {
                        UserId = user.UserId,
                        FullName = user.FullName,
                        Email = user.Email,
                        Token = token,
                    },
                    "Signin successful via Apple (Sandbox).",
                    200
                );
            }
            catch (Exception)
            {
                return ResponseHelper.Fail<object>("Internal server error during Apple login.", 500);
            }
        }
        #endregion AppleLogin

        private string GenerateJwtToken(Guid id, string emailAddress)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, id.ToString()),     // ✅ gives you user ID from token
                new Claim(ClaimTypes.Email, emailAddress),               // ✅ allows accessing user's email
                new Claim(ClaimTypes.Name, emailAddress)                 // (optional) for User.Identity.Name
            };
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(double.Parse(_configuration["Jwt:DurationInHours"] ?? "8")),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
