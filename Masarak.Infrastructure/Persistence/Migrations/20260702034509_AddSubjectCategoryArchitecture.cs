using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarak.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSubjectCategoryArchitecture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subjects_subjects_SubjectId",
                table: "teacher_subjects");

            migrationBuilder.RenameColumn(
                name: "SubjectId",
                table: "teacher_subjects",
                newName: "SubjectCategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_teacher_subjects_SubjectId",
                table: "teacher_subjects",
                newName: "IX_teacher_subjects_SubjectCategoryId");

            migrationBuilder.AddColumn<int>(
                name: "SubjectCategoryId",
                table: "subjects",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "subject_categories",
                columns: table => new
                {
                    SubjectCategoryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subject_categories", x => x.SubjectCategoryId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_subjects_SubjectCategoryId",
                table: "subjects",
                column: "SubjectCategoryId");

            // Seed a default category and update existing records
            migrationBuilder.Sql("INSERT INTO [subject_categories] (Name, IsActive) VALUES ('Uncategorized', 1);");
            migrationBuilder.Sql("UPDATE [subjects] SET SubjectCategoryId = 1;");
            migrationBuilder.Sql("UPDATE [teacher_subjects] SET SubjectCategoryId = 1;");

            migrationBuilder.AddForeignKey(
                name: "FK_subjects_subject_categories_SubjectCategoryId",
                table: "subjects",
                column: "SubjectCategoryId",
                principalTable: "subject_categories",
                principalColumn: "SubjectCategoryId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subjects_subject_categories_SubjectCategoryId",
                table: "teacher_subjects",
                column: "SubjectCategoryId",
                principalTable: "subject_categories",
                principalColumn: "SubjectCategoryId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_subjects_subject_categories_SubjectCategoryId",
                table: "subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subjects_subject_categories_SubjectCategoryId",
                table: "teacher_subjects");

            migrationBuilder.DropTable(
                name: "subject_categories");

            migrationBuilder.DropIndex(
                name: "IX_subjects_SubjectCategoryId",
                table: "subjects");

            migrationBuilder.DropColumn(
                name: "SubjectCategoryId",
                table: "subjects");

            migrationBuilder.RenameColumn(
                name: "SubjectCategoryId",
                table: "teacher_subjects",
                newName: "SubjectId");

            migrationBuilder.RenameIndex(
                name: "IX_teacher_subjects_SubjectCategoryId",
                table: "teacher_subjects",
                newName: "IX_teacher_subjects_SubjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subjects_subjects_SubjectId",
                table: "teacher_subjects",
                column: "SubjectId",
                principalTable: "subjects",
                principalColumn: "SubjectId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
