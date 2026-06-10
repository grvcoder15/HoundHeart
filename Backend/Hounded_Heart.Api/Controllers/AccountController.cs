using Hounded_Heart.Models.Data;
using Hounded_Heart.Models.Dtos;
using Hounded_Heart.Models.DTOs;
using Hounded_Heart.Models.Models;
using Hounded_Heart.Api.Response;
using Hounded_Heart.Services.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using static Azure.Core.HttpHeader;

namespace Hounded_Heart.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly BlobStorageService _blobService;
        private readonly AuthService _authService;
        private readonly ChangePasswordService _changePassword;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _memoryCache;
        public AccountController(AppDbContext context, IConfiguration configuration, BlobStorageService blobService,
            AuthService authService, ChangePasswordService changePassword, IEmailService emailService, IMemoryCache memoryCache)
        {
            _context = context;
            _configuration = configuration;
            _blobService = blobService;
            _authService = authService;
            _changePassword = changePassword;
            _emailService = emailService;
            _memoryCache = memoryCache;
        }
        #region Add User
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterAccountDto dto)
        {
            try
            {
                // Check if email was pre-verified via OTP
                var verifiedEmailKey = $"verified_email_{dto.Email.Trim().ToLower()}";
                bool isEmailPreVerified = _memoryCache.TryGetValue(verifiedEmailKey, out _);
                // Check if new registrations are enabled
                var regEnabledSetting = await _context.SiteSettings
                    .Where(s => s.SettingKey == "Platform_AllowNewRegistrations")
                    .Select(s => s.SettingValue)
                    .FirstOrDefaultAsync();

                if (regEnabledSetting == "False")
                {
                    return StatusCode(403, ResponseHelper.Fail<string>("New user registrations are currently disabled.", 403));
                }

                if (_context.Users.Any(u => u.Email.ToLower() == dto.Email.ToLower()))
                {
                    return BadRequest(ResponseHelper.Fail<string>("User already exists with this email.", 400));
                }

                if (!dto.IsTermsAccepted)
                {
                    return BadRequest(ResponseHelper.Fail<string>("You must accept the terms and conditions to register.", 400));
                }

                //if (dto.Password != dto.ConfirmPassword)
                //{
                //    return BadRequest(ResponseHelper.Fail<string>("Password and Confirm Password do not match.", 400));
                //}

                var user = new User
                {
                    UserId = Guid.NewGuid(),
                    Email = dto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    FullName = dto.FullName,
                    RoleId = 1,
                    IsActive = true,
                    IsDeleted = false,
                    IsTermAccepted = dto.IsTermsAccepted,
                    IsEmailVerified = isEmailPreVerified,
                    Age = dto.Age,
                    Status = "Active",
                    IsPremium = false,
                    IsGoogleSignIn = false,
                    CreatedOn = DateTime.UtcNow,
                    UpdatedOn = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create HumanProfiles row so phone number and baseline tracking work from day 1
                _context.HumanProfiles.Add(new Hounded_Heart.Models.Data.HumanProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.UserId,
                    Name = dto.FullName,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                // Only send OTP email if email was NOT pre-verified
                if (!isEmailPreVerified)
                {
                    // Generate and send verification OTP
                    var otp = new Random().Next(1000, 9999).ToString();
                    var newOtp = new UserOtp
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.UserId,
                        Email = user.Email,
                        OtpCode = otp,
                        ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                        IsUsed = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.UserOtps.Add(newOtp);
                    await _context.SaveChangesAsync();

                    // Send verification email
                    string verificationBody = $@"
        <html>
        <body style='font-family: Arial, sans-serif;'>
          <h2>Welcome to HoundHeart!</h2>
          <p>Thank you for signing up. Please verify your email to complete registration.</p>
          <p><strong>Your verification code is:</strong></p>
          <h3 style='color: #7c3aed; font-size: 32px; letter-spacing: 4px;'>{otp}</h3>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not create this account, please ignore this email.</p>
          <p>Best regards,<br/>The Hound Heart Team</p>
        </body>
        </html>";

                    try
                    {
                        await _emailService.SendEmailAsync(user.Email, "Verify Your HoundHeart Email", verificationBody);
                    }
                    catch (Exception emailEx)
                    {
                        Console.WriteLine($"Email send failed for signup verification: {emailEx.Message}");
                    }
                }
                else
                {
                    // Email was pre-verified, send welcome email instead
                    string welcomeBody = $@"
        <html>
        <body style='font-family: Arial, sans-serif;'>
          <h2>Welcome to HoundHeart!</h2>
          <p>Your account has been successfully created and your email is verified.</p>
          <p>You can now log in and start your spiritual journey with your canine companion.</p>
          <p>Best regards,<br/>The Hound Heart Team</p>
        </body>
        </html>";

                    try
                    {
                        await _emailService.SendEmailAsync(user.Email, "Welcome to HoundHeart!", welcomeBody);
                    }
                    catch (Exception emailEx)
                    {
                        Console.WriteLine($"Welcome email send failed: {emailEx.Message}");
                    }
                }

                // If email was pre-verified via OTP, generate token and return immediately
                if (isEmailPreVerified)
                {
                    _memoryCache.Remove(verifiedEmailKey); // Clean up verified email marker
                    var token = GenerateJwtToken(user.UserId, user.Email);
                    return Ok(ResponseHelper.Success(new
                    {
                        UserId = user.UserId,
                        Email = user.Email,
                        Token = token,
                        RequiresEmailVerification = false
                    }, "Registration successful! Welcome to HoundHeart.", 200));
                }

                // Otherwise require email verification
                return Ok(ResponseHelper.Success(new
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    RequiresEmailVerification = true
                }, "Registration successful! Please check your email for verification code.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Registration failed: {ex.Message}", 500));
            }
        }

        #endregion

        #region Email Verification
        [HttpPost("send-signup-otp")]
        public async Task<IActionResult> SendSignupOtp([FromBody] SendSignupOtpDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email))
                    return BadRequest(ResponseHelper.Fail<string>("Email is required.", 400));

                var emailKey = dto.Email.Trim().ToLower();

                // Check if email is already registered
                var existingUser = await _context.Users
                    .AnyAsync(u => u.Email.ToLower() == emailKey && !u.IsDeleted);
                if (existingUser)
                    return BadRequest(ResponseHelper.Fail<string>("This email is already registered.", 400));

                // Rate-limit: allow resend after 60 seconds
                var rateLimitKey = $"signup_otp_rate_{emailKey}";
                if (_memoryCache.TryGetValue(rateLimitKey, out _))
                    return BadRequest(ResponseHelper.Fail<string>("Please wait 60 seconds before requesting another OTP.", 400));

                var otpCode = new Random().Next(1000, 9999).ToString();
                var cacheKey = $"signup_otp_{emailKey}";

                _memoryCache.Set(cacheKey, otpCode, TimeSpan.FromMinutes(10));
                _memoryCache.Set(rateLimitKey, true, TimeSpan.FromSeconds(60));

                string body = $@"
