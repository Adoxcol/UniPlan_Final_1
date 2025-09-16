# 🎓 DegreePlan - Your Personal University Roadmap

> **Transform your academic journey into a beautifully organized, interactive roadmap that adapts to your goals and keeps you on track for graduation.**

DegreePlan is a modern, intuitive course planning application designed specifically for university students who want to take control of their academic journey. Built with Next.js 15, TypeScript, and powered by Supabase, it combines powerful planning tools with a delightful user experience.

![UniPlan Demo](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=UniPlan+Demo)

## ✨ Features

### 🗓️ **Smart Semester Planning**
- **Drag & Drop Interface**: Effortlessly organize semesters and courses with intuitive drag-and-drop functionality
- **Visual Course Cards**: Each course gets a unique color and displays all essential information at a glance
- **Credit Tracking**: Automatic calculation of semester and cumulative credits
- **GPA Calculator**: Real-time GPA calculations for individual semesters and overall academic performance

### 📅 **Intelligent Schedule Management**
- **Weekly Schedule View**: Visualize your course schedule in a clean, calendar-style layout
- **Conflict Detection**: Automatic detection and highlighting of scheduling conflicts
- **Time Slot Management**: Easy course scheduling with time conflict prevention
- **Multi-View Support**: Switch between grid view and schedule view instantly

### 📝 **Smart Notes System**
- **Multi-Scope Notes**: Take notes at global, semester, or course level
- **Markdown Support**: Rich text formatting with markdown syntax
- **Live Preview**: Real-time markdown preview as you type
- **Smart Suggestions**: Contextual note suggestions based on your current scope
- **Auto-Save**: Never lose your thoughts with automatic saving

### 🎯 **Degree Progress Tracking**
- **Degree Setup**: Define your degree requirements and total credit goals
- **Progress Visualization**: Beautiful progress bars showing completion status
- **Credit Analytics**: Detailed breakdown of completed vs. remaining credits
- **Graduation Timeline**: Visual roadmap to your graduation date

### 🔐 **Secure Cloud Sync**
- **User Authentication**: Secure login with Supabase Auth
- **Real-time Sync**: Your data syncs across all devices automatically
- **Offline Support**: Continue planning even without internet connection
- **Data Privacy**: Your academic data is encrypted and secure

### 🎨 **Beautiful User Experience**
- **Dark/Light Mode**: Toggle between themes to match your preference
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Smooth Animations**: Delightful micro-interactions powered by Framer Motion
- **Accessibility**: Built with accessibility best practices in mind
- **PDF Export**: Export your academic roadmap as a beautiful PDF

### ⚡ **Power User Features**
- **Keyboard Shortcuts**: 
  - `A` - Add new semester
  - `Shift + A` - Open degree setup
- **Bulk Operations**: Manage multiple courses and semesters efficiently
- **Data Export**: Export your data for backup or transfer
- **Advanced Filtering**: Find courses and semesters quickly

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or later
- **npm** or **yarn** package manager
- **Supabase Account** (for cloud sync and authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/uniplan.git
   cd uniplan
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Run the SQL schema in your Supabase dashboard:
   ```bash
   # Copy the contents of supabase/schema.sql
   # and run it in your Supabase SQL editor
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see UniPlan in action!

## 🏗️ Project Structure

```
uniplan/
├── app/                    # Next.js 15 App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── Header.tsx        # Application header
│   ├── SemesterCard.tsx  # Semester management
│   ├── ScheduleView.tsx  # Schedule visualization
│   ├── NotesPanel.tsx    # Smart notes system
│   └── ...               # Other feature components
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication logic
│   └── use-toast.ts      # Toast notifications
├── lib/                  # Core utilities and logic
│   ├── store.ts          # Zustand state management
│   ├── types.ts          # TypeScript type definitions
│   ├── utils.ts          # Utility functions
│   └── supabaseClient.ts # Supabase configuration
├── supabase/             # Database schema
│   └── schema.sql        # Database table definitions
└── tests/                # Test files
    ├── setup.ts          # Test configuration
    └── store.test.ts     # Store logic tests
```

## 🛠️ Technology Stack

### **Frontend**
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible UI components
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations
- **[Lucide React](https://lucide.dev/)** - Beautiful icons

### **State Management**
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms
- **[Zod](https://zod.dev/)** - Schema validation

### **Backend & Database**
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **PostgreSQL** - Robust relational database
- **Row Level Security** - Secure data access

### **Development Tools**
- **[Vitest](https://vitest.dev/)** - Fast unit testing
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting

## 📖 Usage Guide

### **Getting Started with Your First Semester**

1. **Set Up Your Degree**
   - Click the degree setup button or press `Shift + A`
   - Enter your degree name and total credit requirements
   - This helps track your progress toward graduation

2. **Add Your First Semester**
   - Click "Add Semester" or press `A`
   - Choose the season (Autumn, Spring, Summer) and year
   - Mark it as active if it's your current semester

3. **Add Courses**
   - Click "Add Course" within a semester card
   - Fill in course details: name, credits, schedule
   - The app automatically assigns colors and detects conflicts

4. **Track Your Progress**
   - View your GPA calculations in real-time
   - Monitor credit completion in the progress section
   - Switch to schedule view to see your weekly timetable

### **Advanced Features**

- **Drag & Drop**: Reorder semesters and courses by dragging them
- **Notes**: Use the notes panel for planning and reminders
- **Schedule Conflicts**: Red highlights show time conflicts
- **PDF Export**: Generate a beautiful PDF of your academic plan
- **Theme Toggle**: Switch between light and dark modes

## 🧪 Testing

Run the test suite to ensure everything works correctly:

```bash
npm run test
# or
yarn test
```

## 🚀 Deployment

### **Deploy to Vercel (Recommended)**

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy with one click!

### **Deploy to Netlify**

1. Build the project: `npm run build`
2. Deploy the `out` folder to [Netlify](https://netlify.com)
3. Configure environment variables in Netlify dashboard

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### **Development Guidelines**

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[shadcn/ui](https://ui.shadcn.com/)** for the beautiful component library
- **[Supabase](https://supabase.com/)** for the amazing backend platform
- **[Vercel](https://vercel.com/)** for seamless deployment
- **[Lucide](https://lucide.dev/)** for the gorgeous icons

## 📞 Support

Have questions or need help? We're here for you:

- 📧 **Email**: mahfuzurrrahmannn@gmail.com
- 💬 **Discord**: [Join our community](https://discord.gg/uniplan)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/uniplan/issues)
- 📖 **Documentation**: [Full Documentation](https://docs.uniplan.app)

---

<div align="center">
  <p><strong>Made with ❤️ for students, by students</strong></p>
  <p>⭐ Star this repo if UniPlan helps you succeed in your academic journey!</p>
</div>
