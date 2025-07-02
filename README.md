# 🎓 Smart Student Tracking System

A comprehensive React-based student performance tracking application with real-time analytics, AI-powered insights, and interactive dashboards. Built with modern web technologies and Supabase backend.

![React](https://img.shields.io/badge/React-18.0+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-cyan.svg)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## ✨ Features

### 🎯 Core Features
- **📊 Real-time Performance Analytics** - Interactive charts and graphs
- **📝 Assessment Management** - Add, edit, and track academic assessments
- **🎨 Subject-based Organization** - Color-coded subject management
- **📈 Progress Tracking** - Visual progress indicators and trends
- **🎯 Goal Setting** - Set and monitor academic goals
- **🏆 Achievement System** - Gamified learning with badges and rewards

### 🤖 AI-Powered Features
- **🧠 Smart Insights** - AI-generated study recommendations
- **📊 Performance Predictions** - Predictive analytics for future performance
- **🎯 Personalized Suggestions** - Tailored study strategies
- **📈 Trend Analysis** - Pattern recognition and improvement suggestions

### 🛠️ Advanced Features
- **📚 Study Planner** - Interactive study scheduling
- **⏱️ Study Timer** - Pomodoro technique timer
- **📝 Quick Notes** - Fast note-taking system
- **🃏 Flashcards** - Digital flashcard system
- **📱 Responsive Design** - Mobile-friendly interface
- **🌙 Dark Mode** - Toggle between light and dark themes

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Interactive charts and data visualization
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Supabase** - Open-source Firebase alternative
- **PostgreSQL** - Robust relational database
- **Row Level Security (RLS)** - Secure data access
- **Real-time subscriptions** - Live data updates

### Authentication & Security
- **Supabase Auth** - Secure user authentication
- **JWT Tokens** - Stateless authentication
- **Row Level Security** - Database-level security policies

### Development Tools
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (for version control)
- **Supabase CLI** (for database management)

### Installing Prerequisites

#### Node.js and npm
```bash
# Download from https://nodejs.org/
# Or use a version manager like nvm
nvm install 18
nvm use 18
```

#### Supabase CLI
```bash
npm install -g supabase
```

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/mhnipu/smart-student-tracking.git
cd smart-student-tracking
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Verify Installation
```bash
npm run dev
```
The application should start on `http://localhost:3000`

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `smart-student-tracking`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your location
5. Click "Create new project"

### 2. Get Project Credentials
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-ref.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)

### 3. Link Local Project to Supabase
```bash
# Login to Supabase CLI
supabase login

# Link your project (replace with your project reference)
supabase link --project-ref your-project-ref
```

### 4. Apply Database Migrations
```bash
# Push all migrations to your database
supabase db push
```

## ⚙️ Environment Configuration

### 1. Create Environment File
Create a `.env` file in the root directory:

```bash
# .env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 2. Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 3. Security Notes
- ⚠️ **Never commit `.env` files** to version control
- 🔒 **Keep your service role key secret** (only use anon key in frontend)
- 🌐 **Use environment-specific files** for different deployments

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
- **URL**: http://localhost:3000
- **Hot Reload**: Enabled
- **Source Maps**: Enabled

### Production Build
```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 📁 Project Structure

```
smart-student-tracking/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 dashboard/          # Dashboard-specific components
│   │   │   ├── add-mark-dialog.tsx
│   │   │   ├── performance-chart.tsx
│   │   │   ├── recent-marks.tsx
│   │   │   ├── subject-breakdown.tsx
│   │   │   └── ...
│   │   ├── 📁 providers/          # Context providers
│   │   │   └── auth-provider.tsx
│   │   └── 📁 ui/                 # Reusable UI components
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   ├── 📁 pages/                  # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── HomePage.tsx
│   ├── 📁 hooks/                  # Custom React hooks
│   │   └── use-toast.ts
│   ├── 📁 lib/                    # Utility libraries
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   └── index.css                  # Global styles
├── 📁 supabase/
│   └── 📁 migrations/             # Database migrations
│       ├── 20250618063939_fragrant_dune.sql
│       ├── 20250618085208_smooth_flame.sql
│       └── ...
├── 📁 public/                     # Static assets
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

## 🔌 API Documentation

### Authentication Endpoints

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut()
```

### Database Tables

#### Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text,
  student_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Marks Table
```sql
CREATE TABLE marks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  score numeric NOT NULL CHECK (score >= 0),
  max_score numeric NOT NULL CHECK (max_score > 0),
  percentage numeric GENERATED ALWAYS AS ((score / max_score) * 100) STORED,
  test_type text NOT NULL CHECK (test_type IN ('quiz', 'exam', 'assignment', 'project')),
  test_name text NOT NULL,
  date date NOT NULL,
  semester text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Subjects Table
```sql
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  color text DEFAULT '#3B82F6',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository
```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/your-username/smart-student-tracking.git
cd smart-student-tracking
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Your Changes
- Write clean, documented code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add amazing new feature"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/amazing-feature
# Create PR on GitHub
```

### 6. Code Style Guidelines
- Use **TypeScript** for all new code
- Follow **ESLint** rules
- Use **Prettier** for formatting
- Write **JSDoc** comments for functions
- Use **conventional commits** for commit messages

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if Supabase is running
supabase status

# Reset database
supabase db reset

# Check logs
supabase logs
```

#### 2. Authentication Problems
- Verify environment variables are correct
- Check Supabase project settings
- Ensure RLS policies are properly configured

#### 3. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### 4. Development Server Issues
```bash
# Kill existing processes
npx kill-port 3000

# Restart development server
npm run dev
```

### Performance Optimization

#### 1. Bundle Size
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer
```

#### 2. Database Queries
- Use proper indexes
- Implement pagination
- Optimize RLS policies

#### 3. React Performance
- Use `React.memo` for expensive components
- Implement `useCallback` and `useMemo`
- Lazy load components

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the amazing backend platform
- **Vite** for the fast build tool
- **Tailwind CSS** for the utility-first CSS framework
- **React** team for the incredible framework
- **TypeScript** team for type safety

## 📞 Support

If you encounter any issues or have questions:

1. **Check the documentation** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Contact the maintainers** via GitHub

---

**Made with ❤️ by the Smart Student Tracking Team**

*Empowering students to track their progress and achieve their academic goals.*

## Database Troubleshooting

If you encounter database-related errors like:
- "JWT expired" errors
- "Could not find column 'x' in table 'y'"
- Test type violations in study sessions

You can use the simple database fix scripts:

### For Windows Users:

```powershell
.\scripts\fix_database.ps1
```

### For Mac/Linux Users:

```bash
./scripts/fix_database.sh
```

These scripts will:
1. Fix study sessions test_type constraints
2. Add missing columns
3. Update constraints that might cause errors

For detailed database information and troubleshooting, see [docs/SUPABASE.md](docs/SUPABASE.md).

 