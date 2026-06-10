using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Hounded_Heart.Models.Migrations
{
    /// <inheritdoc />
    public partial class AddBaselineTrackingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {




            migrationBuilder.DropTable(
                name: "ExpertQuestions");





            migrationBuilder.DropTable(
                name: "RitualLogs");

            migrationBuilder.DropTable(
                name: "Rituals");


            migrationBuilder.DropColumn(
                name: "ActivityId1",
                table: "UserBondingActivities");

            migrationBuilder.AddColumn<int>(
                name: "Age",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "StripeCustomerId",
                table: "Users",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ActivityDate",
                table: "UserCheckIns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DailyPointsChange",
                table: "UserCheckIns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsMissed",
                table: "UserCheckIns",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ScoreSnapshot",
                table: "UserCheckIns",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "ActivityId",
                table: "UserBondingActivities",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<DateTime>(
                name: "ActivityDate",
                table: "UserActivitiesScores",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActivityDetails",
                table: "UserActivitiesScores",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<decimal>(
                name: "Points",
                table: "ScoringRules",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(double),
                oldType: "float");

            migrationBuilder.CreateTable(
                name: "Rituals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Duration = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IconType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rituals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RitualLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RitualId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
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
                    table.ForeignKey(
                        name: "FK_RitualLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });


            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "JournalEntries",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaType",
                table: "JournalEntries",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaUrl",
                table: "JournalEntries",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Age",
                table: "Dogs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Breed",
                table: "Dogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Weight",
                table: "Dogs",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "BondingActivities",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "InteractionType",
                table: "BondingActivities",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "BreathingPatterns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    InhaleDuration = table.Column<int>(type: "int", nullable: false),
                    ExhaleDuration = table.Column<int>(type: "int", nullable: false),
                    HoldDuration = table.Column<int>(type: "int", nullable: false),
                    HoldAfterExhaleDuration = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BreathingPatterns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChakraLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PetId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RootScore = table.Column<int>(type: "int", nullable: false),
                    SacralScore = table.Column<int>(type: "int", nullable: false),
                    SolarPlexusScore = table.Column<int>(type: "int", nullable: false),
                    HeartScore = table.Column<int>(type: "int", nullable: false),
                    ThroatScore = table.Column<int>(type: "int", nullable: false),
                    ThirdEyeScore = table.Column<int>(type: "int", nullable: false),
                    CrownScore = table.Column<int>(type: "int", nullable: false),
                    HarmonyScore = table.Column<float>(type: "real", nullable: true),
                    DominantBlockage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LogDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChakraLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityDiscussions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    AuthorName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    RepliesCount = table.Column<int>(type: "int", nullable: false),
                    IsPinned = table.Column<bool>(type: "bit", nullable: false),
                    LastActive = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityDiscussions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityPosts",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LikeCount = table.Column<int>(type: "int", nullable: false),
                    CommentCount = table.Column<int>(type: "int", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    ModerationStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Hashtags = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
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
                name: "DogProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Breed = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Age = table.Column<int>(type: "int", nullable: true),
                    Weight = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BaselineStartTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DogBaselineEstablished = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DogVitals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DogId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HeartRate = table.Column<int>(type: "int", nullable: true),
                    ActivityScore = table.Column<int>(type: "int", nullable: false),
                    Temperature = table.Column<double>(type: "float", nullable: true),
                    RestScore = table.Column<int>(type: "int", nullable: false),
                    RespirationRate = table.Column<double>(type: "float", nullable: true),
                    State = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogVitals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExpertQueries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanionName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AdminResponse = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RespondedOn = table.Column<DateTime>(type: "datetime2", nullable: true)
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
                name: "ExpertQueryCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertQueryCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FAQs",
                columns: table => new
                {
                    FAQId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Question = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FAQs", x => x.FAQId);
                });

            migrationBuilder.CreateTable(
                name: "HealingCircles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Time = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ParticipantsCount = table.Column<int>(type: "int", nullable: false),
                    MaxParticipants = table.Column<int>(type: "int", nullable: false),
                    IsPremium = table.Column<bool>(type: "bit", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealingCircles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HumanProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Age = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BaselineStartTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HumanBaselineEstablished = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HumanProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HumanVitals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HeartRate = table.Column<int>(type: "int", nullable: false),
                    HRV = table.Column<double>(type: "float", nullable: false),
                    Steps = table.Column<int>(type: "int", nullable: false),
                    SleepScore = table.Column<int>(type: "int", nullable: false),
                    StressScore = table.Column<int>(type: "int", nullable: true),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HumanVitals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SacredGuidePurchase",
                columns: table => new
                {
                    PurchaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SacredGuideId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PurchasedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SacredGuidePurchase", x => x.PurchaseId);
                });

            migrationBuilder.CreateTable(
                name: "SacredGuides",
                columns: table => new
                {
                    SacredGuideId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    PdfUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TotalPages = table.Column<int>(type: "int", nullable: true),
                    Chapters = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Distribution = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PreviewPercentage = table.Column<int>(type: "int", nullable: false),
                    AllowFreeUserDownload = table.Column<bool>(type: "bit", nullable: false),
                    RequiresPremium = table.Column<bool>(type: "bit", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SacredGuides", x => x.SacredGuideId);
                });

            migrationBuilder.CreateTable(
                name: "SiteSettings",
                columns: table => new
                {
                    SettingKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SettingValue = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteSettings", x => x.SettingKey);
                });

            migrationBuilder.CreateTable(
                name: "StressEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TimestampUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HRVAtEvent = table.Column<double>(type: "float", nullable: false),
                    HRAtEvent = table.Column<int>(type: "int", nullable: false),
                    BaselineHRV = table.Column<double>(type: "float", nullable: false),
                    BaselineHR = table.Column<double>(type: "float", nullable: false),
                    DeviationScore = table.Column<double>(type: "float", nullable: false),
                    DogStateAtEvent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AlertFired = table.Column<bool>(type: "bit", nullable: false),
                    OutcomeLogged = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StressEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    PlanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlanName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    BillingPeriod = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    StripePriceId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Features = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Badge = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SavingsText = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.PlanId);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    SubscriptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StripeCustomerId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    StripePriceId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    PlanName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CurrentPeriodStart = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CurrentPeriodEnd = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CancelAtPeriodEnd = table.Column<bool>(type: "bit", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true)
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
                name: "SyncScoreRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DogId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    Trend = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HRVStabilityScore = table.Column<int>(type: "int", nullable: false),
                    SharedActivityScore = table.Column<int>(type: "int", nullable: false),
                    DogCalmScore = table.Column<int>(type: "int", nullable: false),
                    SleepQualityScore = table.Column<int>(type: "int", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SyncScoreRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TargetCycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Cycles = table.Column<int>(type: "int", nullable: false),
                    DurationDescription = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TargetCycles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrendingTopics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TopicName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Count = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrendingTopics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserBaselines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AvgHeartRate = table.Column<double>(type: "float", nullable: false),
                    AvgHRV = table.Column<double>(type: "float", nullable: false),
                    HRVStdDev = table.Column<double>(type: "float", nullable: false),
                    AvgSleepScore = table.Column<double>(type: "float", nullable: false),
                    AvgSteps = table.Column<double>(type: "float", nullable: false),
                    LastUpdatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DaysOfDataCollected = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBaselines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserBreathingPreferences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PatternId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PatternName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetCycles = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserBreathingPreferences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserCredits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreditType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreditsTotal = table.Column<int>(type: "int", nullable: false),
                    CreditsUsed = table.Column<int>(type: "int", nullable: false),
                    BillingCycleStart = table.Column<DateTime>(type: "datetime2", nullable: false),
                    BillingCycleEnd = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true)
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
                name: "WellnessAlerts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DogId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AlertType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Suggestion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DogStateAtAlert = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    HRVAtAlert = table.Column<double>(type: "float", nullable: false),
                    HRAtAlert = table.Column<int>(type: "int", nullable: false),
                    IsActedOn = table.Column<bool>(type: "bit", nullable: false),
                    Outcome = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WellnessAlerts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommunityComments",
                columns: table => new
                {
                    CommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    ParentCommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
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
                    LikeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                name: "HealingCircleRegistrations",
                columns: table => new
                {
                    RegistrationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CircleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RegisteredOn = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    WaitlistId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SacredGuideId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JoinedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsNotified = table.Column<bool>(type: "bit", nullable: false)
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
                name: "SubscriptionLogs",
                columns: table => new
                {
                    LogId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubscriptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EventType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EventData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                    ReportId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PostId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CommentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReporterUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReportedUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReportType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReportedOn = table.Column<DateTime>(type: "datetime2", nullable: false)
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
                name: "IX_UserBondingActivities_ActivityId",
                table: "UserBondingActivities",
                column: "ActivityId");

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
                name: "IX_UserCredits_UserId",
                table: "UserCredits",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserBondingActivities_BondingActivities_ActivityId",
                table: "UserBondingActivities",
                column: "ActivityId",
                principalTable: "BondingActivities",
                principalColumn: "ActivityId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserBondingActivities_BondingActivities_ActivityId",
                table: "UserBondingActivities");

            migrationBuilder.DropTable(
                name: "BreathingPatterns");

            migrationBuilder.DropTable(
                name: "ChakraLogs");

            migrationBuilder.DropTable(
                name: "CommunityDiscussions");

            migrationBuilder.DropTable(
                name: "CommunityLikes");

            migrationBuilder.DropTable(
                name: "DogProfiles");

            migrationBuilder.DropTable(
                name: "DogVitals");

            migrationBuilder.DropTable(
                name: "ExpertQueries");

            migrationBuilder.DropTable(
                name: "ExpertQueryCategories");

            migrationBuilder.DropTable(
                name: "FAQs");

            migrationBuilder.DropTable(
                name: "HealingCircleRegistrations");

            migrationBuilder.DropTable(
                name: "HumanProfiles");

            migrationBuilder.DropTable(
                name: "HumanVitals");

            migrationBuilder.DropTable(
                name: "NotificationLogs");

            migrationBuilder.DropTable(
                name: "PostReports");

            migrationBuilder.DropTable(
                name: "SacredGuidePurchase");

            migrationBuilder.DropTable(
                name: "SacredGuideWaitlist");

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
                name: "TargetCycles");

            migrationBuilder.DropTable(
                name: "TrendingTopics");

            migrationBuilder.DropTable(
                name: "UserBaselines");

            migrationBuilder.DropTable(
                name: "UserBreathingPreferences");

            migrationBuilder.DropTable(
                name: "UserCredits");

            migrationBuilder.DropTable(
                name: "WellnessAlerts");

            migrationBuilder.DropTable(
                name: "HealingCircles");

            migrationBuilder.DropTable(
                name: "CommunityComments");

            migrationBuilder.DropTable(
                name: "SacredGuides");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropTable(
                name: "CommunityPosts");

            migrationBuilder.DropIndex(
                name: "IX_UserBondingActivities_ActivityId",
                table: "UserBondingActivities");

            migrationBuilder.DropColumn(
                name: "Age",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "StripeCustomerId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ActivityDate",
                table: "UserCheckIns");

            migrationBuilder.DropColumn(
                name: "DailyPointsChange",
                table: "UserCheckIns");

            migrationBuilder.DropColumn(
                name: "IsMissed",
                table: "UserCheckIns");

            migrationBuilder.DropColumn(
                name: "ScoreSnapshot",
                table: "UserCheckIns");

            migrationBuilder.DropColumn(
                name: "ActivityDate",
                table: "UserActivitiesScores");

            migrationBuilder.DropColumn(
                name: "ActivityDetails",
                table: "UserActivitiesScores");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "JournalEntries");

            migrationBuilder.DropColumn(
                name: "MediaType",
                table: "JournalEntries");

            migrationBuilder.DropColumn(
                name: "MediaUrl",
                table: "JournalEntries");

            migrationBuilder.DropColumn(
                name: "Age",
                table: "Dogs");

            migrationBuilder.DropColumn(
                name: "Breed",
                table: "Dogs");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "Dogs");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "BondingActivities");

            migrationBuilder.DropColumn(
                name: "InteractionType",
                table: "BondingActivities");

            migrationBuilder.AlterColumn<int>(
                name: "ActivityId",
                table: "UserBondingActivities",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "ActivityId1",
                table: "UserBondingActivities",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<double>(
                name: "Points",
                table: "ScoringRules",
                type: "float",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "Category",
                table: "Rituals",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Rituals",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "RitualId",
                table: "RitualLogs",
                type: "int",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.CreateTable(
                name: "ExpertQuestions",
                columns: table => new
                {
                    ExpertQuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CompanionName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedOn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Question = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    UpdatedOn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertQuestions", x => x.ExpertQuestionId);
                });

            migrationBuilder.InsertData(
                table: "Rituals",
                columns: new[] { "Id", "Category", "Description", "Duration", "IconType", "Title" },
                values: new object[,]
                {
                    { 1, "Morning", "Set a spiritual intention for the day with your companion", "5 min", "Sun", "Morning Intention Setting" },
                    { 2, "Morning", "Assess and align your energy levels together", "3 min", "Heart", "Energy Check-in" },
                    { 3, "Afternoon", "Take a conscious walk focusing on present moment awareness", "20 min", "Ball", "Mindful Walk" },
                    { 4, "Afternoon", "Share a moment of gratitude for your bond", "5 min", "Hand", "Gratitude Moment" },
                    { 5, "Evening", "Reflect on the day's connections and insights", "10 min", "Moon", "Evening Reflection" },
                    { 6, "Evening", "Send loving energy to your companion before sleep", "3 min", "Heart", "Bedtime Blessing" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserBondingActivities_ActivityId1",
                table: "UserBondingActivities",
                column: "ActivityId1");

            migrationBuilder.CreateIndex(
                name: "IX_RitualLogs_UserId",
                table: "RitualLogs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_RitualLogs_Users_UserId",
                table: "RitualLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserBondingActivities_BondingActivities_ActivityId1",
                table: "UserBondingActivities",
                column: "ActivityId1",
                principalTable: "BondingActivities",
                principalColumn: "ActivityId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
