export interface UserProfile {
  uid: string;
  id: string;
  phone: string;
  role: 'student' | 'staff';
  name: string;
  email: string;
  isCounselor?: boolean;
  specialization?: string;
  bio?: string;
  createdAt: string;
}

export interface Assessment {
  id?: string;
  studentUid: string;
  score: number;
  riskLevel: 'low' | 'moderate' | 'high';
  stressLevel: number;
  moodPattern: string;
  sleepQuality: number;
  responses: any[];
  timestamp: string;
}

export interface Appointment {
  id?: string;
  studentUid: string;
  studentName: string;
  counselorUid: string;
  counselorName: string;
  dateTime: string;
  preferredTime: string;
  mode: 'call' | 'video' | 'in-person';
  status: 'pending' | 'confirmed' | 'rejected';
  details: string;
  createdAt: string;
}

export interface SOSAlert {
  id?: string;
  studentUid: string;
  studentName: string;
  timestamp: string;
  status: 'active' | 'resolved';
}
