import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Brain, 
  Calendar, 
  MessageSquare, 
  BookOpen, 
  AlertCircle, 
  LogOut, 
  User, 
  Shield, 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle,
  BarChart3,
  Activity,
  Zap,
  Wind,
  Gamepad2,
  Bell,
  Search,
  ChevronRight,
  Plus
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { toast, Toaster } from 'sonner';

import { auth } from './firebase';
import { getChatResponse, generateAssessmentQuestions, analyzeAssessment } from './lib/ai';
import { fetchUserProfile, upsertUserProfile, createAssessment, fetchCounselors, fetchAppointmentsByStudent, createAppointment, fetchStudents, fetchAllAssessments, fetchAppointmentsByCounselor, fetchActiveSosAlerts, createSosAlert, updateUserProfile, updateAppointmentStatus, updateSosStatus, fetchAssessmentsByStudent } from './lib/db';
import { UserProfile, Assessment, Appointment, SOSAlert } from './types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// --- Constants & Mock Data ---
const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const RISK_COLORS = { low: '#10b981', moderate: '#f59e0b', high: '#ef4444' };

// --- Components ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong.</h2>
          <p className="text-gray-400 mb-4">We encountered an error while rendering this section.</p>
          <Button onClick={() => window.location.reload()} className="bg-emerald-600">
            Reload Application
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getRiskColor = (risk: string | undefined) => {
  if (!risk) return '#666';
  const r = risk.toLowerCase();
  if (r === 'low') return '#10b981';
  if (r === 'moderate') return '#f59e0b';
  if (r === 'high') return '#ef4444';
  return '#666';
};

