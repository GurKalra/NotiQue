// src/config/mockData.ts — Mock API responses for development
// Used when BASE_URL is not ready. Replace with real API calls when backend is deployed.

export const mockFeed = {
  cards: [
    // ─── Today — ACTION ────────────────────────────────────────────────
    {
      id: 'a1',
      type: 'ACTION' as const,
      importance: 'high' as const,
      title: 'Submit DBMS Assignment',
      description: 'Upload ER diagram on Google Classroom before midnight.',
      source: 'whatsapp' as const,
      sourceGroup: 'CSE-A 2025',
      studentMentioned: true,
      reminderCount: 3,
      deadline: new Date().toISOString(),
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'a2',
      type: 'ACTION' as const,
      importance: 'medium' as const,
      title: 'Prepare for Maths Tutorial',
      description: 'Review Integration by Parts before class tomorrow.',
      source: 'classroom' as const,
      sourceGroup: 'Prof. Sharma',
      studentMentioned: false,
      reminderCount: 1,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    {
      id: 'a3',
      type: 'ACTION' as const,
      importance: 'high' as const,
      title: 'Complete OS Lab Record',
      description: 'Write up last two experiments before submission.',
      source: 'whatsapp' as const,
      sourceGroup: 'CSE-A 2025',
      studentMentioned: true,
      reminderCount: 2,
      deadline: new Date().toISOString(),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'a4',
      type: 'ACTION' as const,
      importance: 'low' as const,
      title: 'Revise Aptitude Concepts',
      description: 'Placement drive next Friday — revise quantitative aptitude.',
      source: 'whatsapp' as const,
      sourceGroup: 'Placement Cell',
      studentMentioned: false,
      reminderCount: 1,
      deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    },
    {
      id: 'a5',
      type: 'ACTION' as const,
      importance: 'low' as const,
      title: 'Read CN Chapter 4',
      description: 'Network layer — OSI model coverage before next class.',
      source: 'whatsapp' as const,
      sourceGroup: 'CSE-A 2025',
      studentMentioned: false,
      reminderCount: 1,
      deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    // ─── Today — INFO ───────────────────────────────────────────────────
    {
      id: 'i1',
      type: 'INFO' as const,
      importance: 'high' as const,
      title: 'Operating Systems Lab Cancelled',
      description: "Today's OS lab session is cancelled due to maintenance.",
      source: 'whatsapp' as const,
      sourceGroup: 'CSE-A 2025',
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'i2',
      type: 'INFO' as const,
      importance: 'medium' as const,
      title: 'Database Management Systems',
      description: "Today's DBMS class is moved to Room 304 at 2:00 PM.",
      source: 'whatsapp' as const,
      sourceGroup: 'CSE-A 2025',
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'i3',
      type: 'INFO' as const,
      importance: 'low' as const,
      title: 'Maths Tutorial Rescheduled',
      description: 'Maths tutorial is rescheduled to tomorrow at 11:00 AM.',
      source: 'gmail' as const,
      sourceGroup: 'Prof. Sharma',
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    },
    // ─── Yesterday — INFO ──────────────────────────────────────────────
    {
      id: 'i4',
      type: 'INFO' as const,
      importance: 'low' as const,
      title: 'CN Lecture Completed',
      description: "Computer Networks lecture on Transport Layer is completed.",
      source: 'whatsapp' as const,
      sourceGroup: 'CSE-A 2025',
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date(Date.now() - 86400000 - 4 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: 'i5',
      type: 'INFO' as const,
      importance: 'medium' as const,
      title: 'Project Demo Announcement',
      description: 'Project demo for all groups will be conducted on May 20.',
      source: 'gmail' as const,
      sourceGroup: 'Prof. Sharma',
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date(Date.now() - 86400000 - 8 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    },
    // ─── This Week — INFO ──────────────────────────────────────────────
    {
      id: 'i6',
      type: 'INFO' as const,
      importance: 'low' as const,
      title: 'Library Timing Update',
      description: 'Library will remain open till 10:00 PM during exam week.',
      source: 'whatsapp' as const,
      sourceGroup: 'Library',
      studentMentioned: false,
      reminderCount: 1,
      deadline: null,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 4).toISOString(),
    },
  ],
  count: 11,
};




export const mockProfile = {
  userId: 'mock-user-123',
  name: 'Yatharth Gupta',
  email: 'yg6222@srmist.edu.in',
  sources: {
    whatsapp: true,
    gmail: true,
    classroom: true,
  },
};

export const mockGroups = [
  { id: '1', name: 'CSE-A 2025', participants: 67, tracked: false },
  { id: '2', name: 'CN Lab Group', participants: 23, tracked: false },
  { id: '3', name: 'Placement Cell', participants: 89, tracked: false },
  { id: '4', name: 'Hostel Block C', participants: 34, tracked: false },
  { id: '5', name: 'F1 Fan Club 🏎️', participants: 142, tracked: false },
];

// Mock GET /settings response for Account screen
export const mockSettings = {
  trackedGroups: [
    { id: '1', name: 'CSE-A 2025', tracked: true },
    { id: '2', name: 'CN Lab Group', tracked: true },
    { id: '3', name: 'Placement Cell', tracked: false },
  ],
  notifications: {
    high: true,   // always true, non-interactive
    medium: true,
    low: false,
  },
};

// ─── Mock GET /todos response ─────────────────────────────────────────────
// Replace with real GET /todos call when BASE_URL is ready.

const now = Date.now();
const d = (offsetMs: number) => new Date(now + offsetMs).toISOString();

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  deadline: string;
  importance: 'high' | 'medium' | 'low';
  source: 'whatsapp' | 'gmail' | 'classroom' | 'manual';
  sourceGroup: string;
  autoTrackable: boolean;
  classroomCourseId: string | null;
  classroomAssignmentId: string | null;
  reminderCount: number;
  completedAt: string | null;
  createdAt: string;
  /** true = added by the student manually, not extracted by AI */
  userAdded?: boolean;
}

export const mockTodos: { todos: TodoItem[] } = {
  todos: [
    // ── Today (pending) ────────────────────────────────────────────────
    {
      id: 't1',
      title: 'Submit DBMS Assignment',
      description: 'Upload ER diagram and normalization sheet on GCR.',
      subject: 'Database Management',
      deadline: d(3 * 60 * 60 * 1000),          // 3 hrs from now
      importance: 'high',
      source: 'classroom',
      sourceGroup: 'Prof. Sharma',
      autoTrackable: true,
      classroomCourseId: 'course-123',
      classroomAssignmentId: 'assign-456',
      reminderCount: 3,
      completedAt: null,
      createdAt: d(-5 * 60 * 60 * 1000),
    },
    {
      id: 't2',
      title: 'Maths Tutorial Submission',
      description: 'Integration by Parts worksheet — soft copy on Teams.',
      subject: 'Mathematics',
      deadline: d(5 * 60 * 60 * 1000),          // 5 hrs from now
      importance: 'medium',
      source: 'whatsapp',
      sourceGroup: 'CSE-A 2025',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 1,
      completedAt: null,
      createdAt: d(-3 * 60 * 60 * 1000),
    },
    // ── Upcoming ────────────────────────────────────────────────────────
    {
      id: 't3',
      title: 'Placements Aptitude Practice',
      description: 'Mock test on campus portal — 100 questions, 90 mins.',
      subject: 'Placements',
      deadline: d(2 * 24 * 60 * 60 * 1000),     // 2 days
      importance: 'low',
      source: 'whatsapp',
      sourceGroup: 'Placement Cell',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 0,
      completedAt: null,
      createdAt: d(-1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't4',
      title: 'CN Lab Record Submission',
      description: 'Submit physical lab record to lab assistant.',
      subject: 'Computer Networks',
      deadline: d(4 * 24 * 60 * 60 * 1000),     // 4 days
      importance: 'high',
      source: 'whatsapp',
      sourceGroup: 'CN Lab Group',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 2,
      completedAt: null,
      createdAt: d(-2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't5',
      title: 'Review OS Unit 4 Notes',
      description: 'Deadlock detection and avoidance — exam in 6 days.',
      subject: 'Operating Systems',
      deadline: d(6 * 24 * 60 * 60 * 1000),
      importance: 'medium',
      source: 'gmail',
      sourceGroup: 'Dept. Notice',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 0,
      completedAt: null,
      createdAt: d(-1 * 24 * 60 * 60 * 1000),
    },
    // ── Overdue ─────────────────────────────────────────────────────────
    {
      id: 't6',
      title: 'Library Book Return',
      description: 'Return "Clean Code" to central library.',
      subject: 'Personal',
      deadline: d(-2 * 24 * 60 * 60 * 1000),    // 2 days ago
      importance: 'low',
      source: 'manual',
      sourceGroup: '',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 0,
      completedAt: null,
      createdAt: d(-5 * 24 * 60 * 60 * 1000),
      userAdded: true,
    },
    {
      id: 't7',
      title: 'Submit Feedback Form',
      description: 'End-of-semester faculty feedback on ERP portal.',
      subject: 'Admin',
      deadline: d(-1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000), // yesterday
      importance: 'medium',
      source: 'gmail',
      sourceGroup: 'SRM Admin',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 2,
      completedAt: null,
      createdAt: d(-3 * 24 * 60 * 60 * 1000),
    },
    // ── Completed ────────────────────────────────────────────────────────
    {
      id: 't8',
      title: 'Submit Mini-Project Synopsis',
      description: 'Submitted to HOD office.',
      subject: 'Project',
      deadline: d(-3 * 24 * 60 * 60 * 1000),
      importance: 'high',
      source: 'whatsapp',
      sourceGroup: 'CSE-A 2025',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 1,
      completedAt: d(-3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      createdAt: d(-7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 't9',
      title: 'Pay Exam Registration Fee',
      description: 'Paid via SRM portal.',
      subject: 'Admin',
      deadline: d(-5 * 24 * 60 * 60 * 1000),
      importance: 'medium',
      source: 'gmail',
      sourceGroup: 'SRM Admin',
      autoTrackable: false,
      classroomCourseId: null,
      classroomAssignmentId: null,
      reminderCount: 0,
      completedAt: d(-5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      createdAt: d(-8 * 24 * 60 * 60 * 1000),
    },
  ],
};

