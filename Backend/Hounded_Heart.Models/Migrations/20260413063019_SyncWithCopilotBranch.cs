using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hounded_Heart.Models.Migrations
{
    /// <inheritdoc />
    public partial class SyncWithCopilotBranch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "DistanceMetres",
                table: "WellnessAlerts",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDogNearby",
                table: "WellnessAlerts",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecoveryMessage",
                table: "WellnessAlerts",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "AvgAmbientTemperature",
                table: "UserBaselines",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HumanBaselineEstablished",
                table: "UserBaselines",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTestMode",
                table: "UserBaselines",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDelivered",
                table: "NotificationLogs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "AmbientTemperature",
                table: "HumanVitals",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "HumanVitals",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "HumanVitals",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeatherCondition",
                table: "HumanVitals",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WeatherLocation",
                table: "HumanVitals",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "HumanProfiles",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "DogVitals",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "DogVitals",
                type: "float",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DogBaselines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DogId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AvgHeartRate = table.Column<double>(type: "float", nullable: true),
                    AvgActivityScore = table.Column<double>(type: "float", nullable: false),
                    AvgTemperature = table.Column<double>(type: "float", nullable: true),
                    AvgRestScore = table.Column<double>(type: "float", nullable: false),
                    AvgRespirationRate = table.Column<double>(type: "float", nullable: true),
                    LastUpdatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DaysOfDataCollected = table.Column<int>(type: "int", nullable: false),
                    DogBaselineEstablished = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DogBaselines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MessageLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MessageType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Channel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RecipientContact = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Body = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RelatedAlertId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeliveredAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageLogs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DogBaselines");

            migrationBuilder.DropTable(
                name: "MessageLogs");

            migrationBuilder.DropColumn(
                name: "DistanceMetres",
                table: "WellnessAlerts");

            migrationBuilder.DropColumn(
                name: "IsDogNearby",
                table: "WellnessAlerts");

            migrationBuilder.DropColumn(
                name: "RecoveryMessage",
                table: "WellnessAlerts");

            migrationBuilder.DropColumn(
                name: "AvgAmbientTemperature",
                table: "UserBaselines");

            migrationBuilder.DropColumn(
                name: "HumanBaselineEstablished",
                table: "UserBaselines");

            migrationBuilder.DropColumn(
                name: "IsTestMode",
                table: "UserBaselines");

            migrationBuilder.DropColumn(
                name: "IsDelivered",
                table: "NotificationLogs");

            migrationBuilder.DropColumn(
                name: "AmbientTemperature",
                table: "HumanVitals");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "HumanVitals");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "HumanVitals");

            migrationBuilder.DropColumn(
                name: "WeatherCondition",
                table: "HumanVitals");

            migrationBuilder.DropColumn(
                name: "WeatherLocation",
                table: "HumanVitals");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "HumanProfiles");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "DogVitals");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "DogVitals");
        }
    }
}