const Login = ({ onLogin }: { onLogin: (role: 'student' | 'staff', data: any) => void }) => {
  const [role, setRole] = useState<'student' | 'staff'>('student');
  const [id, setId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!id || !phone || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userProfile: UserProfile = {
        uid: user.uid,
        id,
        phone,
        role,
        name: user.displayName || 'User',
        email: user.email || '',
        createdAt: new Date().toISOString(),
        isCounselor: role === 'staff' ? true : false
      };

      await upsertUserProfile(userProfile);
      const storedProfile = await fetchUserProfile(user.uid);
      onLogin(role, storedProfile || userProfile);
      toast.success(`Welcome, ${userProfile.name}!`);
    } catch (error) {
      console.error(error);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-4">
            <Heart className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">MindGuard</h1>
          <p className="text-gray-400 mt-2">Student Mental Health & Counseling Support</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <Tabs value={role} onValueChange={(v: any) => setRole(v)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id" className="text-gray-300">{role === 'student' ? 'Student ID' : 'Staff ID'}</Label>
              <Input 
                id="id" 
                placeholder={`Enter your ${role} ID`} 
                className="bg-zinc-800 border-zinc-700 text-white"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="Enter your phone number" 
                className="bg-zinc-800 border-zinc-700 text-white"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-gray-300">Password</Label>
              <Input 
                id="pass" 
                type="password" 
                placeholder="Enter password" 
                className="bg-zinc-800 border-zinc-700 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? 'Logging in...' : `Login as ${role === 'student' ? 'Student' : 'Staff'}`}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, assessments }: { user: UserProfile, assessments: Assessment[] }) => {
  const latestAssessment = assessments[0];
  
  const chartData = assessments.slice().reverse().map(a => ({
    date: a.timestamp ? new Date(a.timestamp).toLocaleDateString() : 'N/A',
    score: a.score || 0,
    stress: a.stressLevel || 0
  }));

  const pieData = [
    { name: 'Low Risk', value: assessments.filter(a => a.riskLevel?.toLowerCase() === 'low').length },
    { name: 'Moderate Risk', value: assessments.filter(a => a.riskLevel?.toLowerCase() === 'moderate').length },
    { name: 'High Risk', value: assessments.filter(a => a.riskLevel?.toLowerCase() === 'high').length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Mental Health Score</CardTitle>
            <Brain className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{latestAssessment?.score ?? '--'}%</div>
            <p className="text-xs text-gray-500 mt-1">Based on latest assessment</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Stress Level</CardTitle>
            <Activity className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{latestAssessment?.stressLevel ?? '--'}%</div>
            <p className="text-xs text-gray-500 mt-1">Current emotional load</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Risk Status</CardTitle>
            <AlertCircle className="w-4 h-4" style={{ color: getRiskColor(latestAssessment?.riskLevel) }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize" style={{ color: getRiskColor(latestAssessment?.riskLevel) }}>
              {latestAssessment?.riskLevel || 'Unknown'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Safety categorization</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Progress Over Time</CardTitle>
            <CardDescription className="text-gray-400">Tracking your mental well-being scores</CardDescription>
          </CardHeader>
          <CardContent className="p-0"><div style={{ height: "300px", width: "100%" }}><ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer></div></CardContent></Card><Card className="bg-zinc-900 border-zinc-800"><CardHeader><CardTitle className="text-white">Risk Distribution</CardTitle><CardDescription className="text-gray-400">Summary of all your assessments</CardDescription></CardHeader><CardContent className="p-0"><div style={{ height: "300px", width: "100%" }}><ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#fff' }}
                />
                <Legend />
              </PieChart></ResponsiveContainer></div></CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Daily Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="font-medium text-emerald-500">Mindfulness Minute</h4>
            <p className="text-sm text-gray-400 mt-1">Take 60 seconds to focus solely on your breath. Inhale for 4, hold for 4, exhale for 4.</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-medium text-blue-400">Hydration Check</h4>
            <p className="text-sm text-gray-400 mt-1">Drink a glass of water now. Dehydration can often mimic feelings of anxiety.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AssessmentTool = ({ user, onComplete }: { user: UserProfile, onComplete: () => void }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = await generateAssessmentQuestions();
        setQuestions(q);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, { 
      question: questions[currentStep].question, 
      answer, 
      category: questions[currentStep].category 
    }];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment(newAnswers);
    }
  };

  const submitAssessment = async (finalAnswers: any[]) => {
    setSubmitting(true);
    try {
      const analysis = await analyzeAssessment(finalAnswers);
      const assessment: Assessment = {
        studentUid: user.uid,
        score: analysis.score,
        riskLevel: analysis.riskLevel,
        stressLevel: analysis.stressLevel,
        moodPattern: analysis.moodPattern,
        sleepQuality: analysis.sleepQuality,
        responses: finalAnswers,
        timestamp: new Date().toISOString()
      };

      await createAssessment(assessment);
      toast.success("Assessment completed!");
      onComplete();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Generating your dynamic questionnaire...</div>;
  if (submitting) return <div className="text-center py-20 text-gray-400">Analyzing your responses...</div>;

  const q = questions[currentStep];

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <Badge className="w-fit mb-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              {q.category}
            </Badge>
            <CardTitle className="text-2xl text-white">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {q.options.map((option: string, i: number) => (
              <Button 
                key={i}
                variant="outline"
                className="justify-start h-auto py-4 px-6 text-left bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-gray-300 hover:text-white"
                onClick={() => handleAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const ChatBot = () => {
  const [messages, setMessages] = useState<{ role: string, parts: { text: string }[] }[]>([
    { role: "model", parts: [{ text: "Hello! I'm your MindGuard assistant. How are you feeling today?" }] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", parts: [{ text: input }] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await getChatResponse(input, messages);
      setMessages(prev => [...prev, { role: "model", parts: [{ text: response || "I'm here to listen." }] }]);
    } catch (error) {
      console.error(error);
      toast.error("Chat failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 h-[600px] flex flex-col">
      <CardHeader className="border-b border-zinc-800">
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          Counseling Chatbot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-zinc-800 text-gray-300 rounded-tl-none'
                }`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-gray-300 p-3 rounded-2xl rounded-tl-none animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t border-zinc-800">
        <div className="flex w-full gap-2">
          <Input 
            placeholder="Type your message..." 
            className="bg-zinc-800 border-zinc-700 text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSend}>
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const Exercises = () => {
  const [breathing, setBreathing] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  useEffect(() => {
    if (!breathing) return;
    const timer = setInterval(() => {
      setPhase(p => {
        if (p === 'Inhale') return 'Hold';
        if (p === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [breathing]);

  return (
    <div className="max-w-xl mx-auto">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wind className="w-5 h-5 text-blue-400" />
            4-4-4 Breathing Exercise
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <motion.div 
            animate={{ 
              scale: breathing ? (phase === 'Inhale' ? 1.5 : (phase === 'Hold' ? 1.5 : 1)) : 1,
              opacity: breathing ? (phase === 'Hold' ? 1 : 0.8) : 0.8
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-32 h-32 rounded-full bg-blue-500/20 border-4 border-blue-500 flex items-center justify-center"
          >
            <span className="text-blue-400 font-bold">{breathing ? phase : 'Ready?'}</span>
          </motion.div>
          <Button 
            className="mt-8 bg-blue-600 hover:bg-blue-700"
            onClick={() => setBreathing(!breathing)}
          >
            {breathing ? 'Stop' : 'Start Breathing'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Appointments = ({ user }: { user: UserProfile }) => {
  const [counselors, setCounselors] = useState<UserProfile[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [preferredTime, setPreferredTime] = useState('09:00 AM');
  const [mode, setMode] = useState<'call' | 'video' | 'in-person'>('video');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    const loadStudentData = async () => {
      const [counselors, appts] = await Promise.all([
        fetchCounselors(),
        fetchAppointmentsByStudent(user.uid)
      ]);

      setCounselors(counselors);
      setMyAppointments(appts.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
    };

    if (user.uid) {
      loadStudentData().catch(error => console.error(error));
    }
  }, [user.uid]);

  const handleBook = async () => {
    if (!selectedCounselor || !date) {
      toast.error("Please select a counselor and date");
      return;
    }
    setLoading(true);
    try {
      const counselor = counselors.find(c => c.uid === selectedCounselor);
      const appt: Appointment = {
        studentUid: user.uid,
        studentName: user.name,
        counselorUid: selectedCounselor,
        counselorName: counselor?.name || 'Counselor',
        dateTime: date.toISOString(),
        preferredTime,
        mode,
        status: 'pending',
        details,
        createdAt: new Date().toISOString()
      };
      await createAppointment(appt);
      toast.success("Appointment request sent!");
      setDetails('');
    } catch (error) {
      console.error(error);
      toast.error("Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-white">Book a Session</CardTitle>
          <CardDescription className="text-gray-400">Connect with a professional counselor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Select Counselor</Label>
            <Select value={selectedCounselor} onValueChange={(value) => value && setSelectedCounselor(value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Choose a counselor" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {counselors.map(c => (
                  <SelectItem key={c.uid} value={c.uid}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Date</Label>
            <Popover>
              <PopoverTrigger>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white">
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? date.toLocaleDateString() : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="bg-zinc-900 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Preferred Time</Label>
            <Select value={preferredTime} onValueChange={(value) => value && setPreferredTime(value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                {timeSlots.map(slot => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Mode</Label>
            <Select value={mode} onValueChange={(v: any) => setMode(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="video">Video Call</SelectItem>
                <SelectItem value="call">Voice Call</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Additional Details</Label>
            <Input 
              placeholder="What would you like to discuss?" 
              className="bg-zinc-800 border-zinc-700 text-white"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700" 
            onClick={handleBook}
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Request Appointment'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">My Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {myAppointments.length === 0 && <p className="text-center text-gray-500 py-10">No appointments yet.</p>}
              {myAppointments.map(appt => (
                <div key={appt.id} className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{appt.counselorName}</h4>
                      <p className="text-xs text-gray-500">{new Date(appt.dateTime).toLocaleDateString()} at {appt.preferredTime} • {appt.mode}</p>
                    </div>
                  </div>
                  <Badge className={
                    appt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                    appt.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                    'bg-amber-500/10 text-amber-500'
                  }>
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

const ResourceHub = () => {
  const resources = [
    { title: "Stress Management 101", category: "Article", icon: BookOpen, color: "text-blue-400", content: "Stress is a natural physical and mental reaction to life experiences. Everyone expresses stress from time to time. Anything from everyday responsibilities like work and family to serious life events such as a new diagnosis, war, or the death of a loved one can trigger stress. For immediate, short-term situations, stress can be beneficial to your health. It can help you cope with potentially serious situations. Your body responds to stress by releasing hormones that increase your heart and breathing rates and ready your muscles to respond." },
    { title: "Guided Sleep Meditation", category: "Audio", icon: Wind, color: "text-purple-400", content: "Find a comfortable position, either sitting or lying down. Close your eyes and take a deep breath in through your nose, and out through your mouth. Imagine a peaceful place where you feel completely safe and relaxed. Focus on the sounds, the smells, and the feeling of the air on your skin. Let go of any thoughts that come into your mind, and simply be present in this moment." },
    { title: "Exam Anxiety Tips", category: "Guide", icon: Zap, color: "text-yellow-400", content: "1. Prepare early and consistently. 2. Get plenty of sleep the night before. 3. Eat a healthy meal. 4. Practice deep breathing during the exam. 5. Focus on the question at hand, not the final grade. 6. Remember that one exam does not define your entire future." },
    { title: "Digital Detox Plan", category: "Article", icon: Shield, color: "text-emerald-400", content: "A digital detox refers to a period of time when a person refrains from using electronic devices such as smartphones, televisions, tablets, and computers. This is often done to reduce stress, improve sleep, and increase mindfulness. Start by setting clear boundaries, such as no phones during meals or an hour before bed. Gradually increase the time you spend away from screens and notice how it affects your mood and productivity." },
    { title: "Healthy Sleep Hygiene", category: "Guide", icon: Clock, color: "text-blue-400", content: "Sleep hygiene refers to the habits and practices that are conducive to sleeping well on a regular basis. This includes maintaining a consistent sleep schedule, creating a comfortable sleep environment, avoiding caffeine and heavy meals before bed, and limiting exposure to blue light from screens in the evening." },
    { title: "Building Resilience", category: "Article", icon: Heart, color: "text-red-400", content: "Resilience is the process of adapting well in the face of adversity, trauma, tragedy, threats, or significant sources of stress. It involves 'bouncing back' from difficult experiences. Resilience is not a trait that people either have or do not have. It involves behaviors, thoughts, and actions that can be learned and developed in anyone." },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((res, i) => (
        <Dialog key={i}>
          <DialogTrigger>
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <res.icon className={`w-5 h-5 ${res.color}`} />
                </div>
                <Badge variant="outline" className="w-fit border-zinc-700 text-gray-500">{res.category}</Badge>
                <CardTitle className="text-white mt-2 group-hover:text-emerald-500 transition-colors">{res.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Learn practical techniques to improve your daily mental well-being.</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="p-0 text-emerald-500 hover:text-emerald-400 hover:bg-transparent">
                  Read More <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center`}>
                  <res.icon className={`w-5 h-5 ${res.color}`} />
                </div>
                <div>
                  <DialogTitle>{res.title}</DialogTitle>
                  <Badge variant="outline" className="border-zinc-700 text-gray-500">{res.category}</Badge>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <ScrollArea className="h-[300px] pr-4">
                <p className="text-gray-300 leading-relaxed">{res.content}</p>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button className="bg-emerald-600 hover:bg-emerald-700">Mark as Read</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};

const StaffPortal = ({ user: initialUser }: { user: UserProfile }) => {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [staffTab, setStaffTab] = useState('students');
  
  // Profile form state
  const [specialization, setSpecialization] = useState(user.specialization || '');
  const [bio, setBio] = useState(user.bio || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    setUser(initialUser);
    setSpecialization(initialUser.specialization || '');
    setBio(initialUser.bio || '');
  }, [initialUser]);

  useEffect(() => {
    if (!user.uid) return;

    const loadStaffData = async () => {
      const [students, assessments, appointments, sosAlerts] = await Promise.all([
        fetchStudents(),
        fetchAllAssessments(),
        fetchAppointmentsByCounselor(user.uid),
        fetchActiveSosAlerts()
      ]);

      setStudents(students);
      setAssessments(assessments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setAppointments(appointments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setSosAlerts(sosAlerts);
    };

    loadStaffData().catch(error => console.error(error));
  }, [user.uid]);

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      await updateUserProfile(user.uid, {
        specialization,
        bio
      });
      setUser(prev => ({ ...prev, specialization, bio }));
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const getLatestAssessment = (studentUid: string) => {
    return assessments.find(a => a.studentUid === studentUid);
  };

  const sortedStudents = students.slice().sort((a, b) => {
    const aRisk = getLatestAssessment(a.uid)?.riskLevel === 'high' ? 1 : 0;
    const bRisk = getLatestAssessment(b.uid)?.riskLevel === 'high' ? 1 : 0;
    return bRisk - aRisk;
  });

  const handleApptStatus = async (apptId: string, status: 'confirmed' | 'rejected') => {
    try {
      await updateAppointmentStatus(apptId, status);
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status } : a));
      toast.success(`Appointment ${status}`);
    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    }
  };

  const pendingAppts = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <Tabs value={staffTab} onValueChange={setStaffTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="students" className="data-[state=active]:bg-emerald-600">Student Monitoring</TabsTrigger>
          <TabsTrigger value="appointments" className="data-[state=active]:bg-emerald-600 relative">
            Appointments
            {pendingAppts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                {pendingAppts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-600">My Counselor Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-6">
          {sosAlerts.length > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg animate-pulse mb-6">
              <div className="flex items-center gap-2 text-red-500 font-bold">
                <AlertCircle className="w-5 h-5" />
                ACTIVE SOS ALERTS ({sosAlerts.length})
              </div>
              <div className="mt-2 space-y-2">
                {sosAlerts.map(alert => (
                  <div key={alert.id} className="flex justify-between items-center bg-red-500/20 p-2 rounded">
                    <span className="text-white">{alert.studentName} is in distress!</span>
                    <Button size="sm" className="bg-red-600" onClick={async () => {
                      await updateSosStatus(alert.id!, 'resolved');
                      setSosAlerts(prev => prev.filter(a => a.id !== alert.id));
                      toast.success("Alert marked as resolved");
                    }}>Resolve</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-white">Student Directory</CardTitle>
                <CardDescription className="text-gray-400">Monitoring all student well-being</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-zinc-800">
                    {sortedStudents.map(student => {
                      const latest = getLatestAssessment(student.uid);
                      return (
                        <div 
                          key={student.uid} 
                          className={`p-4 cursor-pointer hover:bg-zinc-800 transition-colors ${selectedStudent?.uid === student.uid ? 'bg-zinc-800' : ''}`}
                          onClick={() => setSelectedStudent(student)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white">{student.name}</h4>
                                <p className="text-xs text-gray-500">ID: {student.id}</p>
                              </div>
                            </div>
                            {latest && (
                              <Badge className={
                                latest.riskLevel === 'high' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                                latest.riskLevel === 'moderate' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                                'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                              }>
                                {latest.riskLevel}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              {selectedStudent ? (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-500" />
                      {selectedStudent.name}'s Mental Health Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Dashboard 
                      user={selectedStudent} 
                      assessments={assessments.filter(a => a.studentUid === selectedStudent.uid)} 
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-zinc-900 border-zinc-800 h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">Select a student to view detailed insights</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">My Counseling Sessions</CardTitle>
              <CardDescription className="text-gray-400">Manage your upcoming appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {appointments.length === 0 && <p className="text-center text-gray-500 py-10">No sessions booked with you.</p>}
                  {appointments.map(appt => (
                    <div key={appt.id} className="p-4 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{appt.studentName}</h4>
                        <p className="text-xs text-gray-500">{new Date(appt.dateTime).toLocaleDateString()} at {appt.preferredTime} • {appt.mode}</p>
                        <p className="text-xs text-gray-400 mt-1 italic">"{appt.details}"</p>
                      </div>
                      <div className="flex gap-2">
                        {appt.status === 'pending' ? (
                          <>
                            <Button size="sm" className="bg-emerald-600" onClick={() => handleApptStatus(appt.id!, 'confirmed')}>Confirm</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleApptStatus(appt.id!, 'rejected')}>Reject</Button>
                          </>
                        ) : (
                          <Badge className={appt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}>
                            {appt.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="bg-zinc-900 border-zinc-800 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Counselor Registration & Profile</CardTitle>
              <CardDescription className="text-gray-400">Update your professional details for students to see</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <Badge className="mt-1 bg-emerald-600">Verified Staff</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Specialization</Label>
                <Input 
                  placeholder="e.g. Anxiety, Depression, Career Counseling" 
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
                <p className="text-xs text-gray-500">This helps students find the right counselor for their needs.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Professional Bio</Label>
                <textarea 
                  className="w-full min-h-[120px] p-3 rounded-md bg-zinc-800 border border-zinc-700 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Tell students about your background and approach..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleUpdateProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? 'Saving...' : 'Save Profile Details'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await fetchUserProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
          const studentAssessments = await fetchAssessmentsByStudent(profile.uid);
          setAssessments(studentAssessments);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSOS = async () => {
    if (!user) return;
    try {
      await createSosAlert({
        studentUid: user.uid,
        studentName: user.name,
        timestamp: new Date().toISOString(),
        status: 'active'
      });
      toast.error("SOS Alert Sent! A counselor has been notified.", {
        duration: 10000,
        position: 'top-center'
      });
    } catch (error) {
      console.error(error);
      toast.error("SOS failed to send");
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500">Loading MindGuard...</div>;

  if (!user) return <Login onLogin={(role, data) => setUser(data)} />;

  return (
    <div className="min-h-screen bg-black text-white">
      <Toaster theme="dark" position="top-right" />
      
      {/* Sidebar / Navigation */}
      <div className="flex flex-col md:flex-row min-h-screen">
        <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Heart className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">MindGuard</span>
          </div>

          <nav className="flex-1 space-y-2">
            <Button 
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </Button>
            {user.role === 'student' && (
              <>
                <Button 
                  variant={activeTab === 'assessment' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('assessment')}
                >
                  <Brain className="w-4 h-4" /> Self Assessment
                </Button>
                <Button 
                  variant={activeTab === 'chat' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare className="w-4 h-4" /> AI Counselor
                </Button>
                <Button 
                  variant={activeTab === 'exercises' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('exercises')}
                >
                  <Activity className="w-4 h-4" /> Exercises
                </Button>
                <Button 
                  variant={activeTab === 'appointments' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('appointments')}
                >
                  <Calendar className="w-4 h-4" /> Appointments
                </Button>
                <Button 
                  variant={activeTab === 'resources' ? 'secondary' : 'ghost'} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('resources')}
                >
                  <BookOpen className="w-4 h-4" /> Resource Hub
                </Button>
              </>
            )}
            {user.role === 'staff' && (
              <Button 
                variant={activeTab === 'staff' ? 'secondary' : 'ghost'} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('staff')}
              >
                <Shield className="w-4 h-4" /> Staff Portal
              </Button>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-800 space-y-4">
            {user.role === 'student' && (
              <Button 
                variant="destructive" 
                className="w-full gap-2 bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white"
                onClick={handleSOS}
              >
                <AlertCircle className="w-4 h-4" /> SOS PANIC
              </Button>
            )}
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => signOut(auth)}>
                <LogOut className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white">
                {activeTab === 'dashboard' && `Welcome back, ${user.name.split(' ')[0]}`}
                {activeTab === 'assessment' && 'Self Assessment'}
                {activeTab === 'chat' && 'AI Counseling Chat'}
                {activeTab === 'exercises' && 'Stress Relief Exercises'}
                {activeTab === 'appointments' && 'Counseling Appointments'}
                {activeTab === 'resources' && 'Resource Hub'}
                {activeTab === 'staff' && 'Staff Monitoring Portal'}
              </h2>
              <p className="text-gray-400 mt-1">
                {activeTab === 'dashboard' && 'Here is your mental health overview.'}
                {activeTab === 'assessment' && 'Take a moment to check in with yourself.'}
                {activeTab === 'chat' && 'Talk to our AI about anything on your mind.'}
                {activeTab === 'exercises' && 'Quick activities to help you relax.'}
                {activeTab === 'appointments' && 'Schedule a session with our experts.'}
                {activeTab === 'resources' && 'Explore articles and guides for your well-being.'}
                {activeTab === 'staff' && 'Monitor student health and manage sessions.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input placeholder="Search..." className="pl-10 bg-zinc-900 border-zinc-800 w-64" />
              </div>
              <Button variant="outline" size="icon" className="bg-zinc-900 border-zinc-800">
                <Bell className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary>
                {activeTab === 'dashboard' && <Dashboard user={user} assessments={assessments} />}
                {activeTab === 'assessment' && <AssessmentTool user={user} onComplete={() => setActiveTab('dashboard')} />}
                {activeTab === 'chat' && <ErrorBoundary><ChatBot /></ErrorBoundary>}
                {activeTab === 'exercises' && <Exercises />}
                {activeTab === 'appointments' && <Appointments user={user} />}
                {activeTab === 'resources' && <ResourceHub />}
                {activeTab === 'staff' && <StaffPortal user={user} />}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}






