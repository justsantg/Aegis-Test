const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('cambridge_token');
    } catch {}
  }
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
      if (Array.isArray(errorMsg)) errorMsg = errorMsg.join(', ');
    } catch {
      // fallback to status text
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export interface AuthUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  studentCode?: string;
  role: {
    id: number;
    name: 'Admin' | 'Teacher' | 'Student' | string;
  };
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: AuthUser;
}

export interface Level {
  id: number;
  name: string;
  orderIndex: number;
  levelType: 'REGULAR' | 'TRAINING' | 'TRAINING_APTIS';
  code?: string;
  hasFinalExam?: boolean;
}

export interface Course {
  id: string;
  courseName: string;
  courseModality: 'REGULAR_GROUP' | 'PERSONALIZED_1ON1' | 'SEMI_PERSONALIZED';
  scheduleDays: string[];
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  startTime?: string;
  endTime?: string;
  classroom?: string;
  term?: string;
  maxCapacity?: number;
  capacity?: number;
  level: Level;
  teacher?: {
    id: number;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    phoneNumber?: string | null;
  };
  enrollments?: any[];
}

export interface QuestionOption {
  id: string;
  content: string;
  blankId?: number | null;
  // Anti-cheat: isCorrect and correctPosition are never returned to student
  isCorrect?: boolean;
  correctPosition?: number | null;
}

export interface Question {
  id: string;
  type: 'ICFES_MULTIPLE_CHOICE' | 'SENTENCE_SCRAMBLE' | 'FILL_IN_BLANK' | 'SENTENCE_COMPLETION';
  prompt: string;
  contextText?: string | null;
  points: number;
  blockNumber: number;
  orderIndex?: number;
  orderInBlock?: number;
  options: QuestionOption[];
}

export interface ExamTemplate {
  id: string;
  title: string;
  description?: string;
  examType: 'MIDTERM' | 'FINAL';
  durationMinutes: number;
  level: Level;
  course?: Course | null;
  createdBy?: AuthUser | null;
  questions?: Question[];
}

export interface SessionJoinResponse {
  sessionId: string;
  sessionPin: string;
  courseName: string;
  examTitle: string;
  mode: 'FREE_PACE' | 'SYNC_BLOCKS' | 'PAPER_OMR';
  currentBlock: number;
  durationMinutes: number;
  student?: {
    id: number;
    fullName: string;
    studentCode?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
  questions: Question[];
}

export interface AttendeeMonitorData {
  attendeeId: string;
  studentId: number;
  fullName: string;
  studentCode?: string;
  phoneNumber?: string;
  email?: string;
  attendanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT';
  whatsappNotified: boolean;
  whatsappLink: string | null;
  totalScore: number | null;
  focusLossCount?: number;
  startedAt?: string | null;
  submittedAt?: string | null;
}

export interface SecurityIncident {
  id: string;
  studentId: number;
  studentName: string;
  studentCode: string;
  incidentType: string;
  details: string;
  incidentNumber: number;
  createdAt: string;
}

export interface MonitorDashboardResponse {
  sessionId: string;
  sessionPin: string;
  mode: 'FREE_PACE' | 'SYNC_BLOCKS' | 'PAPER_OMR';
  status: 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  currentBlock: number;
  startedAt: string;
  summary: {
    total: number;
    present: number;
    pendingOrAbsent: number;
    totalInfractions?: number;
    studentsWithInfractions?: number;
  };
  attendees: AttendeeMonitorData[];
  securityIncidents?: SecurityIncident[];
}

export interface SubmitResultResponse {
  message: string;
  studentId: number;
  totalScore: number;
  totalQuestionsEvaluated: number;
}

export interface TeacherData {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  studentCode?: string | null;
  status: { id: number; name: string };
  assignedCoursesCount: number;
  courses: {
    id: string;
    courseName: string;
    levelName: string;
    scheduleDays: string[];
    startTime: string;
    endTime: string;
    enrolledCount: number;
  }[];
}

export interface RegisteredStudentData {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  studentCode?: string | null;
  status: { id: number; name: string };
  createdAt: string;
  enrolledCoursesCount: number;
  enrolledCourses: {
    id: string;
    courseName: string;
    levelId?: number;
    levelCode?: string;
    levelName?: string;
    levelType?: string;
    teacherId?: number;
    courseModality?: string;
    scheduleDays?: string[];
    startTime?: string;
    endTime?: string;
  }[];
}

export interface CreateTeacherPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
}

export interface StudentRegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  studentCode?: string;
}

