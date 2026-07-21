using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarak.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase2_AcademicCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_class_classes_ClassId",
                table: "student_class");

            migrationBuilder.DropForeignKey(
                name: "FK_student_class_students_StudentId",
                table: "student_class");

            migrationBuilder.DropIndex(
                name: "IX_sessions_AssignmentId",
                table: "sessions");

            migrationBuilder.DropIndex(
                name: "IX_classes_GradeId",
                table: "classes");

            migrationBuilder.DropIndex(
                name: "UX_classes_Name_GradeId",
                table: "classes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_student_class",
                table: "student_class");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "sessions");

            migrationBuilder.DropColumn(
                name: "MeetingLink",
                table: "sessions");

            migrationBuilder.RenameTable(
                name: "student_class",
                newName: "student_classes");

            migrationBuilder.RenameColumn(
                name: "StartTime",
                table: "sessions",
                newName: "ScheduledAt");

            migrationBuilder.RenameColumn(
                name: "RecordingUrl",
                table: "sessions",
                newName: "EmbedUrl");

            migrationBuilder.RenameColumn(
                name: "Level",
                table: "grades",
                newName: "Order");

            migrationBuilder.RenameColumn(
                name: "Capacity",
                table: "classes",
                newName: "MaxCapacity");

            migrationBuilder.RenameColumn(
                name: "IsCurrent",
                table: "student_classes",
                newName: "IsActive");

            migrationBuilder.RenameIndex(
                name: "IX_student_class_ClassId",
                table: "student_classes",
                newName: "IX_student_classes_ClassId");

            migrationBuilder.AlterColumn<int>(
                name: "AcademicYear",
                table: "teaching_assignments",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(9)",
                oldMaxLength: 9);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "teaching_assignments",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "subjects",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "subjects",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "sessions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Scheduled");

            migrationBuilder.AddColumn<int>(
                name: "ClassId",
                table: "sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "sessions",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "grades",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "grades",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Stage",
                table: "grades",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "AcademicYear",
                table: "classes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "classes",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AlterColumn<int>(
                name: "AcademicYear",
                table: "student_classes",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(9)",
                oldMaxLength: 9);

            migrationBuilder.AddColumn<int>(
                name: "StudentClassId",
                table: "student_classes",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<DateTime>(
                name: "EnrolledAt",
                table: "student_classes",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()");

            migrationBuilder.AddPrimaryKey(
                name: "PK_student_classes",
                table: "student_classes",
                column: "StudentClassId");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_Assignment_ScheduledAt",
                table: "sessions",
                columns: new[] { "AssignmentId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_sessions_Class_ScheduledAt",
                table: "sessions",
                columns: new[] { "ClassId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "UX_grades_Order",
                table: "grades",
                column: "Order",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_classes_Grade_Name_Year",
                table: "classes",
                columns: new[] { "GradeId", "Name", "AcademicYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_student_classes_Student_Year",
                table: "student_classes",
                columns: new[] { "StudentId", "AcademicYear" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_sessions_classes_ClassId",
                table: "sessions",
                column: "ClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_student_classes_classes_ClassId",
                table: "student_classes",
                column: "ClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_student_classes_students_StudentId",
                table: "student_classes",
                column: "StudentId",
                principalTable: "students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_sessions_classes_ClassId",
                table: "sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_student_classes_classes_ClassId",
                table: "student_classes");

            migrationBuilder.DropForeignKey(
                name: "FK_student_classes_students_StudentId",
                table: "student_classes");

            migrationBuilder.DropIndex(
                name: "IX_sessions_Assignment_ScheduledAt",
                table: "sessions");

            migrationBuilder.DropIndex(
                name: "IX_sessions_Class_ScheduledAt",
                table: "sessions");

            migrationBuilder.DropIndex(
                name: "UX_grades_Order",
                table: "grades");

            migrationBuilder.DropIndex(
                name: "UX_classes_Grade_Name_Year",
                table: "classes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_student_classes",
                table: "student_classes");

            migrationBuilder.DropIndex(
                name: "UX_student_classes_Student_Year",
                table: "student_classes");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "teaching_assignments");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "subjects");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "subjects");

            migrationBuilder.DropColumn(
                name: "ClassId",
                table: "sessions");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "sessions");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "sessions");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "sessions");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "grades");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "grades");

            migrationBuilder.DropColumn(
                name: "Stage",
                table: "grades");

            migrationBuilder.DropColumn(
                name: "AcademicYear",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "classes");

            migrationBuilder.DropColumn(
                name: "StudentClassId",
                table: "student_classes");

            migrationBuilder.DropColumn(
                name: "EnrolledAt",
                table: "student_classes");

            migrationBuilder.RenameTable(
                name: "student_classes",
                newName: "student_class");

            migrationBuilder.RenameColumn(
                name: "ScheduledAt",
                table: "sessions",
                newName: "StartTime");

            migrationBuilder.RenameColumn(
                name: "EmbedUrl",
                table: "sessions",
                newName: "RecordingUrl");

            migrationBuilder.RenameColumn(
                name: "Order",
                table: "grades",
                newName: "Level");

            migrationBuilder.RenameColumn(
                name: "MaxCapacity",
                table: "classes",
                newName: "Capacity");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "student_class",
                newName: "IsCurrent");

            migrationBuilder.RenameIndex(
                name: "IX_student_classes_ClassId",
                table: "student_class",
                newName: "IX_student_class_ClassId");

            migrationBuilder.AlterColumn<string>(
                name: "AcademicYear",
                table: "teaching_assignments",
                type: "nvarchar(9)",
                maxLength: 9,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "sessions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Scheduled",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndTime",
                table: "sessions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "MeetingLink",
                table: "sessions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AcademicYear",
                table: "student_class",
                type: "nvarchar(9)",
                maxLength: 9,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddPrimaryKey(
                name: "PK_student_class",
                table: "student_class",
                columns: new[] { "StudentId", "ClassId", "AcademicYear" });

            migrationBuilder.CreateIndex(
                name: "IX_sessions_AssignmentId",
                table: "sessions",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_classes_GradeId",
                table: "classes",
                column: "GradeId");

            migrationBuilder.CreateIndex(
                name: "UX_classes_Name_GradeId",
                table: "classes",
                columns: new[] { "Name", "GradeId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_student_class_classes_ClassId",
                table: "student_class",
                column: "ClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_student_class_students_StudentId",
                table: "student_class",
                column: "StudentId",
                principalTable: "students",
                principalColumn: "StudentId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
