import { supabase } from './supabase';
import type { Appointment, Assessment, SOSAlert, UserProfile } from '../types';

/* ================= USERS ================= */

export const fetchUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const upsertUserProfile = async (
  profile: UserProfile
): Promise<UserProfile> => {

  const { data, error } = await supabase
    .from('users')
    .upsert(profile, { onConflict: 'uid' })
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
) => {

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('uid', uid);

  if (error) throw error;
};

export const fetchStudents = async (): Promise<UserProfile[]> => {

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'student');

  if (error) throw error;

  return data ?? [];
};

export const fetchCounselors = async (): Promise<UserProfile[]> => {

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('iscounselor', true);

  if (error) throw error;

  return data ?? [];
};

/* ================= ASSESSMENTS ================= */

export const createAssessment = async (
  assessment: Assessment
) => {

  const { error } = await supabase
    .from('assessments')
    .insert([{
      studentuid: assessment.studentUid,
      score: assessment.score,
      risklevel: assessment.riskLevel,
      stresslevel: assessment.stressLevel,
      moodpattern: assessment.moodPattern,
      sleepquality: assessment.sleepQuality,
      responses: assessment.responses,
      timestamp: assessment.timestamp
    }]);

  if (error) throw error;
};

export const fetchAssessmentsByStudent = async (
  studentUid: string
): Promise<Assessment[]> => {

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('studentuid', studentUid)
    .order('timestamp', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(a => ({
    id: a.id,
    studentUid: a.studentuid,
    score: a.score,
    riskLevel: a.risklevel,
    stressLevel: a.stresslevel,
    moodPattern: a.moodpattern,
    sleepQuality: a.sleepquality,
    responses: a.responses,
    timestamp: a.timestamp
  }));
};

export const fetchAllAssessments = async (): Promise<Assessment[]> => {

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(a => ({
    id: a.id,
    studentUid: a.studentuid,
    score: a.score,
    riskLevel: a.risklevel,
    stressLevel: a.stresslevel,
    moodPattern: a.moodpattern,
    sleepQuality: a.sleepquality,
    responses: a.responses,
    timestamp: a.timestamp
  }));
};

/* ================= APPOINTMENTS ================= */

export const createAppointment = async (
  appointment: Appointment
) => {

  const { error } = await supabase
    .from('appointments')
    .insert([{
      studentuid: appointment.studentUid,
      studentname: appointment.studentName,
      counseloruid: appointment.counselorUid,
      counselorname: appointment.counselorName,
      datetime: appointment.dateTime,
      preferredtime: appointment.preferredTime,
      mode: appointment.mode,
      status: appointment.status,
      details: appointment.details,
      createdat: appointment.createdAt
    }]);

  if (error) throw error;
};

export const fetchAppointmentsByStudent = async (
  studentUid: string
): Promise<Appointment[]> => {

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('studentuid', studentUid)
    .order('createdat', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(a => ({
    id: a.id,
    studentUid: a.studentuid,
    studentName: a.studentname,
    counselorUid: a.counseloruid,
    counselorName: a.counselorname,
    dateTime: a.datetime,
    preferredTime: a.preferredtime,
    mode: a.mode,
    status: a.status,
    details: a.details,
    createdAt: a.createdat
  }));
};

export const fetchAppointmentsByCounselor = async (
  counselorUid: string
): Promise<Appointment[]> => {

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('counseloruid', counselorUid)
    .order('createdat', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(a => ({
    id: a.id,
    studentUid: a.studentuid,
    studentName: a.studentname,
    counselorUid: a.counseloruid,
    counselorName: a.counselorname,
    dateTime: a.datetime,
    preferredTime: a.preferredtime,
    mode: a.mode,
    status: a.status,
    details: a.details,
    createdAt: a.createdat
  }));
};

export const updateAppointmentStatus = async (
  apptId: string,
  status: 'confirmed' | 'rejected'
) => {

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', apptId);

  if (error) throw error;
};

/* ================= SOS ================= */

export const createSosAlert = async (
  alert: SOSAlert
) => {

  const { error } = await supabase
    .from('sos')
    .insert([{
      studentuid: alert.studentUid,
      studentname: alert.studentName,
      timestamp: alert.timestamp,
      status: alert.status
    }]);

  if (error) throw error;
};

export const fetchActiveSosAlerts = async (): Promise<SOSAlert[]> => {

  const { data, error } = await supabase
    .from('sos')
    .select('*')
    .eq('status', 'active')
    .order('timestamp', { ascending: false });

  if (error) throw error;

  return (data ?? []).map(s => ({
    id: s.id,
    studentUid: s.studentuid,
    studentName: s.studentname,
    timestamp: s.timestamp,
    status: s.status
  }));
};

export const updateSosStatus = async (
  alertId: string,
  status: 'active' | 'resolved'
) => {

  const { error } = await supabase
    .from('sos')
    .update({ status })
    .eq('id', alertId);

  if (error) throw error;
};