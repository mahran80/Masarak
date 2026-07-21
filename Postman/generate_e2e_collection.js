const fs = require('fs');

const env = {
  id: 'e2e-env',
  name: 'Masarak_E2E_Environment',
  values: [
    { key: 'baseUrl', value: 'https://localhost:49179', type: 'default', enabled: true },
    { key: 'adminEmail', value: 'admin@masarak.com', type: 'default', enabled: true },
    { key: 'adminPassword', value: 'Admin@12345!', type: 'default', enabled: true },
    { key: 'teacherEmail', value: 'teacher@example.com', type: 'default', enabled: true },
    { key: 'teacherPassword', value: 'Teacher@123', type: 'default', enabled: true },
    { key: 'studentEmail', value: 'student@example.com', type: 'default', enabled: true },
    { key: 'studentPassword', value: 'Student@123', type: 'default', enabled: true },
    { key: 'academicYear', value: '2026', type: 'default', enabled: true }
  ],
  _postman_variable_scope: 'environment'
};

const collection = {
  info: {
    name: 'Masarak End-to-End Flow',
    description: 'Executes the complete business flow from setup to grading with dynamic variables.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  item: [
    {
      name: '1. Authentication Flow',
      item: [
        {
          name: 'Login Admin',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] },
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{adminEmail}}', password: '{{adminPassword}}' }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.accessToken) pm.environment.set(\'adminAccessToken\', j.accessToken);'] } }]
        },
        {
          name: 'Login Teacher',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] },
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{teacherEmail}}', password: '{{teacherPassword}}' }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.accessToken) pm.environment.set(\'teacherAccessToken\', j.accessToken);', 'if(j.user && j.user.userId) pm.environment.set(\'teacherUserId\', j.user.userId);'] } }]
        },
        {
          name: 'Login Student',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] },
            body: { mode: 'raw', raw: JSON.stringify({ email: '{{studentEmail}}', password: '{{studentPassword}}' }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.accessToken) pm.environment.set(\'studentAccessToken\', j.accessToken);', 'if(j.user && j.user.userId) pm.environment.set(\'studentUserId\', j.user.userId);'] } }]
        }
      ]
    },
    {
      name: '2. Admin Setup Flow',
      item: [
        {
          name: 'Create Grade',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{adminAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/grades', host: ['{{baseUrl}}'], path: ['api', 'admin', 'grades'] },
            body: { mode: 'raw', raw: JSON.stringify({ name: 'Grade 10 E2E', level: 10, description: 'E2E testing' }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.gradeId) pm.environment.set(\'gradeId\', j.gradeId);'] } }]
        },
        {
          name: 'Create Subject',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{adminAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/subjects', host: ['{{baseUrl}}'], path: ['api', 'admin', 'subjects'] },
            body: { mode: 'raw', raw: JSON.stringify({ gradeId: '{{gradeId}}', name: 'Math E2E', description: 'E2E Subject' }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.subjectId) pm.environment.set(\'subjectId\', j.subjectId);'] } }]
        },
        {
          name: 'Create Class',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{adminAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/classes', host: ['{{baseUrl}}'], path: ['api', 'admin', 'classes'] },
            body: { mode: 'raw', raw: JSON.stringify({ gradeId: '{{gradeId}}', name: '10-A E2E', academicYear: parseInt('2026'), maxCapacity: 30 }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.classId) pm.environment.set(\'classId\', j.classId);'] } }]
        },
        {
          name: 'Assign Teacher',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{adminAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/teaching-assignments', host: ['{{baseUrl}}'], path: ['api', 'admin', 'teaching-assignments'] },
            body: { mode: 'raw', raw: JSON.stringify({ teacherId: '{{teacherUserId}}', classId: '{{classId}}', subjectId: '{{subjectId}}', academicYear: parseInt('2026') }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.assignmentId) pm.environment.set(\'teachingAssignmentId\', j.assignmentId);'] } }]
        },
        {
          name: 'Enroll Student',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{adminAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/admin/enrollments', host: ['{{baseUrl}}'], path: ['api', 'admin', 'enrollments'] },
            body: { mode: 'raw', raw: JSON.stringify({ studentId: '{{studentUserId}}', classId: '{{classId}}', academicYear: parseInt('2026') }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.id) pm.environment.set(\'enrollmentId\', j.id);'] } }]
        }
      ]
    },
    {
      name: '3. Teacher Assignment Flow',
      item: [
        {
          name: 'Create Assignment',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{teacherAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/assessment/assignments', host: ['{{baseUrl}}'], path: ['api', 'teacher', 'assessment', 'assignments'] },
            body: { mode: 'raw', raw: JSON.stringify({ teachingAssignmentId: '{{teachingAssignmentId}}', title: 'Math Homework 1', instructions: 'Solve E2E', dueDate: '2026-12-31T23:59:59Z', maxScore: 100 }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.assignmentId) pm.environment.set(\'assignmentId\', j.assignmentId);'] } }]
        },
        {
          name: 'Publish Assignment',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{teacherAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/assessment/assignments/{{assignmentId}}/publish', host: ['{{baseUrl}}'], path: ['api', 'teacher', 'assessment', 'assignments', '{{assignmentId}}', 'publish'] }
          }
        }
      ]
    },
    {
      name: '4. Student Assignment Flow',
      item: [
        {
          name: 'Submit Assignment',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{studentAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/student/assessment/assignments/{{assignmentId}}/submit', host: ['{{baseUrl}}'], path: ['api', 'student', 'assessment', 'assignments', '{{assignmentId}}', 'submit'] },
            body: { mode: 'formdata', formdata: [{ key: 'TextContent', value: 'Here is my answer to the E2E assignment.', type: 'text' }] }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.submissionId) pm.environment.set(\'submissionId\', j.submissionId);'] } }]
        }
      ]
    },
    {
      name: '5. Teacher Grading Flow',
      item: [
        {
          name: 'Get Submissions',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{teacherAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/assessment/assignments/{{assignmentId}}/submissions', host: ['{{baseUrl}}'], path: ['api', 'teacher', 'assessment', 'assignments', '{{assignmentId}}', 'submissions'] }
          }
        },
        {
          name: 'Grade Submission',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{teacherAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/assessment/submissions/{{submissionId}}/grade', host: ['{{baseUrl}}'], path: ['api', 'teacher', 'assessment', 'submissions', '{{submissionId}}', 'grade'] },
            body: { mode: 'raw', raw: JSON.stringify({ marksAwarded: 95.0, feedback: 'Excellent work!' }, null, 4) }
          }
        }
      ]
    },
    {
      name: '6. Teacher Exam Flow',
      item: [
        {
          name: 'Create Exam',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{teacherAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/assessment/exams', host: ['{{baseUrl}}'], path: ['api', 'teacher', 'assessment', 'exams'] },
            body: { mode: 'raw', raw: JSON.stringify({ teachingAssignmentId: '{{teachingAssignmentId}}', title: 'Midterm E2E', instructions: 'No calculators', startTime: '2026-06-01T10:00:00Z', endTime: '2026-06-01T12:00:00Z', durationMinutes: 60 }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.examId) pm.environment.set(\'examId\', j.examId);'] } }]
        },
        {
          name: 'Add Question',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{teacherAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/assessment/exams/{{examId}}/questions', host: ['{{baseUrl}}'], path: ['api', 'teacher', 'assessment', 'exams', '{{examId}}', 'questions'] },
            body: { mode: 'raw', raw: JSON.stringify({ type: 'MCQ', text: 'What is 2+2?', marks: 10, difficulty: 'Easy', order: 1, correctAnswer: 'A', options: [{ label: 'A', text: '4' }, { label: 'B', text: '5' }] }, null, 4) }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.questionId) pm.environment.set(\'questionId\', j.questionId);'] } }]
        },
        {
          name: 'Publish Exam',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{teacherAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/teacher/assessment/exams/{{examId}}/publish', host: ['{{baseUrl}}'], path: ['api', 'teacher', 'assessment', 'exams', '{{examId}}', 'publish'] }
          }
        }
      ]
    },
    {
      name: '7. Student Exam Flow',
      item: [
        {
          name: 'Start Exam',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{studentAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/student/assessment/exams/{{examId}}/start', host: ['{{baseUrl}}'], path: ['api', 'student', 'assessment', 'exams', '{{examId}}', 'start'] }
          },
          event: [{ listen: 'test', script: { exec: ['var j = pm.response.json();', 'if(j.studentExamId) pm.environment.set(\'studentExamId\', j.studentExamId);'] } }]
        },
        {
          name: 'Save Answer',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{studentAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/student/assessment/student-exams/{{studentExamId}}/answers', host: ['{{baseUrl}}'], path: ['api', 'student', 'assessment', 'student-exams', '{{studentExamId}}', 'answers'] },
            body: { mode: 'formdata', formdata: [{ key: 'QuestionId', value: '{{questionId}}', type: 'text' }, { key: 'SelectedOptionId', value: 'A', type: 'text' }] }
          }
        },
        {
          name: 'Submit Exam',
          request: {
            method: 'POST',
            header: [{ key: 'Authorization', value: 'Bearer {{studentAccessToken}}' }],
            url: { raw: '{{baseUrl}}/api/student/assessment/student-exams/{{studentExamId}}/submit', host: ['{{baseUrl}}'], path: ['api', 'student', 'assessment', 'student-exams', '{{studentExamId}}', 'submit'] }
          }
        }
      ]
    }
  ]
};

