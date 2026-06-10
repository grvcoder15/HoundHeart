using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hounded_Heart.Models.PostgresMigrations
{
    /// <inheritdoc />
    public partial class AddTierLevelToSubscriptionPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TierLevel",
                table: "SubscriptionPlans",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "plus");

            migrationBuilder.Sql(@"
                UPDATE ""SubscriptionPlans""
                SET ""TierLevel"" = 'plus'
                WHERE ""TierLevel"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TierLevel",
                table: "SubscriptionPlans");
        }
    }
}
