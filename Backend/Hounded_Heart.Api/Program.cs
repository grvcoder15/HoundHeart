using Hounded_Heart.Models.Data;
using Hounded_Heart.Services.Services;
using Hounded_Heart.Api.Services;
using Hounded_Heart.Api.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Stripe;
using System;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Ensure DateTime is serialized as ISO 8601 UTC
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Add framework services
builder.Services.AddMemoryCache(); // Required for IMemoryCache
builder.Services.AddHttpClient(); // Register default HttpClient factory
builder.Services.AddHttpContextAccessor();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null
        );
        npgsqlOptions.CommandTimeout(30);
    });
    
    // Enable sensitive data logging in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Core services
builder.Services.AddScoped<BlobStorageService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ChakraService>();
builder.Services.AddScoped<ChakraRitualProgressService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<ChangePasswordService>();
builder.Services.AddScoped<StripeService>();

// Phase 1 Wearables & Sandbox
builder.Services.AddSingleton<IMockDataProvider, MockDataProvider>();
builder.Services.AddScoped<IPetPaceService, PetPaceMockService>(); // Required for existing Stress/Bond services; mock hosted inserter remains disabled
builder.Services.AddScoped<IAppleHealthService, AppleHealthMockService>();
builder.Services.AddScoped<IStressService, StressService>();
builder.Services.AddScoped<IBondSyncService, BondSyncService>();
builder.Services.AddScoped<IBaselineService, BaselineService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPhase1ProfileService, Phase1ProfileService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<IVitalsTrackingService, VitalsTrackingService>();
builder.Services.AddScoped<IProximityService, ProximityService>();
builder.Services.AddScoped<IWeatherService, WeatherService>();
builder.Services.AddHttpClient<WeatherService>();
builder.Services.AddScoped<IMessageLogsService, MessageLogsService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IFitBarkService, FitBarkService>();
builder.Services.AddScoped<IExpertQueryService, ExpertQueryService>();

// Fitbit Integration Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFitbitTokenService, FitbitTokenService>();
builder.Services.AddScoped<IFitbitMockService, FitbitMockService>();
builder.Services.AddScoped<IVitalsService, VitalsService>(); 
builder.Services.AddScoped<IFitbitService, FitbitService>();
builder.Services.AddHttpClient<FitbitTokenService>();
builder.Services.AddHttpClient<FitbitService>();
builder.Services.AddHttpClient<FitbitPollingService>();

// Daily Vitals Summary Service
builder.Services.AddScoped<IDailyVitalsSummaryService, DailyVitalsSummaryHelper>();

// Configuration
builder.Services.Configure<BaselineConfiguration>(builder.Configuration.GetSection(BaselineConfiguration.SectionName));

// Background Services
// builder.Services.AddHostedService<MockPetPaceHostedService>(); // DISABLED: PetPace mock disabled in favor of FitBark real data
// builder.Services.AddHostedService<MockHumanVitalsHostedService>();
builder.Services.AddHostedService<FeedbackLoopService>();
builder.Services.AddHostedService<AutoBaselineCalculationService>();
builder.Services.AddHostedService<StressMonitoringService>();
builder.Services.AddHostedService<WeeklyCleanupService>();
builder.Services.AddHostedService<LaunchInviteService>();
builder.Services.AddHostedService<DailyVitalsSummaryService>();
builder.Services.AddHostedService<FitbitPollingService>();
builder.Services.AddHostedService<FitBarkSyncService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
    
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
              "http://localhost:5173",
              "http://localhost:5178",
              "http://127.0.0.1:5173",
              "http://127.0.0.1:5178",
              "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
// ?? JWT Authentication setup
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:Key"] ?? "default_key_here"))
        };
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];
var app = builder.Build();

// Test database connection on startup
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var canConnect = await dbContext.Database.CanConnectAsync();
        if (canConnect)
        {
            Console.WriteLine("✅ Database connection successful!");

            // Backward-compatible schema guard for environments created before tier rollout.
            if (dbContext.Database.IsNpgsql())
            {
                await dbContext.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""Users""
                    ADD COLUMN IF NOT EXISTS ""TierLevel"" character varying(20) NOT NULL DEFAULT 'free';
                ");

                await dbContext.Database.ExecuteSqlRawAsync(@"
                    UPDATE ""Users""
                    SET ""TierLevel"" = 'free'
                    WHERE ""TierLevel"" IS NULL OR btrim(""TierLevel"") = '';
                ");
            }

            // Seed Database
            try 
            {
                await Hounded_Heart.Api.Data.DbInitializer.Initialize(dbContext);
                Console.WriteLine("✅ Database seeded successfully!");
            }
            catch(Exception ex)
            {
                Console.WriteLine($"⚠️ Seeding failed: {ex.Message}");
            }
        }
        else
        {
            Console.WriteLine("⚠️ Warning: Database connection failed. The API will start but database operations will fail.");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"⚠️ Warning: Database connection test failed: {ex.Message}");
    Console.WriteLine("The API will start but database operations may fail.");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowReactApp");
// app.UseHttpsRedirection();

// Ensure wwwroot exists (auto-create if missing after branch switch)
var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootPath)) Directory.CreateDirectory(wwwrootPath);

// Ensure WebRootPath is set (fixes cases where it might be null)
if (string.IsNullOrEmpty(app.Environment.WebRootPath))
{
    app.Environment.WebRootPath = wwwrootPath;
}

app.UseStaticFiles(); // Enable serving static files from wwwroot

// Explicitly serve uploads folder to ensure accessibility
var uploadsPath = Path.Combine(wwwrootPath, "uploads");
if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Add a health check endpoint
app.MapGet("/api/health", async (AppDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return Results.Ok(new
        {
            status = "healthy",
            database = canConnect ? "connected" : "disconnected",
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Ok(new
        {
            status = "unhealthy",
            database = "error",
            error = ex.Message,
            timestamp = DateTime.UtcNow
        });
    }
});

// Apply pending migrations on startup
try
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        // Ensure IsEmailVerified column exists (for email verification feature)
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(
                @"DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'Users' AND column_name = 'IsEmailVerified'
                    ) THEN
                        ALTER TABLE ""Users"" ADD COLUMN ""IsEmailVerified"" BOOLEAN NOT NULL DEFAULT false;
                    END IF;
                END $$;"
            );
            Console.WriteLine("✅ IsEmailVerified column verified");
        }
        catch (Exception colEx)
        {
            Console.WriteLine($"⚠️ Column check error (may be expected): {colEx.Message}");
        }
        
        try
        {
            await dbContext.Database.MigrateAsync();
            Console.WriteLine("✅ Database migrations applied successfully");
        }
        catch (Exception migEx)
        {
            Console.WriteLine($"⚠️ Migration error (schema may be partially out of sync): {migEx.Message}");
            // Continue anyway - the raw SQL column addition already happened
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Critical error in database initialization: {ex.Message}");
    // Don't throw - let the app continue
}

app.Run();