export interface StudentExamRecordItem {
  hasExam: boolean;
  isAptis?: boolean;
  attended: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT' | 'APTIS_OFFICIAL';
  score: number | null;
  submittedAt: string | null;
  sessionId: string | null;
  sessionPin: string | null;
  examTitle: string;
  focusLossCount: number;
  isMakeup: boolean;
  note?: string | null;
}

export interface PhaseRecord {
  levelId: number;
  code: string;
  name: string;
  levelType: 'REGULAR' | 'TRAINING_APTIS';
  hasFinalExam: boolean;
  orderIndex: number;
  isCurrentLevel: boolean;
  phaseStatus: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  phaseAverage: number | null;
  midterm: StudentExamRecordItem;
  final: StudentExamRecordItem;
}

export interface StudentAcademicRecordResponse {
  student: {
    id: number;
    firstName?: string;
    lastName?: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    studentCode?: string;
  };
  currentCourse: {
    enrollmentId: string;
    courseId: string;
    courseName: string;
    courseModality: string;
    scheduleDays: string[];
    startTime?: string;
    endTime?: string;
    classroom?: string;
    level?: Level | null;
    teacher?: {
      id: number;
      fullName: string;
      email: string;
    } | null;
  } | null;
  enrolledCourses: Array<{
    enrollmentId: string;
    courseId: string;
    courseName: string;
    courseModality: string;
    scheduleDays: string[];
    startTime?: string;
    endTime?: string;
    classroom?: string;
    level?: Level | null;
    teacher?: {
      id: number;
      fullName: string;
      email: string;
    } | null;
  }>;
  summary: {
    currentLevelCode: string | null;
    currentLevelName: string;
    totalExamsTaken: number;
    generalAverage: number | null;
    completedPhasesCount: number;
    totalPhases: number;
  };
  phases: PhaseRecord[];
}

export interface CreateCoursePayload {
  levelId: number;
  teacherId?: number;
  courseName: string;
  courseModality: 'REGULAR_GROUP' | 'PERSONALIZED_1ON1' | 'SEMI_PERSONALIZED';
  capacity: number;
  scheduleDays: string[];
  startTime: string;
  endTime: string;
  classroom?: string;
  term?: string;
}

export interface TeacherAuditStudent {
  studentId: number;
  fullName: string;
  studentCode?: string;
  phoneNumber?: string;
  attendanceStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABSENT';
  whatsappNotified: boolean;
  totalScore: number | string | null;
  submittedAt?: string | null;
}

export interface TeacherAuditSession {
  sessionId: string;
  sessionPin: string;
  status: 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  mode: 'FREE_PACE' | 'SYNC_BLOCKS' | 'PAPER_OMR';
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
  teacher: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
  };
  course: {
    id: string;
    courseName: string;
    courseModality: string;
    levelName: string;
    scheduleDays: string[];
    startTime: string;
    endTime: string;
  };
  examTemplate: {
    id: string;
    title: string;
    examType: 'MIDTERM' | 'FINAL';
    totalQuestions: number;
    durationMinutes: number;
  };
  metrics: {
    totalEnrolled: number;
    presentCount: number;
    absentCount: number;
    completedCount: number;
    attendanceRate: number;
    averageScore: number | null;
  };
  students: TeacherAuditStudent[];
}

export interface TeacherAuditMetricsResponse {
  summary: {
    totalSessions: number;
    totalEnrolled: number;
    totalPresent: number;
    totalAbsent: number;
    overallAttendanceRate: number;
    averageScoreOverall: number | null;
  };
  sessions: TeacherAuditSession[];
}