<html>
<body style='font-family: Arial, sans-serif;'>
  <h2>Verify Your HoundHeart Email</h2>
  <p>Use the code below to verify your email address:</p>
  <h3 style='color: #7c3aed; font-size: 32px; letter-spacing: 4px;'>{otpCode}</h3>
  <p>This code expires in 10 minutes.</p>
  <p>Best regards,<br/>The Hound Heart Team</p>
</body>
</html>";

                try { await _emailService.SendEmailAsync(dto.Email.Trim(), "Verify Your HoundHeart Email", body); }
                catch (Exception emailEx) { Console.WriteLine($"Signup OTP email failed: {emailEx.Message}"); }

                return Ok(ResponseHelper.Success<string>(null, "Verification code sent to your email.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Failed to send OTP: {ex.Message}", 500));
            }
        }

        [HttpPost("verify-signup-otp")]
        public IActionResult VerifySignupOtp([FromBody] VerifySignupOtpDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.OtpCode))
                    return BadRequest(ResponseHelper.Fail<string>("Email and OTP code are required.", 400));

                var cacheKey = $"signup_otp_{dto.Email.Trim().ToLower()}";

                if (!_memoryCache.TryGetValue(cacheKey, out string? storedOtp) || storedOtp != dto.OtpCode.Trim())
                    return BadRequest(ResponseHelper.Fail<string>("Invalid or expired OTP code.", 400));

                _memoryCache.Remove(cacheKey);

                // Mark email as pre-verified (valid for 30 minutes)
                var verifiedEmailKey = $"verified_email_{dto.Email.Trim().ToLower()}";
                _memoryCache.Set(verifiedEmailKey, true, TimeSpan.FromMinutes(30));

                return Ok(ResponseHelper.Success<string>(null, "Email verified successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Verification failed: {ex.Message}", 500));
            }
        }

        [HttpPost("verify-email-otp")]
        public async Task<IActionResult> VerifyEmailOtp([FromBody] VerifyEmailOtpDto dto)
        {
            try
            {
                if (string.IsNullOrEmpty(dto.OtpCode))
                    return BadRequest(ResponseHelper.Fail<string>("OTP code is required.", 400));

                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));

                // Find valid OTP record
                var otp = await _context.UserOtps
                    .FirstOrDefaultAsync(x => x.UserId == dto.UserId 
                        && x.OtpCode == dto.OtpCode 
                        && !x.IsUsed 
                        && x.ExpiryTime > DateTime.UtcNow);

                if (otp == null)
                    return BadRequest(ResponseHelper.Fail<string>("Invalid or expired OTP code.", 400));

                // Mark OTP as used and update user
                otp.IsUsed = true;
                user.IsEmailVerified = true;
                user.UpdatedOn = DateTime.UtcNow;

                _context.UserOtps.Update(otp);
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                // Generate JWT token now that email is verified
                var token = GenerateJwtToken(user.UserId, user.Email);

                return Ok(ResponseHelper.Success(new
                {
                    UserId = user.UserId,
                    Email = user.Email,
                    Token = token
                }, "Email verified successfully! You can now access HoundHeart.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Verification failed: {ex.Message}", 500));
            }
        }

        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] ResendVerificationDto dto)
        {
            try
            {
                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));

                if (user.IsEmailVerified)
                    return BadRequest(ResponseHelper.Fail<string>("Email is already verified.", 400));

                // Delete old OTP records and create new one
                var oldOtps = _context.UserOtps.Where(x => x.UserId == dto.UserId);
                _context.UserOtps.RemoveRange(oldOtps);
                await _context.SaveChangesAsync();

                var otp = new Random().Next(1000, 9999).ToString();
                var newOtp = new UserOtp
                {
                    Id = Guid.NewGuid(),
                    UserId = user.UserId,
                    Email = user.Email,
                    OtpCode = otp,
                    ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                    IsUsed = false,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserOtps.Add(newOtp);
                await _context.SaveChangesAsync();

                // Send verification email
                string verificationBody = $@"
        <html>
        <body style='font-family: Arial, sans-serif;'>
          <h2>Verify Your HoundHeart Email</h2>
          <p>Here's your verification code:</p>
          <p><strong>Your verification code is:</strong></p>
          <h3 style='color: #7c3aed; font-size: 32px; letter-spacing: 4px;'>{otp}</h3>
          <p>This code will expire in 10 minutes.</p>
          <p>Best regards,<br/>The Hound Heart Team</p>
        </body>
        </html>";

                try
                {
                    await _emailService.SendEmailAsync(user.Email, "Verify Your HoundHeart Email", verificationBody);
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"Email send failed: {emailEx.Message}");
                }

                return Ok(ResponseHelper.Success<string>(null, "Verification email sent. Check your inbox.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Failed to resend verification email: {ex.Message}", 500));
            }
        }

        #endregion

        [HttpPost("add-userprofile")]
        public async Task<IActionResult> AddUserProfile([FromBody] AddUserProfileDto dto)
        {
            try
            {
                if (dto.UserId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<string>("UserId is required.", 400));

                var user = await _context.Users.FindAsync(dto.UserId);
                if (user == null)
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));

                // Update name
                if (!string.IsNullOrEmpty(dto.ProfileName))
                    user.ProfileName = dto.ProfileName;

                if (dto.Age.HasValue)
                    user.Age = dto.Age.Value;

                // Save blob URL
                if (!string.IsNullOrEmpty(dto.ProfilePhotoUrl))
                {
                    var blobUrl = await _blobService.UploadBase64ImageAsync(dto.ProfilePhotoUrl, $"{dto.UserId}.jpg");
                    user.ProfilePhoto = blobUrl;
                }

                user.UpdatedOn = DateTime.UtcNow;

                var humanProfile = await _context.HumanProfiles.FirstOrDefaultAsync(h => h.UserId == dto.UserId);
                if (humanProfile != null)
                {
                    humanProfile.Name = user.ProfileName ?? user.FullName ?? humanProfile.Name;
                    humanProfile.Age = user.Age ?? humanProfile.Age;
                    humanProfile.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.HumanProfiles.Add(new Hounded_Heart.Models.Data.HumanProfile
                    {
                        Id = Guid.NewGuid(),
                        UserId = dto.UserId,
                        Name = user.ProfileName ?? user.FullName,
                        Age = user.Age,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    UserId = user.UserId,
                    ProfileName = user.FullName,
                    ProfilePhoto = user.ProfilePhoto
                }, "Profile completed successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Profile update failed: {ex.Message}", 500));
            }
        }

        [HttpPost("add-dogprofile")]
        public async Task<IActionResult> AddDog([FromBody] AddDogProfileDto dto)
        {
            try
            {
                if (dto.UserId == Guid.Empty)
                    return BadRequest(ResponseHelper.Fail<string>("UserId is required.", 400));

                if (string.IsNullOrWhiteSpace(dto.DogName))
                    return BadRequest(ResponseHelper.Fail<string>("Dog name is required.", 400));

                var userExists = await _context.Users.AnyAsync(u => u.UserId == dto.UserId);
                if (!userExists)
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));

                var existingDog = await _context.Dogs.FirstOrDefaultAsync(d => d.UserId == dto.UserId);

                var providedImage = dto.DogPhotoUrl?.Trim();

                string? blobUrl = null;
                if (!string.IsNullOrWhiteSpace(providedImage))
                {
                    blobUrl = await _blobService.UploadBase64ImageAsync(providedImage, $"Dog_{dto.UserId}.jpg");
                }

                var resolvedBreed = string.IsNullOrWhiteSpace(dto.Breed) ? null : dto.Breed.Trim();

                if (existingDog != null)
                {
                    existingDog.DogName = dto.DogName;
                    if (!string.IsNullOrWhiteSpace(resolvedBreed)) existingDog.Breed = resolvedBreed;
                    if (dto.Age.HasValue) existingDog.Age = dto.Age;
                    if (dto.Weight.HasValue) existingDog.Weight = dto.Weight;
                    if (blobUrl != null)
                    {
                        existingDog.ProfilePhoto = blobUrl;
                    }

                    existingDog.UpdatedOn = DateTime.UtcNow;
                    _context.Dogs.Update(existingDog);
                }
                else
                {
                    existingDog = new Dog
                    {
                        DogId = Guid.NewGuid(),
                        UserId = dto.UserId,
                        DogName = dto.DogName,
                        Breed = resolvedBreed,
                        Age = dto.Age,
                        Weight = dto.Weight,
                        ProfilePhoto = blobUrl,
                        CreatedOn = DateTime.UtcNow,
                        UpdatedOn = DateTime.UtcNow
                    };
                    _context.Dogs.Add(existingDog);
                }

                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success(new
                {
                    existingDog.DogId,
                    existingDog.DogName,
                    existingDog.ProfilePhoto,
                    existingDog.Breed
                }, "Dog profile saved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Failed to save dog profile: {ex.Message}", 500));
            }
        }

        private static string? ExtractMimeTypeFromDataUri(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            var match = Regex.Match(value, "^data:(.*?);base64,", RegexOptions.IgnoreCase);
            return match.Success ? match.Groups[1].Value : null;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                {
                    return BadRequest(ResponseHelper.Fail<string>("Email and Password are required", 400));
                }
                var user = _context.Users
                    .Where(x => x.Email.ToLower() == dto.Email.ToLower() && !x.IsDeleted && x.IsActive)
                    .FirstOrDefault();
                if (user == null)
                {
                    return NotFound(ResponseHelper.Fail<string>($"Invalid email or user not found: {dto.Email}", 404));
                }
                if (user.IsGoogleSignIn)
                {
                    return NotFound(ResponseHelper.Fail<object>(
                        "This account is registered via Google Sign-In. Please use Google to log in."
                    ));
                }

                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

                if (!isPasswordValid)
                {
                    return Unauthorized(ResponseHelper.Fail<string>("Invalid password", 401));
                }

                if (user.Status == "Suspended")
                {
                    return StatusCode(403, ResponseHelper.Fail<object>("Your account is suspended. Please contact support."));
                }
                if (user.Status == "Banned")
                {
                    return StatusCode(403, ResponseHelper.Fail<object>("Your account is banned."));
                }

                // Check email verification status
                if (!user.IsEmailVerified)
                {
                    // Allow login but include warning in response
                    var token = GenerateJwtToken(user.UserId, user.Email);
                    var response = new
                    {
                        Token = token,
                        UserId = user.UserId,
                        Email = user.Email,
                        RoleId = user.RoleId,
                        IsEmailVerified = false,
                        Message = "Please verify your email. Check your inbox for the verification code."
                    };
                    return Ok(ResponseHelper.Success(response, "Login Successful - Email verification pending", 200));
                }

                var token2 = GenerateJwtToken(user.UserId, user.Email);
                var response2 = new
                {
                    Token = token2,
                    UserId = user.UserId,
                    Email = user.Email,
                    RoleId = user.RoleId,
                    IsEmailVerified = true
                };
                return Ok(ResponseHelper.Success(response2, "Login Successful", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Login failed: {ex.Message}", 500));
            }
        }

        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetUserProfile(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.Dog)
                .FirstOrDefaultAsync(u => u.UserId == userId && !u.IsDeleted);
            if (user == null)
                return NotFound(new { Message = "User not found." });
            var userTraits = await _context.UserSelectedTraits
        .Where(t => t.UserId == userId)
        .Include(t => t.Trait)
        .Select(t => new UserTraitDto
        {
            TraitId = t.TraitId,
            TraitName = t.Trait.TraitName
        })
        .ToListAsync();
            var now = DateTime.UtcNow;
            var journalEntryCount = await _context.JournalEntries
                .Where(x => x.UserId == userId
                    && x.CreatedOn.Year == now.Year
                    && x.CreatedOn.Month == now.Month
                    && !x.IsDeleted)
                .CountAsync();
            //var journalEntryCount = await _context.JournalEntry.Where(x => x.UserId == userId).CountAsync();
            List<DogTraitDto> dogTraits = new List<DogTraitDto>();
            if (user.Dog != null)
            {
                dogTraits = await _context.DogSelectedTraits
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Trait)
                    .Select(t => new DogTraitDto
                    {
                        TraitId = t.TraitId,
                        TraitName = t.Trait.TraitName
                    })
                    .ToListAsync();
            }

            var humanProfile = await _context.HumanProfiles.FirstOrDefaultAsync(h => h.UserId == userId);

            var profile = new UserProfileDto
            {
                UserId = user.UserId,
                FullName = user.FullName,
                Email = user.Email,
                ProfilePhoto = user.ProfilePhoto,
                ProfileName = user.ProfileName,
                PhoneNumber = humanProfile?.PhoneNumber,
                IsProfileSetupCompleted = user.IsProfileSetupCompleted,
                JournalEntryCount= journalEntryCount,
                IsGoogleSignIn =user.IsGoogleSignIn,
                Dog = user.Dog == null ? null : new DogDto
                {
                    DogId = user.Dog.DogId,
                    DogName = user.Dog.DogName,
                    ProfilePhoto = user.Dog.ProfilePhoto
                },
                UserSelectedTraits = userTraits,
                DogSelectedTraits = dogTraits
            };

            return Ok(profile);
        }


        [HttpPost("Google-LoginSignup")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            try
            {
                var result = await _authService.GoogleLoginAsync(dto);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception)
            {
                return StatusCode(500, ResponseHelper.Fail<string>("Unexpected error occurred.", 500));
            }
        }

        /// <summary>
        /// ONE-TIME ADMIN SETUP ENDPOINT - Call this once to create admin@houndheart.com account
        /// After successful creation, this endpoint will reject further calls
        /// </summary>
        [HttpPost("setup-admin")]
        public async Task<IActionResult> SetupAdmin()
        {
            try
            {
                // Check if admin already exists
                var adminExists = await _context.Users
                    .AnyAsync(u => u.Email.ToLower() == "admin@houndheart.com");

                if (adminExists)
                {
                    return StatusCode(403, ResponseHelper.Fail<string>(
                        "Admin user already exists. This endpoint can only be called once.", 403));
                }

                // Create admin user with RoleId = 2 (Admin role)
                var adminUser = new User
                {
                    UserId = Guid.NewGuid(),
                    Email = "admin@houndheart.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    FullName = "System Administrator",
                    RoleId = 2, // Admin role
                    IsActive = true,
                    IsDeleted = false,
                    IsTermAccepted = true,
                    Status = "Active",
                    IsPremium = false,
                    IsGoogleSignIn = false,
                    IsProfileSetupCompleted = true,
                    CreatedOn = DateTime.UtcNow,
                    UpdatedOn = DateTime.UtcNow
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();

                // Create HumanProfile for admin
                _context.HumanProfiles.Add(new Hounded_Heart.Models.Data.HumanProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = adminUser.UserId,
                    Name = "System Administrator",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                var token = GenerateJwtToken(adminUser.UserId, adminUser.Email);

                return Ok(ResponseHelper.Success(new
                {
                    UserId = adminUser.UserId,
                    Email = adminUser.Email,
                    Token = token,
                    Message = "Admin account created successfully. Email: admin@houndheart.com, Password: Admin@123"
                }, "Admin setup completed successfully", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Admin setup failed: {ex.Message}", 500));
            }
        }

        [HttpPost("Apple-LoginSignup")]
        public async Task<IActionResult> AppleLogin([FromBody] AppleLoginRequestDto dto)
        {
            try
            {
                var result = await _authService.AppleLoginAsync(dto.AppleToken);
                return StatusCode(result.StatusCode, result);
            }
            catch (Exception)
            {
                return StatusCode(500, ResponseHelper.Fail<string>("Unexpected error occurred.", 500));
            }
        }

        public class AppleLoginRequestDto
        {
            public string AppleToken { get; set; }
        }

        [HttpPost("MailSendchangespassword")]
        public async Task<IActionResult> MailSendchangespassword( EmailSendModel emailSendModel)
        {
            var result = await _changePassword.SendMailchangepassword(emailSendModel);

            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("VerifyOtp")]
        public async Task<IActionResult> VerifyOtp(VerifyOtpModel model)
        {
            var otpRecord = await _context.UserOtps
                .Where(x => x.Email == model.Email)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (otpRecord == null)
                return StatusCode(404, ResponseHelper.Fail<string>("OTP not found", 404));

            if (otpRecord.IsUsed)
                return StatusCode(400, ResponseHelper.Fail<string>("OTP already used", 400));

            if (otpRecord.ExpiryTime < DateTime.UtcNow)
                return StatusCode(400, ResponseHelper.Fail<string>("OTP expired", 400));

            if (otpRecord.OtpCode != model.OtpCode)
                return StatusCode(400, ResponseHelper.Fail<string>("Invalid OTP", 400));

            otpRecord.IsUsed = true;
            await _context.SaveChangesAsync();

            return StatusCode(200, ResponseHelper.Success<string>(null, "OTP verified successfully", 200));
        }
        [HttpPost("update-password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordModel dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(ResponseHelper.Fail<string>("Invalid request.", 400));
                }

                if (string.IsNullOrWhiteSpace(dto.Email))
                {
                    return BadRequest(ResponseHelper.Fail<string>("Email is required.", 400));
                }

                if (string.IsNullOrWhiteSpace(dto.NewPassword) ||
                    string.IsNullOrWhiteSpace(dto.ConfirmPassword))
                {
                    return BadRequest(ResponseHelper.Fail<string>("New password and confirm password are required.", 400));
                }

                if (dto.NewPassword != dto.ConfirmPassword)
                {
                    return BadRequest(ResponseHelper.Fail<string>("Passwords do not match.", 400));
                }

                var user = await _context.Users
                    .Where(x => x.Email.ToLower() == dto.Email.ToLower() && !x.IsDeleted)
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));
                }

                // Update password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                user.UpdatedOn = DateTime.UtcNow;

                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                return Ok(ResponseHelper.Success<string>(null, "Password updated successfully", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Password update failed: {ex.Message}", 500));
            }
        }
        [HttpPost("changepassword")]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequestModel request)
        {

            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.NewPassword))
                {
                    return BadRequest(ResponseHelper.Fail<string>("Invalid password change request.", 400));
                }

                // Fetch user by Email or UserId
                var userdetails = await _context.Users
                    .Where(x => x.UserId == request.UserId || x.Email.ToLower() == request.Email.ToLower())
                    .FirstOrDefaultAsync();

                if (userdetails == null)
                {
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));
                }
                // Validate Current Password if provided
                if (!string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, userdetails.PasswordHash);

                    if (!isPasswordValid)
                    {
                        return StatusCode(400, ResponseHelper.Fail<string>("Current password is incorrect.", 400));
                    }
                }

                // Hash new password before saving
                userdetails.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                userdetails.UpdatedOn = DateTime.UtcNow;

                _context.Users.Update(userdetails);
                await _context.SaveChangesAsync();


                return StatusCode(200, ResponseHelper.Success<string>(null, "Password changed successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Password change failed: {ex.Message}", 500));
            }
        }

        [HttpPost("setup-profile")]
        public async Task<IActionResult> SetupProfile([FromBody] UserAndDogProfileDto dto)
        {
            if (dto == null || dto.UserId == Guid.Empty)
                return BadRequest(ResponseHelper.Fail<string>("UserId is required.", 400));

            try
            {
                var user = await _context.Users
                    .Include(u => u.Dog)
                    .FirstOrDefaultAsync(u => u.UserId == dto.UserId && !u.IsDeleted);

                if (user == null)
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));

                // === Update only provided user fields ===
                if (!string.IsNullOrWhiteSpace(dto.ProfileName))
                    user.ProfileName = dto.ProfileName.Trim();

                if (!string.IsNullOrWhiteSpace(dto.Email))
                    user.Email = dto.Email.Trim();

                if (!string.IsNullOrEmpty(dto.Base64Image))
                {
                    var fileName = $"user_{user.UserId}_{DateTime.UtcNow:yyyyMMddHHmmss}.png";
                    var blobUrl = await _blobService.UploadBase64ImageAsync(dto.Base64Image, fileName);
                    user.ProfilePhoto = blobUrl;
                }
                user.UpdatedOn = DateTime.UtcNow;
                if (dto.Age.HasValue)
                    user.Age = dto.Age.Value;

                // Save/sync HumanProfiles row (upsert)
                {
                    var humanProfile = await _context.HumanProfiles.FirstOrDefaultAsync(h => h.UserId == dto.UserId);
                    if (humanProfile != null)
                    {
                        humanProfile.Name = user.ProfileName ?? user.FullName ?? humanProfile.Name;
                        humanProfile.Age = user.Age ?? humanProfile.Age;
                        if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
                            humanProfile.PhoneNumber = dto.PhoneNumber.Trim();
                        humanProfile.UpdatedAt = DateTime.UtcNow;
                    }
                    else
                    {
                        _context.HumanProfiles.Add(new Hounded_Heart.Models.Data.HumanProfile
                        {
                            Id = Guid.NewGuid(),
                            UserId = dto.UserId,
                            Name = user.ProfileName ?? user.FullName,
                            Age = user.Age,
                            PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim(),
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                }

                // === Handle Dog info only if provided ===
                if (!string.IsNullOrWhiteSpace(dto.DogName) || !string.IsNullOrEmpty(dto.DogBase64Image) || dto.DogAge.HasValue || !string.IsNullOrEmpty(dto.Breed))
                {
                    var dog = user.Dog;

                    if (dog == null)
                    {
                        dog = new Dog
                        {
                            DogId = Guid.NewGuid(),
                            UserId = user.UserId,
                            DogName = dto.DogName ?? "My Dog",
                            Breed = dto.Breed,
                            Age = dto.DogAge,
                            Weight = dto.Weight,
                            CreatedOn = DateTime.UtcNow,
                            IsActive = true,
                            IsDeleted = false
                        };
                        _context.Dogs.Add(dog);
                    }
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(dto.DogName))
                            dog.DogName = dto.DogName.Trim();
                        
                        if (!string.IsNullOrEmpty(dto.Breed))
                            dog.Breed = dto.Breed;
                        
                        if (dto.DogAge.HasValue)
                            dog.Age = dto.DogAge;
                        
                        if (dto.Weight.HasValue)
                            dog.Weight = dto.Weight;

                        dog.UpdatedOn = DateTime.UtcNow;
                    }

                    if (!string.IsNullOrEmpty(dto.DogBase64Image))
                    {
                        var dogFileName = $"dog_{user.UserId}_{DateTime.UtcNow:yyyyMMddHHmmss}.png";
                        var dogBlobUrl = await _blobService.UploadBase64ImageAsync(dto.DogBase64Image, dogFileName);
                        dog.ProfilePhoto = dogBlobUrl;
                    }
                }
                await _context.SaveChangesAsync();
                var response = new
                {
                    UserId = user.UserId,
                    ProfileName = user.ProfileName,
                    Email = user.Email,
                    ProfilePhoto = user.ProfilePhoto,
                    Dog = user.Dog == null ? null : new
                    {
                        DogId = user.Dog.DogId,
                        DogName = user.Dog.DogName,
                        DogProfilePhoto = user.Dog.ProfilePhoto
                    }
                };

                return Ok(ResponseHelper.Success(response, "Profile updated successfully", 200));
            }
            catch (FormatException ex)
            {
                return BadRequest(ResponseHelper.Fail<string>($"Invalid image format: {ex.Message}", 400));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Profile update failed: {ex.Message}", 500));
            }
        }


        [HttpGet("user-details/{userId}")]
        public async Task<IActionResult> GetUserDetails(Guid userId)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserId == userId && !u.IsDeleted && u.IsActive)
                    .Select(u => new
                    {
                        u.UserId,
                        u.FullName,
                        u.Email,
                        u.ProfileName,
                        u.ProfilePhoto,
                        u.RoleId,
                        u.IsProfileSetupCompleted,
                        u.IsGoogleSignIn,
                        u.CreatedOn,
                        u.UpdatedOn
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(ResponseHelper.Fail<string>("User not found.", 404));
                }

                return Ok(ResponseHelper.Success(user, "User details retrieved successfully.", 200));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ResponseHelper.Fail<string>($"Failed to retrieve user details: {ex.Message}", 500));
            }
        }

        [HttpPost("refresh")]
        public IActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Token))
                return BadRequest(ResponseHelper.Fail<string>("Token is required.", 400));

            try
            {
                var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
                var tokenHandler = new JwtSecurityTokenHandler();

                // Validate token but allow expired — we just want the claims
                var validationParams = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"],
                    ValidateLifetime = false  // allow expired tokens
                };

                var principal = tokenHandler.ValidateToken(request.Token, validationParams, out _);

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var emailClaim = principal.FindFirst(ClaimTypes.Email)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                    return Unauthorized(ResponseHelper.Fail<string>("Invalid token claims.", 401));

                var newToken = GenerateJwtToken(userId, emailClaim ?? string.Empty);
                return Ok(ResponseHelper.Success(new { token = newToken }, "Token refreshed successfully.", 200));
            }
            catch (Exception)
            {
                return Unauthorized(ResponseHelper.Fail<string>("Invalid or tampered token.", 401));
            }
        }

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

            var token2 = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token2);
        }

    }

    public class RefreshTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}
