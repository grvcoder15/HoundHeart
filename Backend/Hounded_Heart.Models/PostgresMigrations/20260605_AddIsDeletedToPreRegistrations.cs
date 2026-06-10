using Microsoft.EntityFrameworkCore.Migrations;

namespace Hounded_Heart.Models.PostgresMigrations
{
    public partial class AddIsDeletedToPreRegistrations : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PreRegistrations",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PreRegistrations");
        }
    }
}