export const api = {
  async getCourses(
    params?:
      | { day?: string; teacherId?: number; isActive?: boolean }
      | string,
  ): Promise<Course[]> {
    let q = '';
    if (typeof params === 'string') {
      q = params ? `?day=${encodeURIComponent(params)}` : '';
    } else if (params) {
      const searchParams = new URLSearchParams();
      if (params.day) searchParams.append('day', params.day);
      if (params.teacherId)
        searchParams.append('teacherId', params.teacherId.toString());
      if (params.isActive !== undefined)
        searchParams.append('isActive', params.isActive.toString());
      const queryStr = searchParams.toString();
      if (queryStr) q = `?${queryStr}`;
    }
    const res = await request<any>(`/courses${q}`);
    return Array.isArray(res) ? res : res.data || [];
  },

  async getCourseRoster(courseId: string) {
    return request<any>(`/courses/${courseId}/roster`);
  },

  async getTemplates(
    levelId?: number,
    courseId?: string,
  ): Promise<ExamTemplate[]> {
    const params = new URLSearchParams();
    if (levelId) params.append('levelId', levelId.toString());
    if (courseId) params.append('courseId', courseId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request<ExamTemplate[]>(`/exams/templates${q}`);
  },

  async parsePptx(file: File): Promise<{
    suggestedTitle: string;
    totalQuestions: number;
    questions: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>('/exams/parse-pptx', {
      method: 'POST',
      body: formData,
    });
  },

  async parseText(text: string): Promise<{
    suggestedTitle: string;
    totalQuestions: number;
    questions: any[];
  }> {
    return request<any>('/exams/parse-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async getTemplate(id: string): Promise<ExamTemplate> {
    return request<ExamTemplate>(`/exams/templates/${id}`);
  },

  async createExamTemplate(payload: {
    levelId: number;
    courseId?: string;
    title: string;
    description?: string;
    examType: 'MIDTERM' | 'FINAL';
    durationMinutes: number;
    questions: any[];
  }): Promise<ExamTemplate> {
    return request<ExamTemplate>('/exams/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateExamTemplate(
    id: string,
    payload: {
      levelId: number;
      courseId?: string;
      title: string;
      description?: string;
      examType: 'MIDTERM' | 'FINAL';
      durationMinutes: number;
      questions: any[];
    },
  ): Promise<ExamTemplate> {
    return request<ExamTemplate>(`/exams/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteExamTemplate(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `/exams/templates/${id}`,
      {
        method: 'DELETE',
      },
    );
  },

  async createSession(payload: {
    courseId: string;
    examTemplateId: string;
    mode: 'FREE_PACE' | 'SYNC_BLOCKS' | 'PAPER_OMR';
  }) {
    return request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async joinSession(payload: { sessionPin: string; studentId: number }): Promise<SessionJoinResponse> {
    return request<SessionJoinResponse>('/sessions/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getSession(sessionId: string) {
    return request<any>(`/sessions/${sessionId}`);
  },

  async getMonitorDashboard(sessionId: string): Promise<MonitorDashboardResponse> {
    return request<MonitorDashboardResponse>(`/sessions/${sessionId}/monitor`);
  },

  async advanceBlock(sessionId: string) {
    return request<any>(`/sessions/${sessionId}/advance-block`, {
      method: 'POST',
    });
  },

  async recordInfraction(
    sessionId: string,
    studentId: number,
    payload?: { incidentType?: string; details?: string },
  ) {
    return request<{ success: boolean; focusLossCount: number; message: string }>(
      `/sessions/${sessionId}/infraction`,
      {
        method: 'POST',
        body: JSON.stringify({ studentId, ...payload }),
      },
    );
  },

  async submitExam(
    sessionId: string,
    payload: {
      studentId: number;
      answers: { questionId: string; response: any }[];
    }
  ): Promise<SubmitResultResponse> {
    return request<SubmitResultResponse>(`/sessions/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email: string; password: string }): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/email/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async studentRegister(payload: StudentRegisterPayload): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/student/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async finishSession(sessionId: string) {
    return request<any>(`/sessions/${sessionId}/finish`, {
      method: 'POST',
    });
  },

  async getLevels(): Promise<Level[]> {
    const res = await request<any>('/levels');
    return Array.isArray(res) ? res : res.data || [];
  },

  async getStudents(): Promise<RegisteredStudentData[]> {
    const res = await request<any>('/courses/students');
    return Array.isArray(res) ? res : [];
  },

  async enrollStudent(courseId: string, studentId: number): Promise<any> {
    return request<any>(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  },

  async unenrollStudent(courseId: string, studentId: number): Promise<any> {
    return request<any>(`/courses/${courseId}/enroll/${studentId}`, {
      method: 'DELETE',
    });
  },

  async getTeachers(): Promise<TeacherData[]> {
    const res = await request<any>('/courses/teachers');
    return Array.isArray(res) ? res : [];
  },

  async createTeacher(payload: CreateTeacherPayload): Promise<any> {
    return request<any>('/courses/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createCourse(payload: CreateCoursePayload): Promise<Course> {
    return request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteCourse(courseId: string): Promise<any> {
    return request<any>(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  },

  async getTeacherAuditMetrics(filters?: {
    teacherId?: number;
    examType?: string;
    courseId?: string;
  }): Promise<TeacherAuditMetricsResponse> {
    const params = new URLSearchParams();
    if (filters?.teacherId) params.append('teacherId', String(filters.teacherId));
    if (filters?.examType) params.append('examType', filters.examType);
    if (filters?.courseId) params.append('courseId', filters.courseId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return request<TeacherAuditMetricsResponse>(`/sessions/teacher-metrics${q}`);
  },

  async getStudentAcademicRecord(studentId: number): Promise<StudentAcademicRecordResponse> {
    return request<StudentAcademicRecordResponse>(`/sessions/student/${studentId}/academic-record`);
  },
};
