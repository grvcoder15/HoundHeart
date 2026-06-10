using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Hounded_Heart.Models.Migrations
{
    /// <inheritdoc />
    public partial class SeedRituals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Rituals",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Rituals",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Rituals",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Rituals",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Rituals",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Rituals",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
