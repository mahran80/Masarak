const fs = require('fs');

const collection = {
    info: {
        name: "Masarak_Phase3_Assessment",
        description: "Complete Phase 3 Assessment & Grading endpoints generated dynamically based on codebase routing.",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [
        {
            name: "1. Teacher Assignments",
            item: [
                {
                    name: "Create Assignment",
                    request: {
                        method: "POST",
                        header: [
                            { key: "Content-Type", value: "application/json" },
                            { key: "Authorization", value: "Bearer {{teacherAccessToken}}" }
                        ],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/assignments",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "assignments"]
                        },
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                teachingAssignmentId: 1,
                                title: "Math Assignment 1",
                                instructions: "Please solve all questions.",
                                dueDate: "2026-12-31T23:59:59Z",
                                maxScore: 100.0
                            }, null, 4)
                        }
                    },
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "var j = pm.response.json();",
                                    "if(j.assignmentId) pm.environment.set('assignmentId', j.assignmentId);"
                                ]
                            }
                        }
                    ]
                },
                {
                    name: "Publish Assignment",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/assignments/{{assignmentId}}/publish",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "assignments", "{{assignmentId}}", "publish"]
                        }
                    }
                },
                {
                    name: "Close Assignment",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/assignments/{{assignmentId}}/close",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "assignments", "{{assignmentId}}", "close"]
                        }
                    }
                },
                {
                    name: "Get Teaching Assignment Assignments",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/teaching-assignments/{{teachingAssignmentId}}/assignments",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "teaching-assignments", "{{teachingAssignmentId}}", "assignments"]
                        }
                    }
                },
                {
                    name: "Get Assignment Submissions",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/assignments/{{assignmentId}}/submissions",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "assignments", "{{assignmentId}}", "submissions"]
                        }
                    }
                },
                {
                    name: "Grade Submission",
                    request: {
                        method: "POST",
                        header: [
                            { key: "Content-Type", value: "application/json" },
                            { key: "Authorization", value: "Bearer {{teacherAccessToken}}" }
                        ],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/submissions/{{submissionId}}/grade",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "submissions", "{{submissionId}}", "grade"]
                        },
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({ marksAwarded: 95.0, feedback: "Great job!" }, null, 4)
                        }
                    }
                },
                {
                    name: "Get Submission File",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/submissions/{{submissionId}}/file",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "submissions", "{{submissionId}}", "file"]
                        }
                    }
                }
            ]
        },
        {
            name: "2. Teacher Exams",
            item: [
                {
                    name: "Create Exam",
                    request: {
                        method: "POST",
                        header: [
                            { key: "Content-Type", value: "application/json" },
                            { key: "Authorization", value: "Bearer {{teacherAccessToken}}" }
                        ],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/exams",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "exams"]
                        },
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                teachingAssignmentId: 1,
                                title: "Midterm Exam",
                                instructions: "No calculators allowed.",
                                startTime: "2026-06-01T10:00:00Z",
                                endTime: "2026-06-01T12:00:00Z",
                                durationMinutes: 60
                            }, null, 4)
                        }
                    },
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "var j = pm.response.json();",
                                    "if(j.examId) pm.environment.set('examId', j.examId);"
                                ]
                            }
                        }
                    ]
                },
                {
                    name: "Add MCQ Question",
                    request: {
                        method: "POST",
                        header: [
                            { key: "Content-Type", value: "application/json" },
                            { key: "Authorization", value: "Bearer {{teacherAccessToken}}" }
                        ],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/exams/{{examId}}/questions",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "exams", "{{examId}}", "questions"]
                        },
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                type: "MCQ",
                                text: "What is 2+2?",
                                marks: 5.0,
                                difficulty: "Easy",
                                order: 1,
                                correctAnswer: "A",
                                options: [
                                    { label: "A", text: "4" },
                                    { label: "B", text: "5" }
                                ]
                            }, null, 4)
                        }
                    },
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "var j = pm.response.json();",
                                    "if(j.questionId) pm.environment.set('questionId', j.questionId);"
                                ]
                            }
                        }
                    ]
                },
                {
                    name: "Update Question",
                    request: {
                        method: "PUT",
                        header: [
                            { key: "Content-Type", value: "application/json" },
                            { key: "Authorization", value: "Bearer {{teacherAccessToken}}" }
                        ],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/exams/{{examId}}/questions/{{questionId}}",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "exams", "{{examId}}", "questions", "{{questionId}}"]
                        },
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({
                                type: "MCQ",
                                text: "What is 3+3?",
                                marks: 10.0,
                                difficulty: "Medium",
                                order: 1,
                                correctAnswer: "A",
                                options: [
                                    { label: "A", text: "6" },
                                    { label: "B", text: "9" }
                                ]
                            }, null, 4)
                        }
                    }
                },
                {
                    name: "Delete Question",
                    request: {
                        method: "DELETE",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/exams/{{examId}}/questions/{{questionId}}",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "exams", "{{examId}}", "questions", "{{questionId}}"]
                        }
                    }
                },
                {
                    name: "Publish Exam",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/exams/{{examId}}/publish",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "exams", "{{examId}}", "publish"]
                        }
                    }
                },
                {
                    name: "Get Teaching Assignment Exams",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/teaching-assignments/{{teachingAssignmentId}}/exams",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "teaching-assignments", "{{teachingAssignmentId}}", "exams"]
                        }
                    }
                }
            ]
        },
        {
            name: "3. Teacher Grading Dashboard",
            item: [
                {
                    name: "Get Pending Grading",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/grading/pending",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "grading", "pending"]
                        }
                    }
                },
                {
                    name: "Get Student Answers For Review",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{teacherAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/grading/student-exams/{{studentExamId}}",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "grading", "student-exams", "{{studentExamId}}"]
                        }
                    }
                },
                {
                    name: "Grade Student Answer",
                    request: {
                        method: "POST",
                        header: [
                            { key: "Content-Type", value: "application/json" },
                            { key: "Authorization", value: "Bearer {{teacherAccessToken}}" }
                        ],
                        url: {
                            raw: "{{baseUrl}}/api/teacher/assessment/grading/answers/{{answerId}}",
                            host: ["{{baseUrl}}"],
                            path: ["api", "teacher", "assessment", "grading", "answers", "{{answerId}}"]
                        },
                        body: {
                            mode: "raw",
                            raw: JSON.stringify({ marksAwarded: 10.0, feedback: "Correct working." }, null, 4)
                        }
                    }
                }
            ]
        },
        {
            name: "4. Student Assessment",
            item: [
                {
                    name: "Get Subject Assignments",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/subjects/{{subjectId}}/assignments",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "subjects", "{{subjectId}}", "assignments"]
                        }
                    }
                },
                {
                    name: "Submit Assignment",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/assignments/{{assignmentId}}/submit",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "assignments", "{{assignmentId}}", "submit"]
                        },
                        body: {
                            mode: "formdata",
                            formdata: [
                                { key: "TextContent", value: "Here is my answer to the assignment.", type: "text" }
                            ]
                        }
                    }
                },
                {
                    name: "Get Subject Exams",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/subjects/{{subjectId}}/exams",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "subjects", "{{subjectId}}", "exams"]
                        }
                    }
                },
                {
                    name: "Start Exam",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/exams/{{examId}}/start",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "exams", "{{examId}}", "start"]
                        }
                    },
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "var j = pm.response.json();",
                                    "if(j.studentExamId) pm.environment.set('studentExamId', j.studentExamId);"
                                ]
                            }
                        }
                    ]
                },
                {
                    name: "Save Answer",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/student-exams/{{studentExamId}}/answers",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "student-exams", "{{studentExamId}}", "answers"]
                        },
                        body: {
                            mode: "formdata",
                            formdata: [
                                { key: "QuestionId", value: "{{questionId}}", type: "text" },
                                { key: "SelectedOptionId", value: "A", type: "text" }
                            ]
                        }
                    }
                },
                {
                    name: "Submit Exam",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/student-exams/{{studentExamId}}/submit",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "student-exams", "{{studentExamId}}", "submit"]
                        }
                    }
                },
                {
                    name: "Get Exam Result",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/student-exams/{{studentExamId}}/result",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "student-exams", "{{studentExamId}}", "result"]
                        }
                    }
                },
                {
                    name: "Get My Performance",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{studentAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/student/assessment/performance",
                            host: ["{{baseUrl}}"],
                            path: ["api", "student", "assessment", "performance"],
                            query: [
                                { key: "academicYear", value: "{{academicYear}}" }
                            ]
                        }
                    }
                }
            ]
        },
        {
            name: "5. Admin Performance",
            item: [
                {
                    name: "Get Class Performance Report",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{adminAccessToken}}" }],
                        url: {
                            raw: "{{baseUrl}}/api/admin/performance/classes/{{classId}}/subjects/{{subjectId}}",
                            host: ["{{baseUrl}}"],
                            path: ["api", "admin", "performance", "classes", "{{classId}}", "subjects", "{{subjectId}}"],
                            query: [
                                { key: "academicYear", value: "{{academicYear}}" }
                            ]
                        }
                    }
                }
            ]
        }
    ]
};

fs.writeFileSync('Masarak_Phase3.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Full Phase 3 Collection generated successfully.');
