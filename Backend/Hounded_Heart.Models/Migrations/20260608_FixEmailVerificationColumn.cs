using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hounded_Heart.Models.Migrations
{
    /// <inheritdoc />
    public partial class FixEmailVerificationColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add IsEmailVerified column only if it doesn't exist
            migrationBuilder.Sql(
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'Users' AND column_name = 'IsEmailVerified'
                    ) THEN
                        ALTER TABLE ""Users"" DROP COLUMN ""IsEmailVerified"";
                    END IF;
                END $$;"
            );
        }
    }
}
