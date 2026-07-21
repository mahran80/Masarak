using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarak.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionSeriesId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SeriesId",
                table: "sessions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_sessions_SeriesId",
                table: "sessions",
                column: "SeriesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_sessions_SeriesId",
                table: "sessions");

            migrationBuilder.DropColumn(
                name: "SeriesId",
                table: "sessions");
        }
    }
}
