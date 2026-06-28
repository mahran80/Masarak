using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarak.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionStatusScheduledAtIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_sessions_Status_ScheduledAt",
                table: "sessions",
                columns: new[] { "Status", "ScheduledAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_sessions_Status_ScheduledAt",
                table: "sessions");
        }
    }
}
