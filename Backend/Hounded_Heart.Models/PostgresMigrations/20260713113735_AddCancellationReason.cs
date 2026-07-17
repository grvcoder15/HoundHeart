using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hounded_Heart.Models.PostgresMigrations
{
    /// <inheritdoc />
    public partial class AddCancellationReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HumanDailySummaries_HumanProfiles_UserId",
                table: "HumanDailySummaries");

            migrationBuilder.AddColumn<Guid>(
                name: "DogId",
                table: "FitBarkDogs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FetchedAt",
                table: "DogVitals",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FitBarkId",
                table: "DogVitals",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "DogVitals",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ExpertSessionRequests",
                columns: table => new
                {
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    UserName = table.Column<string>(type: "text", nullable: false),
                    UserEmail = table.Column<string>(type: "text", nullable: false),
                    ProblemDescription = table.Column<string>(type: "text", nullable: false),
                    PreferredTiming = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertSessionRequests", x => x.RequestId);
                });

            migrationBuilder.CreateTable(
                name: "VideoSessions",
                columns: table => new
                {
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ExpertId = table.Column<string>(type: "text", nullable: true),
                    RoomUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RoomName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoSessions", x => x.SessionId);
                });

            migrationBuilder.CreateTable(
                name: "ExpertSessionNotifications",
                columns: table => new
                {
                    NotificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    IsAdminNotification = table.Column<bool>(type: "boolean", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertSessionNotifications", x => x.NotificationId);
                    table.ForeignKey(
                        name: "FK_ExpertSessionNotifications_ExpertSessionRequests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "ExpertSessionRequests",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExpertSessionSlots",
                columns: table => new
                {
                    SlotId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProposedDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsSelected = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertSessionSlots", x => x.SlotId);
                    table.ForeignKey(
                        name: "FK_ExpertSessionSlots_ExpertSessionRequests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "ExpertSessionRequests",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExpertSessionConfirmed",
                columns: table => new
                {
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    SelectedSlotId = table.Column<Guid>(type: "uuid", nullable: false),
                    ScheduledDateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MeetingLink = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RoomName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    StripePaymentIntentId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    AmountPaid = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpertSessionConfirmed", x => x.SessionId);
                    table.ForeignKey(
                        name: "FK_ExpertSessionConfirmed_ExpertSessionRequests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "ExpertSessionRequests",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExpertSessionConfirmed_ExpertSessionSlots_SelectedSlotId",
                        column: x => x.SelectedSlotId,
                        principalTable: "ExpertSessionSlots",
                        principalColumn: "SlotId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExpertSessionConfirmed_RequestId",
                table: "ExpertSessionConfirmed",
                column: "RequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExpertSessionConfirmed_SelectedSlotId",
                table: "ExpertSessionConfirmed",
                column: "SelectedSlotId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpertSessionNotifications_RequestId",
                table: "ExpertSessionNotifications",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpertSessionSlots_RequestId",
                table: "ExpertSessionSlots",
                column: "RequestId");

            migrationBuilder.AddForeignKey(
                name: "FK_HumanDailySummaries_Users_UserId",
                table: "HumanDailySummaries",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HumanDailySummaries_Users_UserId",
                table: "HumanDailySummaries");

            migrationBuilder.DropTable(
                name: "ExpertSessionConfirmed");

            migrationBuilder.DropTable(
                name: "ExpertSessionNotifications");

            migrationBuilder.DropTable(
                name: "VideoSessions");

            migrationBuilder.DropTable(
                name: "ExpertSessionSlots");

            migrationBuilder.DropTable(
                name: "ExpertSessionRequests");

            migrationBuilder.DropColumn(
                name: "DogId",
                table: "FitBarkDogs");

            migrationBuilder.DropColumn(
                name: "FetchedAt",
                table: "DogVitals");

            migrationBuilder.DropColumn(
                name: "FitBarkId",
                table: "DogVitals");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "DogVitals");

            migrationBuilder.AddForeignKey(
                name: "FK_HumanDailySummaries_HumanProfiles_UserId",
                table: "HumanDailySummaries",
                column: "UserId",
                principalTable: "HumanProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
