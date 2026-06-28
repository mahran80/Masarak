using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarak.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase4_AttendanceContentChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_attendance_students_StudentId",
                table: "attendance");

            migrationBuilder.DropColumn(
                name: "LeftAt",
                table: "attendance");

            migrationBuilder.RenameColumn(
                name: "StudentId",
                table: "attendance",
                newName: "StudentUserId");

            migrationBuilder.RenameIndex(
                name: "IX_attendance_StudentId",
                table: "attendance",
                newName: "IX_attendance_StudentUserId");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "attendance",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Present");

            migrationBuilder.AddColumn<DateTime>(
                name: "RecordedAt",
                table: "attendance",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()");

            migrationBuilder.AddColumn<string>(
                name: "TeacherNote",
                table: "attendance",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "chat_rooms",
                columns: table => new
                {
                    ChatRoomId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    RoomType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    GradeId = table.Column<int>(type: "int", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_rooms", x => x.ChatRoomId);
                    table.ForeignKey(
                        name: "FK_chat_rooms_grades_GradeId",
                        column: x => x.GradeId,
                        principalTable: "grades",
                        principalColumn: "GradeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "content_items",
                columns: table => new
                {
                    ContentItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeachingAssignmentId = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<int>(type: "int", nullable: true),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SourceType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResourceUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    BlobName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_content_items", x => x.ContentItemId);
                    table.ForeignKey(
                        name: "FK_content_items_sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "sessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_content_items_teaching_assignments_TeachingAssignmentId",
                        column: x => x.TeachingAssignmentId,
                        principalTable: "teaching_assignments",
                        principalColumn: "AssignmentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                columns: table => new
                {
                    ChatMessageId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatRoomId = table.Column<int>(type: "int", nullable: false),
                    SenderUserId = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_messages", x => x.ChatMessageId);
                    table.ForeignKey(
                        name: "FK_chat_messages_chat_rooms_ChatRoomId",
                        column: x => x.ChatRoomId,
                        principalTable: "chat_rooms",
                        principalColumn: "ChatRoomId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_chat_messages_users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_Room_SentAt",
                table: "chat_messages",
                columns: new[] { "ChatRoomId", "SentAt" });

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_SenderUserId",
                table: "chat_messages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "UX_chat_rooms_GradeId",
                table: "chat_rooms",
                column: "GradeId",
                unique: true,
                filter: "[GradeId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_content_items_SessionId",
                table: "content_items",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_content_items_TA_Type_Active",
                table: "content_items",
                columns: new[] { "TeachingAssignmentId", "Type", "IsActive" });

            migrationBuilder.AddForeignKey(
                name: "FK_attendance_users_StudentUserId",
                table: "attendance",
                column: "StudentUserId",
                principalTable: "users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_attendance_users_StudentUserId",
                table: "attendance");

            migrationBuilder.DropTable(
                name: "chat_messages");

            migrationBuilder.DropTable(
                name: "content_items");

            migrationBuilder.DropTable(
                name: "chat_rooms");

            migrationBuilder.DropColumn(
                name: "RecordedAt",
                table: "attendance");

            migrationBuilder.DropColumn(
                name: "TeacherNote",
                table: "attendance");

            migrationBuilder.RenameColumn(
                name: "StudentUserId",
                table: "attendance",
                newName: "StudentId");

            migrationBuilder.RenameIndex(
                name: "IX_attendance_StudentUserId",
                table: "attendance",
                newName: "IX_attendance_StudentId");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "attendance",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Present",
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);

            migrationBuilder.AddColumn<DateTime>(
                name: "LeftAt",
                table: "attendance",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_attendance_students_StudentId",
                table: "attendance",
                column: "StudentId",
                principalTable: "students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