const preRequestScript = `
if (pm.request.body && pm.request.body.mode === 'raw') {
  let reqBody = pm.request.body.raw;
  // Replace stringified variables with actual integers for DTO validation
  reqBody = reqBody.replace(/"{{teachingAssignmentId}}"/g, parseInt(pm.environment.get('teachingAssignmentId')));
  reqBody = reqBody.replace(/"{{teacherUserId}}"/g, parseInt(pm.environment.get('teacherUserId')));
  reqBody = reqBody.replace(/"{{studentUserId}}"/g, parseInt(pm.environment.get('studentUserId')));
  reqBody = reqBody.replace(/"{{gradeId}}"/g, parseInt(pm.environment.get('gradeId')));
  reqBody = reqBody.replace(/"{{classId}}"/g, parseInt(pm.environment.get('classId')));
  reqBody = reqBody.replace(/"{{subjectId}}"/g, parseInt(pm.environment.get('subjectId')));
  pm.request.body.raw = reqBody;
}
`;

collection.event = [
  { listen: 'prerequest', script: { type: 'text/javascript', exec: preRequestScript.split('\\n') } }
];

fs.writeFileSync('Masarak_E2E_Collection.json', JSON.stringify(collection, null, 2));
fs.writeFileSync('Masarak_E2E_Environment.json', JSON.stringify(env, null, 2));
console.log('Successfully generated Masarak E2E Postman Collection and Environment.');
