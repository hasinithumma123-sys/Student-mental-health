# 🧠 Student Mental Health Counseling App

A comprehensive mental health support platform designed specifically for students, featuring AI-powered counseling, mental health assessments, appointment booking, and emergency SOS alerts.

## ✨ Features

### 🤖 AI-Powered Support
- **Intelligent Chatbot**: Chat with an empathetic AI counselor powered by **Groq API** (llama-3.3-70b-versatile)
- **Real-time Responses**: Fast, contextual mental health guidance
- **Graceful Degradation**: Automatic fallback to cached responses if APIs are unavailable

### 📊 Mental Health Assessments
- **Interactive Questionnaires**: 8-question surveys covering stress, mood, sleep, and emotional well-being
- **AI-Powered Analysis**: Automatic scoring and personalized insights
- **Progress Tracking**: View assessment history and trends over time
- **Risk Assessment**: Identifies stress levels and provides targeted recommendations

### 📅 Appointment Management
- **Counselor Scheduling**: Book, view, and manage appointments with professional counselors
- **Real-time Status Updates**: Confirm or reschedule appointments
- **Counselor Profiles**: View available counselors and their specializations

### 🆘 Emergency SOS System
- **One-Click Alerts**: Quickly alert support staff in crisis situations
- **Active Alert Tracking**: Real-time monitoring of emergency requests
- **Immediate Response**: Priority handling of SOS alerts by staff

### 📱 Student Dashboard
- **Overview**: Quick stats on mental well-being scores
- **Charts & Analytics**: Visualize mental health trends over time
- **Personalized Suggestions**: Daily mindfulness, sleep, and exercise tips
- **Quick Actions**: Fast access to chat, assessments, and appointments

### 👨‍💼 Staff Portal
- **Student Management**: View all registered students and their profiles
- **Assessment Review**: Access student assessment histories and insights
- **Appointment Scheduling**: Manage counseling appointments across all students
- **Alert Monitoring**: Track and respond to SOS alerts
- **Profile Management**: Update specialization and bio information

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript and Vite
- **Tailwind CSS** for responsive design
- **shadcn/ui** for accessible components
- **Recharts** for data visualization
- **Motion** for smooth animations
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend & Services
- **Firebase Auth** - User authentication and session management
- **Supabase** - PostgreSQL database with real-time capabilities
- **Groq API** - Primary AI service (llama-3.3-70b-versatile model)
- **Google Gemini API** - Fallback AI service

### Development
- **Vite 6** - Lightning-fast build tool
- **TypeScript** - Type-safe development
- **ESLint** - Code linting

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- Groq API key (free at https://console.groq.com)
- Firebase project credentials
- Supabase project URL and API keys

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Student-mental-health
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```
   # Groq API (Primary AI Service)
   VITE_GROQ_API_KEY=your_groq_api_key_here
   
   # Firebase Auth
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   
   # Supabase Database
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Configure Supabase RLS Policies:
   - Navigate to your Supabase dashboard
   - SQL Editor → New Query
   - Copy and paste contents of `supabase_rls_setup.sql`
   - Click "Run"

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3001/`

## 📖 Usage

### For Students
1. **Sign In**: Use Google authentication to create your account
2. **Complete Assessment**: Take the mental health assessment quiz
3. **Chat with Counselor**: Use the AI chatbot for immediate support
4. **Book Appointment**: Schedule a session with a professional counselor
5. **Track Progress**: Monitor your mental well-being scores over time
6. **Emergency SOS**: Click the SOS button if you need immediate help

### For Staff/Counselors
1. **Access Portal**: Click "Staff Portal" to access counselor dashboard
2. **View Students**: See all student profiles and their assessment history
3. **Manage Appointments**: Confirm or reject appointment requests
4. **Monitor Alerts**: Respond to SOS alerts from students
5. **Update Profile**: Add your specialization and professional bio

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run TypeScript type check
```

### Project Structure
```
src/
├── App.tsx              # Main React component with all features
├── firebase.ts          # Firebase authentication setup
├── main.tsx             # React entry point
├── types.ts             # TypeScript type definitions
├── index.css            # Global styles
└── lib/
    ├── ai.ts            # Groq AI service integration
    ├── db.ts            # Database operations
    └── supabase.ts      # Supabase client setup
```

## 🤝 AI Integration

### Groq API (Primary)
- **Model**: llama-3.3-70b-versatile
- **Use Cases**: Chat responses, assessment generation, analysis
- **Benefits**: Fast, reliable, free tier available

### Fallback System
The app automatically falls back to hardcoded responses if:
- Groq API is unavailable
- Rate limits are exceeded
- Network issues occur

This ensures the app remains functional even when APIs are down.

## 🔒 Security & Privacy

- **Firebase Auth**: Secure user authentication
- **Supabase RLS**: Row-level security policies protect user data
- **Environment Variables**: Sensitive keys are never hardcoded
- **HTTPS Only**: All API calls use encrypted connections
- **Data Isolation**: Students only see their own data

## 📋 Database Schema

### Users Table
- uid (string) - Firebase user ID
- name (string) - User full name
- email (string) - User email
- phone (string) - Contact number
- role (string) - "student" or "staff"
- isCounselor (boolean) - Staff role indicator
- specialization (string) - Counselor specialization

### Assessments Table
- studentUid (string) - Student reference
- score (number) - 0-100 mental health score
- stressLevel (number) - Stress score
- sleepQuality (number) - Sleep quality score
- moodPattern (string) - Mood description
- riskLevel (string) - "low", "moderate", "high"
- responses (json) - Assessment answers
- timestamp (string) - When taken

### Appointments Table
- studentUid (string) - Student reference
- counselorUid (string) - Counselor reference
- dateTime (string) - Appointment time
- mode (string) - "video" or "in-person"
- status (string) - "pending", "confirmed", "rejected"
- details (string) - Additional notes

### SOS Alerts Table
- studentUid (string) - Student reference
- studentName (string) - Student name
- timestamp (string) - Alert time
- status (string) - "active" or "resolved"

## 🐛 Troubleshooting

### Chart Dimension Warnings
If you see "Width(-1) and height(-1)" warnings:
- These have been fixed in the latest version
- Charts are now wrapped in properly-sized divs

### API Rate Limits
- Groq free tier: 30 requests/minute
- If exceeded, fallback responses are used
- Upgrade to Groq Pro for higher limits

### Supabase Connection Issues
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check that RLS policies are properly configured
- Run `supabase_rls_setup.sql` if policies are missing

### Firebase Auth Issues
- Ensure Google OAuth is enabled in Firebase Console
- Add localhost:3001 to authorized redirect URIs

## 📞 Support

For issues or feature requests, please create an issue in the repository.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Groq AI for fast, open-source LLM inference
- Supabase for real-time PostgreSQL backend
- Firebase for authentication
- shadcn/ui for beautiful components
- All contributors to the student mental health mission
