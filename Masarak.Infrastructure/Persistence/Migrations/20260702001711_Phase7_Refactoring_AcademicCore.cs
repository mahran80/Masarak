using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Masarak.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Phase7_Refactoring_AcademicCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_teaching_assignments_SubjectId",
                table: "teaching_assignments");

            migrationBuilder.DropIndex(
                name: "UX_teaching_assignments_unique",
                table: "teaching_assignments");

            migrationBuilder.AddColumn<int>(
                name: "EnrollmentType",
                table: "student_classes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "student_class_subjects",
                columns: table => new
                {
                    StudentClassId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_class_subjects", x => new { x.StudentClassId, x.SubjectId });
                    table.ForeignKey(
                        name: "FK_student_class_subjects_student_classes_StudentClassId",
                        column: x => x.StudentClassId,
                        principalTable: "student_classes",
                        principalColumn: "StudentClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_class_subjects_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subscription_subjects",
                columns: table => new
                {
                    SubscriptionId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscription_subjects", x => new { x.SubscriptionId, x.SubjectId });
                    table.ForeignKey(
                        name: "FK_subscription_subjects_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_subscription_subjects_subscriptions_SubscriptionId",
                        column: x => x.SubscriptionId,
                        principalTable: "subscriptions",
                        principalColumn: "SubscriptionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "teacher_subjects",
                columns: table => new
                {
                    TeacherId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_subjects", x => new { x.TeacherId, x.SubjectId });
                    table.ForeignKey(
                        name: "FK_teacher_subjects_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_subjects_teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "teachers",
                        principalColumn: "TeacherId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_teaching_assignments_TeacherId",
                table: "teaching_assignments",
                column: "TeacherId");

            migrationBuilder.CreateIndex(
                name: "UX_teaching_assignments_unique",
                table: "teaching_assignments",
                columns: new[] { "SubjectId", "ClassId", "AcademicYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_class_subjects_SubjectId",
                table: "student_class_subjects",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_subjects_SubjectId",
                table: "subscription_subjects",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subjects_SubjectId",
                table: "teacher_subjects",
                column: "SubjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_class_subjects");

            migrationBuilder.DropTable(
                name: "subscription_subjects");

            migrationBuilder.DropTable(
                name: "teacher_subjects");

            migrationBuilder.DropIndex(
                name: "IX_teaching_assignments_TeacherId",
                table: "teaching_assignments");

            migrationBuilder.DropIndex(
                name: "UX_teaching_assignments_unique",
                table: "teaching_assignments");

            migrationBuilder.DropColumn(
                name: "EnrollmentType",
                table: "student_classes");

            migrationBuilder.CreateIndex(
                name: "IX_teaching_assignments_SubjectId",
                table: "teaching_assignments",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "UX_teaching_assignments_unique",
                table: "teaching_assignments",
                columns: new[] { "TeacherId", "SubjectId", "ClassId", "AcademicYear" },
                unique: true);
        }
    }
}
