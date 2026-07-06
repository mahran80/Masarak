using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarak.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonsFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LessonId",
                table: "exams",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LessonId",
                table: "content_items",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LessonId",
                table: "assignments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "lessons",
                columns: table => new
                {
                    LessonId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeachingAssignmentId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OrderNum = table.Column<int>(type: "int", nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lessons", x => x.LessonId);
                    table.ForeignKey(
                        name: "FK_lessons_teaching_assignments_TeachingAssignmentId",
                        column: x => x.TeachingAssignmentId,
                        principalTable: "teaching_assignments",
                        principalColumn: "AssignmentId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_exams_LessonId",
                table: "exams",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_content_items_LessonId",
                table: "content_items",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_assignments_LessonId",
                table: "assignments",
                column: "LessonId");

            migrationBuilder.CreateIndex(
                name: "IX_lessons_TA_Order",
                table: "lessons",
                columns: new[] { "TeachingAssignmentId", "OrderNum" });

            migrationBuilder.AddForeignKey(
                name: "FK_assignments_lessons_LessonId",
                table: "assignments",
                column: "LessonId",
                principalTable: "lessons",
                principalColumn: "LessonId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_content_items_lessons_LessonId",
                table: "content_items",
                column: "LessonId",
                principalTable: "lessons",
                principalColumn: "LessonId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_exams_lessons_LessonId",
                table: "exams",
                column: "LessonId",
                principalTable: "lessons",
                principalColumn: "LessonId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_assignments_lessons_LessonId",
                table: "assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_content_items_lessons_LessonId",
                table: "content_items");

            migrationBuilder.DropForeignKey(
                name: "FK_exams_lessons_LessonId",
                table: "exams");

            migrationBuilder.DropTable(
                name: "lessons");

            migrationBuilder.DropIndex(
                name: "IX_exams_LessonId",
                table: "exams");

            migrationBuilder.DropIndex(
                name: "IX_content_items_LessonId",
                table: "content_items");

            migrationBuilder.DropIndex(
                name: "IX_assignments_LessonId",
                table: "assignments");

            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "exams");

            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "content_items");

            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "assignments");
        }
    }
}
