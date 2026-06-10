using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Hounded_Heart.Models.PostgresMigrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BondingActivities",
                columns: table => new
                {
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityName = table.Column<string>(type: "text", nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<string>(type: "text", nullable: false),
                    InteractionType = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BondingActivities", x => x.ActivityId);
                });

            migrationBuilder.CreateTable(
                name: "BreathingPatterns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    InhaleDuration = table.Column<int>(type: "integer", nullable: false),
                    ExhaleDuration = table.Column<int>(type: "integer", nullable: false),
                    HoldDuration = table.Column<int>(type: "integer", nullable: false),
                    HoldAfterExhaleDuration = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BreathingPatterns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChakraLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PetId = table.Column<Guid>(type: "uuid", nullable: true),
                    RootScore = table.Column<int>(type: "integer", nullable: false),
                    SacralScore = table.Column<int>(type: "integer", nullable: false),
                    SolarPlexusScore = table.Column<int>(type: "integer", nullable: false),
                    HeartScore = table.Column<int>(type: "integer", nullable: false),
                    ThroatScore = table.Column<int>(type: "integer", nullable: false),
                    ThirdEyeScore = table.Column<int>(type: "integer", nullable: false),
                    CrownScore = table.Column<int>(type: "integer", nullable: false),
                    HarmonyScore = table.Column<float>(type: "real", nullable: true),
                    DominantBlockage = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LogDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChakraLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChakraRitualProgresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChakraId = table.Column<Guid>(type: "uuid", nullable: false),
                    LastPlayedPosition = table.Column<decimal>(type: "numeric", nullable: true),
                    TotalDuration = table.Column<decimal>(type: "numeric", nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: true),
                    LastPlayedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsPaused = table.Column<bool>(type: "boolean", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChakraRitualProgresses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Chakras",
                columns: table => new
                {
                    ChakraId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChakraName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AudioUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chakras", x => x.ChakraId);
                });

            migrationBuilder.CreateTable(
                name: "CheckIns",
                columns: table => new
                {
                    CheckInId = table.Column<Guid>(type: "uuid", nullable: false),
                    Questions = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: true),
                    LowEnergyLabel = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    HighEnergyLabel = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CheckIns", x => x.CheckInId);
                });

            migrationBuilder.CreateTable(
                name: "CommunityDiscussions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    AuthorName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    RepliesCount = table.Column<int>(type: "integer", nullable: false),
                    IsPinned = table.Column<bool>(type: "boolean", nullable: false),
                    LastActive = table.Column<string>(type: "text", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityDiscussions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeviceConnections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeviceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DeviceModel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeviceNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsConnected = table.Column<bool>(type: "boolean", nullable: false),
                    ConnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DisconnectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeviceConnections", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DogBaselines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: false),
                    AvgHeartRate = table.Column<double>(type: "double precision", nullable: true),
                    AvgActivityScore = table.Column<double>(type: "double precision", nullable: false),
                    AvgTemperature = table.Column<double>(type: "double precision", nullable: true),
                    AvgRestScore = table.Column<double>(type: "double precision", nullable: false),
                    AvgRespirationRate = table.Column<double>(type: "double precision", nullable: true),
                    LastUpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DaysOfDataCollected = table.Column<int>(type: "integer", nullable: false),
                    DogBaselineEstablished = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogBaselines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DogProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Breed = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    Weight = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BaselineStartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DogBaselineEstablished = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DogSpiritualTraits",
                columns: table => new
                {
                    TraitId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraitName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogSpiritualTraits", x => x.TraitId);
                });

            migrationBuilder.CreateTable(
                name: "DogVitals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: false),
                    HeartRate = table.Column<int>(type: "integer", nullable: true),
                    ActivityScore = table.Column<int>(type: "integer", nullable: false),
                    Temperature = table.Column<double>(type: "double precision", nullable: true),
                    RestScore = table.Column<int>(type: "integer", nullable: false),
                    RespirationRate = table.Column<double>(type: "double precision", nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    State = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActivityValue = table.Column<int>(type: "integer", nullable: true),
                    MinPlay = table.Column<int>(type: "integer", nullable: true),
                    MinActive = table.Column<int>(type: "integer", nullable: true),
                    MinRest = table.Column<int>(type: "integer", nullable: true),
                    NapTime = table.Column<int>(type: "integer", nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogVitals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExpertQueryCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertQueryCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FAQs",
                columns: table => new
                {
                    FAQId = table.Column<Guid>(type: "uuid", nullable: false),
                    Question = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Answer = table.Column<string>(type: "text", nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FAQs", x => x.FAQId);
                });

            migrationBuilder.CreateTable(
                name: "FitBarkActivityLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DogSlug = table.Column<string>(type: "text", nullable: false),
                    ActivityDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActivityValue = table.Column<int>(type: "integer", nullable: false),
                    MinPlay = table.Column<int>(type: "integer", nullable: false),
                    MinActive = table.Column<int>(type: "integer", nullable: false),
                    MinRest = table.Column<int>(type: "integer", nullable: false),
                    NapTime = table.Column<int>(type: "integer", nullable: false),
                    FetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FitBarkActivityLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FitBarkDogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DogSlug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Breed = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BirthDate = table.Column<string>(type: "text", nullable: true),
                    Weight = table.Column<double>(type: "double precision", nullable: true),
                    Gender = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ActivityGoal = table.Column<int>(type: "integer", nullable: true),
                    Country = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Zip = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FitBarkDogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GuidedPractices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    AudioUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuidedPractices", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HealingCircles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Time = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ParticipantsCount = table.Column<int>(type: "integer", nullable: false),
                    MaxParticipants = table.Column<int>(type: "integer", nullable: false),
                    IsPremium = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealingCircles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HumanProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BaselineStartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    HumanBaselineEstablished = table.Column<bool>(type: "boolean", nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HumanProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HumanVitals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    HeartRate = table.Column<int>(type: "integer", nullable: true),
                    HRV = table.Column<double>(type: "double precision", nullable: true),
                    Steps = table.Column<int>(type: "integer", nullable: true),
                    Calories = table.Column<double>(type: "double precision", nullable: false),
                    Distance = table.Column<double>(type: "double precision", nullable: true),
                    ActiveMinutes = table.Column<int>(type: "integer", nullable: true),
                    SleepMinutes = table.Column<int>(type: "integer", nullable: true),
                    DeepSleepMinutes = table.Column<int>(type: "integer", nullable: true),
                    RemSleepMinutes = table.Column<int>(type: "integer", nullable: true),
                    LightSleepMinutes = table.Column<int>(type: "integer", nullable: true),
                    AwakeSleepMinutes = table.Column<int>(type: "integer", nullable: true),
                    StressScore = table.Column<int>(type: "integer", nullable: true),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Source = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AmbientTemperature = table.Column<double>(type: "double precision", nullable: true),
                    WeatherCondition = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    WeatherLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HumanVitals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JournalEntries",
                columns: table => new
                {
                    EntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntryType = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsArchive = table.Column<bool>(type: "boolean", nullable: true),
                    LettrTo = table.Column<string>(type: "text", nullable: true),
                    MediaType = table.Column<string>(type: "text", nullable: true),
                    MediaUrl = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JournalEntries", x => x.EntryId);
                });

            migrationBuilder.CreateTable(
                name: "MessageLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MessageType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Channel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RecipientContact = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Body = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RelatedAlertId = table.Column<Guid>(type: "uuid", nullable: true),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    IsDelivered = table.Column<bool>(type: "boolean", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Rituals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Duration = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IconType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rituals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SacredGuidePurchase",
                columns: table => new
                {
                    PurchaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    SacredGuideId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    PurchasedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaymentStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SacredGuidePurchase", x => x.PurchaseId);
                });

            migrationBuilder.CreateTable(
                name: "SacredGuides",
                columns: table => new
                {
                    SacredGuideId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PdfUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TotalPages = table.Column<int>(type: "integer", nullable: true),
                    Chapters = table.Column<string>(type: "text", nullable: true),
                    Distribution = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PreviewPercentage = table.Column<int>(type: "integer", nullable: false),
                    AllowFreeUserDownload = table.Column<bool>(type: "boolean", nullable: false),
                    RequiresPremium = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SacredGuides", x => x.SacredGuideId);
                });

            migrationBuilder.CreateTable(
                name: "Scores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ScoringRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RuleName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Points = table.Column<decimal>(type: "numeric", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScoringRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteSettings",
                columns: table => new
                {
                    SettingKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SettingValue = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteSettings", x => x.SettingKey);
                });

            migrationBuilder.CreateTable(
                name: "StressEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HRVAtEvent = table.Column<double>(type: "double precision", nullable: false),
                    HRAtEvent = table.Column<int>(type: "integer", nullable: false),
                    BaselineHRV = table.Column<double>(type: "double precision", nullable: false),
                    BaselineHR = table.Column<double>(type: "double precision", nullable: false),
                    DeviationScore = table.Column<double>(type: "double precision", nullable: false),
                    DogStateAtEvent = table.Column<string>(type: "text", nullable: true),
                    AlertFired = table.Column<bool>(type: "boolean", nullable: false),
                    OutcomeLogged = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StressEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    BillingPeriod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    StripePriceId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    Features = table.Column<string>(type: "text", nullable: true),
                    Badge = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SavingsText = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.PlanId);
                });

            migrationBuilder.CreateTable(
                name: "SyncScoreRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Trend = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HRVStabilityScore = table.Column<int>(type: "integer", nullable: false),
                    SharedActivityScore = table.Column<int>(type: "integer", nullable: false),
                    DogCalmScore = table.Column<int>(type: "integer", nullable: false),
                    SleepQualityScore = table.Column<int>(type: "integer", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncScoreRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    TagId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TagName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.TagId);
                });

            migrationBuilder.CreateTable(
                name: "TargetCycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Cycles = table.Column<int>(type: "integer", nullable: false),
                    DurationDescription = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TargetCycles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrendingTopics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Count = table.Column<string>(type: "text", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrendingTopics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserActivitiesScores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: true),
                    ActivityDetails = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActivityDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserActivitiesScores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserBaselines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AvgHeartRate = table.Column<double>(type: "double precision", nullable: true),
                    AvgHRV = table.Column<double>(type: "double precision", nullable: true),
                    HRVStdDev = table.Column<double>(type: "double precision", nullable: true),
                    AvgSleepScore = table.Column<double>(type: "double precision", nullable: true),
                    AvgSteps = table.Column<double>(type: "double precision", nullable: true),
                    AvgAmbientTemperature = table.Column<double>(type: "double precision", nullable: true),
                    AvgDeepSleepMinutes = table.Column<double>(type: "double precision", nullable: true),
                    AvgRemSleepMinutes = table.Column<double>(type: "double precision", nullable: true),
                    AvgLightSleepMinutes = table.Column<double>(type: "double precision", nullable: true),
                    AvgAwakeSleepMinutes = table.Column<double>(type: "double precision", nullable: true),
                    AvgStressScore = table.Column<double>(type: "double precision", nullable: true),
                    AvgCalories = table.Column<double>(type: "double precision", nullable: true),
                    AvgDistance = table.Column<double>(type: "double precision", nullable: true),
                    LastUpdatedUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BaselineCreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BaselineUpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DaysOfDataCollected = table.Column<int>(type: "integer", nullable: true),
                    HumanBaselineEstablished = table.Column<bool>(type: "boolean", nullable: true),
                    IsComplete = table.Column<bool>(type: "boolean", nullable: true),
                    IsTestMode = table.Column<bool>(type: "boolean", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBaselines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserBreathingPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatternId = table.Column<Guid>(type: "uuid", nullable: true),
                    PatternName = table.Column<string>(type: "text", nullable: false),
                    TargetCycles = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBreathingPreferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserChakraRatings",
                columns: table => new
                {
                    UserChakraRatingId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChakraId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserChakraRatings", x => x.UserChakraRatingId);
                });

            migrationBuilder.CreateTable(
                name: "UserOtps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    OtpCode = table.Column<string>(type: "text", nullable: false),
                    ExpiryTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserOtps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserSpiritualTraits",
                columns: table => new
                {
                    TraitId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraitName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSpiritualTraits", x => x.TraitId);
                });

            migrationBuilder.CreateTable(
                name: "WellnessAlerts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlertType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Suggestion = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DogStateAtAlert = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HRVAtAlert = table.Column<double>(type: "double precision", nullable: false),
                    HRAtAlert = table.Column<int>(type: "integer", nullable: false),
                    IsDogNearby = table.Column<bool>(type: "boolean", nullable: true),
                    DistanceMetres = table.Column<double>(type: "double precision", nullable: true),
                    IsActedOn = table.Column<bool>(type: "boolean", nullable: false),
                    Outcome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    RecoveryMessage = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WellnessAlerts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DogDailySummaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AvgHeartRate = table.Column<double>(type: "double precision", nullable: false),
                    AvgTemperature = table.Column<double>(type: "double precision", nullable: false),
                    AvgActivityScore = table.Column<double>(type: "double precision", nullable: false),
                    AvgRestScore = table.Column<double>(type: "double precision", nullable: false),
                    AvgRespirationRate = table.Column<double>(type: "double precision", nullable: false),
                    MinHeartRate = table.Column<double>(type: "double precision", nullable: false),
                    MaxHeartRate = table.Column<double>(type: "double precision", nullable: false),
                    MinTemperature = table.Column<double>(type: "double precision", nullable: false),
                    MaxTemperature = table.Column<double>(type: "double precision", nullable: false),
                    RestPercentage = table.Column<double>(type: "double precision", nullable: false),
                    ActivePercentage = table.Column<double>(type: "double precision", nullable: false),
                    PlayPercentage = table.Column<double>(type: "double precision", nullable: false),
                    SleepPercentage = table.Column<double>(type: "double precision", nullable: false),
                    DataPointsCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogDailySummaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DogDailySummaries_DogProfiles_DogId",
                        column: x => x.DogId,
                        principalTable: "DogProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DogDailySummaries_HumanProfiles_UserId",
                        column: x => x.UserId,
                        principalTable: "HumanProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HumanDailySummaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AvgHeartRate = table.Column<double>(type: "double precision", nullable: true),
                    AvgHRV = table.Column<double>(type: "double precision", nullable: true),
                    TotalSteps = table.Column<int>(type: "integer", nullable: true),
                    AvgCalories = table.Column<double>(type: "double precision", nullable: true),
                    AvgDistance = table.Column<double>(type: "double precision", nullable: true),
                    AvgActiveMinutes = table.Column<double>(type: "double precision", nullable: true),
                    AvgSleepMinutes = table.Column<double>(type: "double precision", nullable: true),
                    AvgStressScore = table.Column<double>(type: "double precision", nullable: true),
                    AvgAmbientTemperature = table.Column<double>(type: "double precision", nullable: true),
                    SyncScore = table.Column<int>(type: "integer", nullable: true),
                    SyncTrend = table.Column<string>(type: "text", nullable: true),
                    DataPointsCount = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HumanDailySummaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HumanDailySummaries_HumanProfiles_UserId",
                        column: x => x.UserId,
                        principalTable: "HumanProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RitualLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RitualId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BonusAwarded = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RitualLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RitualLogs_Rituals_RitualId",
                        column: x => x.RitualId,
                        principalTable: "Rituals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RoleId = table.Column<int>(type: "integer", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsTermAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    IsGoogleSignIn = table.Column<bool>(type: "boolean", nullable: false),
                    IsProfileSetupCompleted = table.Column<bool>(type: "boolean", nullable: true),
                    ProfilePhoto = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ProfileName = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    IsPremium = table.Column<bool>(type: "boolean", nullable: false),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    StripeCustomerId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    FitbitAccessToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FitbitRefreshToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FitbitTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FitbitUserId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    FitBarkAccessToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FitBarkRefreshToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FitBarkTokenExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FitBarkUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CommunityPosts",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LikeCount = table.Column<int>(type: "integer", nullable: false),
                    CommentCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ModerationStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Hashtags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityPosts", x => x.PostId);
                    table.ForeignKey(
                        name: "FK_CommunityPosts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Dogs",
                columns: table => new
                {
                    DogId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DogName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ProfilePhoto = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentScore = table.Column<double>(type: "double precision", nullable: false),
                    Breed = table.Column<string>(type: "text", nullable: true),
                    Age = table.Column<int>(type: "integer", nullable: true),
                    Weight = table.Column<double>(type: "double precision", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dogs", x => x.DogId);
                    table.ForeignKey(
                        name: "FK_Dogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExpertQueries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CompanionName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AdminResponse = table.Column<string>(type: "text", nullable: true),
                    RespondedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertQueries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpertQueries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HealingCircleRegistrations",
                columns: table => new
                {
                    RegistrationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CircleId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RegisteredOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealingCircleRegistrations", x => x.RegistrationId);
                    table.ForeignKey(
                        name: "FK_HealingCircleRegistrations_HealingCircles_CircleId",
                        column: x => x.CircleId,
                        principalTable: "HealingCircles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HealingCircleRegistrations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SacredGuideWaitlist",
                columns: table => new
                {
                    WaitlistId = table.Column<Guid>(type: "uuid", nullable: false),
                    SacredGuideId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JoinedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsNotified = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SacredGuideWaitlist", x => x.WaitlistId);
                    table.ForeignKey(
                        name: "FK_SacredGuideWaitlist_SacredGuides_SacredGuideId",
                        column: x => x.SacredGuideId,
                        principalTable: "SacredGuides",
                        principalColumn: "SacredGuideId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SacredGuideWaitlist_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    SubscriptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    StripeCustomerId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    StripePriceId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    PlanName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CurrentPeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CurrentPeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelAtPeriodEnd = table.Column<bool>(type: "boolean", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    Currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.SubscriptionId);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserBondingActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActivityDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBondingActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserBondingActivities_BondingActivities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "BondingActivities",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserBondingActivities_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserChakraProgresses",
                columns: table => new
                {
                    ChakraProgressId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChakraId = table.Column<Guid>(type: "uuid", nullable: false),
                    PauseTimeInSeconds = table.Column<int>(type: "integer", nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    LastPlayedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserChakraProgresses", x => x.ChakraProgressId);
                    table.ForeignKey(
                        name: "FK_UserChakraProgresses_Chakras_ChakraId",
                        column: x => x.ChakraId,
                        principalTable: "Chakras",
                        principalColumn: "ChakraId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserChakraProgresses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserCheckIns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CheckInId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DailyPointsChange = table.Column<int>(type: "integer", nullable: true),
                    ScoreSnapshot = table.Column<int>(type: "integer", nullable: true),
                    ActivityDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsMissed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCheckIns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCheckIns_CheckIns_CheckInId",
                        column: x => x.CheckInId,
                        principalTable: "CheckIns",
                        principalColumn: "CheckInId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCheckIns_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserCredits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreditType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreditsTotal = table.Column<int>(type: "integer", nullable: false),
                    CreditsUsed = table.Column<int>(type: "integer", nullable: false),
                    BillingCycleStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BillingCycleEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCredits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCredits_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSelectedTraits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraitId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsSelected = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSelectedTraits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSelectedTraits_UserSpiritualTraits_TraitId",
                        column: x => x.TraitId,
                        principalTable: "UserSpiritualTraits",
                        principalColumn: "TraitId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserSelectedTraits_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunityComments",
                columns: table => new
                {
                    CommentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    ParentCommentId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityComments", x => x.CommentId);
                    table.ForeignKey(
                        name: "FK_CommunityComments_CommunityComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "CommunityComments",
                        principalColumn: "CommentId");
                    table.ForeignKey(
                        name: "FK_CommunityComments_CommunityPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "CommunityPosts",
                        principalColumn: "PostId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityComments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunityLikes",
                columns: table => new
                {
                    LikeId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityLikes", x => x.LikeId);
                    table.ForeignKey(
                        name: "FK_CommunityLikes_CommunityPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "CommunityPosts",
                        principalColumn: "PostId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DogSelectedTraits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TraitId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsSelected = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogSelectedTraits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DogSelectedTraits_DogSpiritualTraits_TraitId",
                        column: x => x.TraitId,
                        principalTable: "DogSpiritualTraits",
                        principalColumn: "TraitId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DogSelectedTraits_Dogs_DogId",
                        column: x => x.DogId,
                        principalTable: "Dogs",
                        principalColumn: "DogId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DogSelectedTraits_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionLogs",
                columns: table => new
                {
                    LogId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubscriptionId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EventData = table.Column<string>(type: "text", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionLogs", x => x.LogId);
                    table.ForeignKey(
                        name: "FK_SubscriptionLogs_Subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "Subscriptions",
                        principalColumn: "SubscriptionId");
                    table.ForeignKey(
                        name: "FK_SubscriptionLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "PostReports",
                columns: table => new
                {
                    ReportId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: true),
                    CommentId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReporterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReportedUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReportType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ReportedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostReports", x => x.ReportId);
                    table.ForeignKey(
                        name: "FK_PostReports_CommunityComments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "CommunityComments",
                        principalColumn: "CommentId");
                    table.ForeignKey(
                        name: "FK_PostReports_CommunityPosts_PostId",
                        column: x => x.PostId,
                        principalTable: "CommunityPosts",
                        principalColumn: "PostId");
                    table.ForeignKey(
                        name: "FK_PostReports_Users_ReportedUserId",
                        column: x => x.ReportedUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_PostReports_Users_ReporterUserId",
                        column: x => x.ReporterUserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityComments_ParentCommentId",
                table: "CommunityComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityComments_PostId",
                table: "CommunityComments",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityComments_UserId",
                table: "CommunityComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityLikes_PostId",
                table: "CommunityLikes",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityLikes_UserId",
                table: "CommunityLikes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPosts_UserId",
                table: "CommunityPosts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DogDailySummaries_DogId",
                table: "DogDailySummaries",
                column: "DogId");

            migrationBuilder.CreateIndex(
                name: "IX_DogDailySummaries_UserId",
                table: "DogDailySummaries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Dogs_UserId",
                table: "Dogs",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DogSelectedTraits_DogId",
                table: "DogSelectedTraits",
                column: "DogId");

            migrationBuilder.CreateIndex(
                name: "IX_DogSelectedTraits_TraitId",
                table: "DogSelectedTraits",
                column: "TraitId");

            migrationBuilder.CreateIndex(
                name: "IX_DogSelectedTraits_UserId",
                table: "DogSelectedTraits",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpertQueries_UserId",
                table: "ExpertQueries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HealingCircleRegistrations_CircleId",
                table: "HealingCircleRegistrations",
                column: "CircleId");

            migrationBuilder.CreateIndex(
                name: "IX_HealingCircleRegistrations_UserId",
                table: "HealingCircleRegistrations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_HumanDailySummaries_UserId",
                table: "HumanDailySummaries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PostReports_CommentId",
                table: "PostReports",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_PostReports_PostId",
                table: "PostReports",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_PostReports_ReportedUserId",
                table: "PostReports",
                column: "ReportedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PostReports_ReporterUserId",
                table: "PostReports",
                column: "ReporterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RitualLogs_RitualId",
                table: "RitualLogs",
                column: "RitualId");

            migrationBuilder.CreateIndex(
                name: "IX_SacredGuideWaitlist_SacredGuideId",
                table: "SacredGuideWaitlist",
                column: "SacredGuideId");

            migrationBuilder.CreateIndex(
                name: "IX_SacredGuideWaitlist_UserId",
                table: "SacredGuideWaitlist",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionLogs_SubscriptionId",
                table: "SubscriptionLogs",
                column: "SubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionLogs_UserId",
                table: "SubscriptionLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_UserId",
                table: "Subscriptions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBondingActivities_ActivityId",
                table: "UserBondingActivities",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_UserBondingActivities_UserId",
                table: "UserBondingActivities",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserChakraProgresses_ChakraId",
                table: "UserChakraProgresses",
                column: "ChakraId");

            migrationBuilder.CreateIndex(
                name: "IX_UserChakraProgresses_UserId",
                table: "UserChakraProgresses",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCheckIns_CheckInId",
                table: "UserCheckIns",
                column: "CheckInId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCheckIns_UserId",
                table: "UserCheckIns",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCredits_UserId",
                table: "UserCredits",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSelectedTraits_TraitId",
                table: "UserSelectedTraits",
                column: "TraitId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSelectedTraits_UserId",
                table: "UserSelectedTraits",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BreathingPatterns");

            migrationBuilder.DropTable(
                name: "ChakraLogs");

            migrationBuilder.DropTable(
                name: "ChakraRitualProgresses");

            migrationBuilder.DropTable(
                name: "CommunityDiscussions");

            migrationBuilder.DropTable(
                name: "CommunityLikes");

            migrationBuilder.DropTable(
                name: "DeviceConnections");

            migrationBuilder.DropTable(
                name: "DogBaselines");

            migrationBuilder.DropTable(
                name: "DogDailySummaries");

            migrationBuilder.DropTable(
                name: "DogSelectedTraits");

            migrationBuilder.DropTable(
                name: "DogVitals");

            migrationBuilder.DropTable(
                name: "ExpertQueries");

            migrationBuilder.DropTable(
                name: "ExpertQueryCategories");

            migrationBuilder.DropTable(
                name: "FAQs");

            migrationBuilder.DropTable(
                name: "FitBarkActivityLogs");

            migrationBuilder.DropTable(
                name: "FitBarkDogs");

            migrationBuilder.DropTable(
                name: "GuidedPractices");

            migrationBuilder.DropTable(
                name: "HealingCircleRegistrations");

            migrationBuilder.DropTable(
                name: "HumanDailySummaries");

            migrationBuilder.DropTable(
                name: "HumanVitals");

            migrationBuilder.DropTable(
                name: "JournalEntries");

            migrationBuilder.DropTable(
                name: "MessageLogs");

            migrationBuilder.DropTable(
                name: "NotificationLogs");

            migrationBuilder.DropTable(
                name: "PostReports");

            migrationBuilder.DropTable(
                name: "RitualLogs");

            migrationBuilder.DropTable(
                name: "SacredGuidePurchase");

            migrationBuilder.DropTable(
                name: "SacredGuideWaitlist");

            migrationBuilder.DropTable(
                name: "Scores");

            migrationBuilder.DropTable(
                name: "ScoringRules");

            migrationBuilder.DropTable(
                name: "SiteSettings");

            migrationBuilder.DropTable(
                name: "StressEvents");

            migrationBuilder.DropTable(
                name: "SubscriptionLogs");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans");

            migrationBuilder.DropTable(
                name: "SyncScoreRecords");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "TargetCycles");

            migrationBuilder.DropTable(
                name: "TrendingTopics");

            migrationBuilder.DropTable(
                name: "UserActivitiesScores");

            migrationBuilder.DropTable(
                name: "UserBaselines");

            migrationBuilder.DropTable(
                name: "UserBondingActivities");

            migrationBuilder.DropTable(
                name: "UserBreathingPreferences");

            migrationBuilder.DropTable(
                name: "UserChakraProgresses");

            migrationBuilder.DropTable(
                name: "UserChakraRatings");

            migrationBuilder.DropTable(
                name: "UserCheckIns");

            migrationBuilder.DropTable(
                name: "UserCredits");

            migrationBuilder.DropTable(
                name: "UserOtps");

            migrationBuilder.DropTable(
                name: "UserSelectedTraits");

            migrationBuilder.DropTable(
                name: "WellnessAlerts");

            migrationBuilder.DropTable(
                name: "DogProfiles");

            migrationBuilder.DropTable(
                name: "DogSpiritualTraits");

            migrationBuilder.DropTable(
                name: "Dogs");

            migrationBuilder.DropTable(
                name: "HealingCircles");

            migrationBuilder.DropTable(
                name: "HumanProfiles");

            migrationBuilder.DropTable(
                name: "CommunityComments");

            migrationBuilder.DropTable(
                name: "Rituals");

            migrationBuilder.DropTable(
                name: "SacredGuides");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropTable(
                name: "BondingActivities");

            migrationBuilder.DropTable(
                name: "Chakras");

            migrationBuilder.DropTable(
                name: "CheckIns");

            migrationBuilder.DropTable(
                name: "UserSpiritualTraits");

            migrationBuilder.DropTable(
                name: "CommunityPosts");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
