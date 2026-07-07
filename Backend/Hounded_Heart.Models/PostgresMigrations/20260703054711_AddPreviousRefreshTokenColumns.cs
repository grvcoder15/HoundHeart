using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hounded_Heart.Models.PostgresMigrations
{
    /// <inheritdoc />
    public partial class AddPreviousRefreshTokenColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Dogs_UserId",
                table: "Dogs");

            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PreviousRefreshToken",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PreviousRefreshTokenExpiryTime",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DogId",
                table: "UserCheckIns",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DogId",
                table: "UserBondingActivities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DogId",
                table: "UserActivitiesScores",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DonationAmount",
                table: "SubscriptionPlans",
                type: "numeric(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "DogId",
                table: "RitualLogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DogId",
                table: "JournalEntries",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "datelost",
                table: "Dogs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "dateofdeath",
                table: "Dogs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "memorynote",
                table: "Dogs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "Dogs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CourseAssessments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    PassingScorePercent = table.Column<int>(type: "integer", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseAssessments_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseAudios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    AudioUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseAudios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseAudios_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseBookContents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseBookContents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseBookContents_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseResources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    FileUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ExternalUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseResources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseResources_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseVideos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    VideoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseVideos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseVideos_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseVisuals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseVisuals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseVisuals_Courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "Courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DetailedAnalysisReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DogId = table.Column<Guid>(type: "uuid", nullable: true),
                    LatestDogCheckinId = table.Column<Guid>(type: "uuid", nullable: true),
                    LatestEnvironmentCheckinId = table.Column<Guid>(type: "uuid", nullable: true),
                    BaselineSnapshotJson = table.Column<string>(type: "text", nullable: true),
                    LatestVitalsSnapshotJson = table.Column<string>(type: "text", nullable: true),
                    PhotoUrlsJson = table.Column<string>(type: "text", nullable: true),
                    ReportJson = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetailedAnalysisReports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LegacyProjectAdminPhotos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionKey = table.Column<string>(type: "text", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegacyProjectAdminPhotos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LegacyProjectContents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionKey = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    ImpactStatsJson = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegacyProjectContents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LegacyProjectUpdates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SectionKey = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegacyProjectUpdates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ResearchSubmissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResearchSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResearchSubmissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeniorDogSubmissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DogName = table.Column<string>(type: "text", nullable: false),
                    Story = table.Column<string>(type: "text", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeniorDogSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeniorDogSubmissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StoreProducts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsComingSoon = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreProducts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TreeDedications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DogName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TributeMessage = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: false),
                    DedicationType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    GrowthStage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreeDedications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreeDedications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WellnessChecks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PhotoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PhotoUrlsJson = table.Column<string>(type: "text", nullable: true),
                    AnswersJson = table.Column<string>(type: "text", nullable: true),
                    AiResponseJson = table.Column<string>(type: "text", nullable: true),
                    DetailedOverviewJson = table.Column<string>(type: "text", nullable: true),
                    EnvironmentCheckReferenceId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProgressInsightJson = table.Column<string>(type: "text", nullable: true),
                    FitBarkDataSnapshotJson = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WellnessChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WellnessChecks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseAssessmentQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AssessmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionText = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseAssessmentQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseAssessmentQuestions_CourseAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "CourseAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CourseAssessmentOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    OptionText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseAssessmentOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseAssessmentOptions_CourseAssessmentQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "CourseAssessmentQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Dogs_UserId",
                table: "Dogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAssessmentOptions_QuestionId",
                table: "CourseAssessmentOptions",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAssessmentQuestions_AssessmentId",
                table: "CourseAssessmentQuestions",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAssessments_CourseId",
                table: "CourseAssessments",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseAudios_CourseId",
                table: "CourseAudios",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseBookContents_CourseId",
                table: "CourseBookContents",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseResources_CourseId",
                table: "CourseResources",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseVideos_CourseId",
                table: "CourseVideos",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseVisuals_CourseId",
                table: "CourseVisuals",
                column: "CourseId");

            migrationBuilder.CreateIndex(
                name: "IX_ResearchSubmissions_UserId",
                table: "ResearchSubmissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SeniorDogSubmissions_UserId",
                table: "SeniorDogSubmissions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TreeDedications_UserId",
                table: "TreeDedications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_WellnessChecks_UserId",
                table: "WellnessChecks",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseAssessmentOptions");

            migrationBuilder.DropTable(
                name: "CourseAudios");

            migrationBuilder.DropTable(
                name: "CourseBookContents");

            migrationBuilder.DropTable(
                name: "CourseResources");

            migrationBuilder.DropTable(
                name: "CourseVideos");

            migrationBuilder.DropTable(
                name: "CourseVisuals");

            migrationBuilder.DropTable(
                name: "DetailedAnalysisReports");

            migrationBuilder.DropTable(
                name: "LegacyProjectAdminPhotos");

            migrationBuilder.DropTable(
                name: "LegacyProjectContents");

            migrationBuilder.DropTable(
                name: "LegacyProjectUpdates");

            migrationBuilder.DropTable(
                name: "ResearchSubmissions");

            migrationBuilder.DropTable(
                name: "SeniorDogSubmissions");

            migrationBuilder.DropTable(
                name: "StoreProducts");

            migrationBuilder.DropTable(
                name: "TreeDedications");

            migrationBuilder.DropTable(
                name: "WellnessChecks");

            migrationBuilder.DropTable(
                name: "CourseAssessmentQuestions");

            migrationBuilder.DropTable(
                name: "CourseAssessments");

            migrationBuilder.DropIndex(
                name: "IX_Dogs_UserId",
                table: "Dogs");

            migrationBuilder.DropColumn(
                name: "IsAdmin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreviousRefreshToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreviousRefreshTokenExpiryTime",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DogId",
                table: "UserCheckIns");

            migrationBuilder.DropColumn(
                name: "DogId",
                table: "UserBondingActivities");

            migrationBuilder.DropColumn(
                name: "DogId",
                table: "UserActivitiesScores");

            migrationBuilder.DropColumn(
                name: "DonationAmount",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "DogId",
                table: "RitualLogs");

            migrationBuilder.DropColumn(
                name: "DogId",
                table: "JournalEntries");

            migrationBuilder.DropColumn(
                name: "datelost",
                table: "Dogs");

            migrationBuilder.DropColumn(
                name: "dateofdeath",
                table: "Dogs");

            migrationBuilder.DropColumn(
                name: "memorynote",
                table: "Dogs");

            migrationBuilder.DropColumn(
                name: "status",
                table: "Dogs");

            migrationBuilder.CreateIndex(
                name: "IX_Dogs_UserId",
                table: "Dogs",
                column: "UserId",
                unique: true);
        }
    }
}
