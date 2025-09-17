# UniPlan - Advanced Academic Planning Platform

A comprehensive, feature-rich academic planning application that empowers students to organize their degree requirements, plan semesters, track academic progress, and collaborate with peers through intelligent features and seamless cloud synchronization.

## ✨ Core Features

### 🎯 Intelligent Semester Planning
- **Advanced Drag & Drop Interface**: Intuitive course management with visual feedback and smooth animations
- **Smart Conflict Detection**: Real-time detection of scheduling conflicts with detailed conflict resolution
- **Dynamic Credit Tracking**: Live calculation of semester and cumulative credit hours
- **Comprehensive GPA Calculator**: Automatic GPA calculation with grade tracking and trend analysis
- **Semester Templates**: Pre-built semester templates for common degree programs

### 📅 Advanced Schedule Management
- **Interactive Schedule View**: Clean, calendar-style schedule visualization with time slot management
- **Multi-Semester Scheduling**: View and manage schedules across multiple semesters
- **Conflict Resolution System**: Smart detection, highlighting, and suggestions for resolving time conflicts
- **Schedule Export**: Export schedules to PDF and calendar formats
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices

### 📝 Multi-Level Notes System
- **Hierarchical Notes**: Global, semester-specific, and course-specific note organization
- **Rich Text Editor**: Enhanced note-taking with formatting, lists, and markdown support
- **Auto-Save Technology**: Automatic saving of notes and changes with conflict resolution
- **Advanced Search**: Full-text search across all notes with filtering and tagging
- **Note Sharing**: Share notes with classmates and study groups

### 🎓 Comprehensive Progress Tracking
- **Visual Progress Dashboard**: Interactive progress bars and completion tracking
- **Degree Requirements Engine**: Track completion of major, minor, and general education requirements
- **Credit Analysis**: Detailed breakdown of completed, in-progress, and remaining credits
- **Graduation Projection**: AI-powered graduation timeline based on current progress and course availability
- **Academic Performance Analytics**: GPA trends, credit distribution, and performance insights

### 🔄 Enterprise-Grade Sync & Collaboration
- **Real-Time Cloud Sync**: Secure data synchronization across all devices via Supabase
- **Offline-First Architecture**: Continue working offline with automatic sync when reconnected
- **Collaborative Planning**: Share degree plans with advisors, peers, and family
- **Version Control**: Complete revision history with rollback capabilities
- **Data Portability**: JSON-based export/import with migration tools

### 🎨 Modern UI/UX Excellence
- **Adaptive Design System**: Modern, intuitive interface with smooth micro-interactions
- **Theme Customization**: Dark/light mode with custom color schemes
- **Accessibility First**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support
- **Performance Optimized**: Sub-second loading with efficient state management and lazy loading
- **Mobile-First**: Progressive Web App (PWA) with offline capabilities

### ⚡ Power User Features
- **Comprehensive Keyboard Shortcuts**: Quick actions for efficient navigation and management
- **Bulk Operations**: Multi-select and batch operations for courses and semesters
- **Advanced Undo/Redo**: Complete action history with granular undo/redo functionality
- **Smart Filtering**: Filter courses by credits, grades, time slots, and custom criteria
- **Advanced Export Options**: PDF reports, CSV data, and calendar integration
- **Template Library**: Community-driven template sharing and discovery

### 👨‍💼 Administrative Features
- **Admin Dashboard**: Comprehensive system monitoring and user management
- **User Analytics**: Detailed usage statistics and performance metrics
- **Template Management**: Create and manage official degree templates
- **System Health Monitoring**: Real-time system performance and error tracking
- **Bulk User Operations**: Administrative tools for user management and data migration

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm/yarn
- **Supabase account** (for cloud sync and collaboration features)
- **Modern web browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Quick Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd uniplan
   npm install
   ```

2. **Environment Configuration**
   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Database Setup**
   ```bash
   # Initialize Supabase (if using Supabase CLI)
   npx supabase init
   npx supabase start
   
   # Or manually run the SQL migrations in your Supabase dashboard
   ```

4. **Development Server**
   ```bash
   npm run dev
   # Application available at http://localhost:3000
   ```

5. **Optional: Seed Sample Data**
   ```bash
   npm run seed                    # Seed degree templates
   npm run admin:create           # Create first admin user
   npm run admin:seed             # Seed admin data
   ```

## 📁 Project Architecture

```
uniplan/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                 # Main application interface
│   ├── admin/                   # Administrative dashboard
│   │   └── page.tsx            # Admin panel with analytics
│   └── globals.css             # Global styles and CSS variables
├── components/                   # React component library
│   ├── ui/                      # Reusable UI primitives (40+ components)
│   ├── AdminDashboard.tsx       # Administrative interface
│   ├── AuthPanel.tsx           # Authentication system
│   ├── SemesterCard.tsx        # Semester management interface
│   ├── CourseCard.tsx          # Course management interface
│   ├── ScheduleView.tsx        # Calendar schedule visualization
│   ├── ProgressSection.tsx     # Academic progress tracking
│   ├── NotesPanel.tsx          # Multi-level notes system
│   ├── TemplateLibrary.tsx     # Degree template browser
│   ├── UserManagement.tsx      # User profile and settings
│   └── [25+ other components]   # Feature-specific components
├── lib/                         # Core utilities and services
│   ├── store.ts                # Zustand state management
│   ├── types.ts                # TypeScript definitions (15+ interfaces)
│   ├── supabaseClient.ts       # Database client configuration
│   ├── adminUtils.ts           # Administrative utilities
│   ├── degreeTemplateService.ts # Template management service
│   ├── sharingService.ts       # Collaboration features
│   └── validationSchemas.ts    # Zod validation schemas
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication management
│   ├── useAutoSave.ts          # Automatic data persistence
│   ├── useKeyboardShortcuts.ts # Keyboard navigation
│   └── useServiceWorker.ts     # PWA functionality
├── scripts/                     # Administrative and utility scripts
│   ├── seedTemplates.ts        # Database seeding
│   ├── createFirstAdmin.ts     # Admin user creation
│   ├── promoteUserToAdmin.ts   # User role management
│   └── [10+ other scripts]     # Various utilities
└── public/                      # Static assets and PWA files
```

## 🛠️ Technology Stack

### Frontend Architecture
- **Next.js 14**: React framework with App Router and Server Components
- **TypeScript**: Full type safety with strict mode enabled
- **Tailwind CSS**: Utility-first CSS with custom design system
- **Framer Motion**: Advanced animations and micro-interactions
- **Radix UI**: Accessible, unstyled component primitives
- **React Hook Form**: Performant form handling with validation
- **Hello Pangea DnD**: Advanced drag-and-drop functionality

### State Management & Data Flow
- **Zustand**: Lightweight, performant state management
- **React Query**: Server state management and caching
- **Zod**: Runtime type validation and schema parsing
- **Immer**: Immutable state updates

### Backend & Database
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security**: Fine-grained access control
- **Edge Functions**: Serverless backend logic
- **Real-time Subscriptions**: Live collaborative features

### Development & Quality Tools
- **ESLint**: Advanced linting with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for quality gates
- **Vitest**: Fast unit and integration testing
- **TypeScript**: Static analysis and IntelliSense

### Performance & Optimization
- **Next.js Image Optimization**: Automatic image optimization
- **Bundle Analyzer**: Bundle size monitoring
- **Service Worker**: Offline functionality and caching
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Dead code elimination

## 📖 Comprehensive Usage Guide

### Getting Started with Your Academic Plan

1. **Initial Setup**
   - Create an account or sign in with existing credentials
   - Complete the degree setup wizard with your program details
   - Import existing coursework or start fresh

2. **Creating Your First Semester**
   - Click "Add Semester" and enter semester details
   - Choose from pre-built templates or create custom semesters
   - Add courses with detailed information (credits, schedule, prerequisites)

3. **Advanced Course Management**
   - **Drag & Drop**: Reorder courses within and between semesters
   - **Bulk Operations**: Select multiple courses for batch editing
   - **Schedule Integration**: Add time slots for automatic conflict detection
   - **Grade Tracking**: Enter grades for real-time GPA calculation

### Mastering the Schedule View

- **Multi-View Options**: Switch between semester planning and calendar views
- **Conflict Resolution**: Automatic detection with suggested solutions
- **Time Management**: Visual representation of daily and weekly schedules
- **Export Options**: Generate PDF schedules and calendar files

### Advanced Notes and Organization

- **Hierarchical Structure**: Organize notes at global, semester, and course levels
- **Rich Text Features**: Formatting, lists, links, and markdown support
- **Search and Filter**: Find notes quickly with full-text search
- **Collaboration**: Share notes with study groups and advisors

### Progress Tracking and Analytics

- **Real-Time Progress**: Visual dashboards showing completion status
- **Requirement Tracking**: Monitor major, minor, and general education progress
- **Performance Analytics**: GPA trends, credit distribution, and projections
- **Graduation Planning**: AI-powered timeline with course availability data

## 🧪 Testing & Quality Assurance

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Continuous testing
npm run test:coverage      # Generate coverage reports
npm run test:e2e          # End-to-end testing
```

### Code Quality
```bash
npm run lint              # ESLint analysis
npm run lint:fix          # Auto-fix linting issues
npm run type-check        # TypeScript validation
npm run format            # Prettier formatting
```

### Performance Testing
```bash
npm run build:analyze     # Bundle analysis
npm run lighthouse        # Performance auditing
```

## 🚀 Deployment & Production

### Vercel (Recommended)
```bash
# Automatic deployment
vercel --prod

# Environment variables required:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### Alternative Platforms
- **Netlify**: Full Next.js support with edge functions
- **Railway**: Integrated database and deployment
- **DigitalOcean App Platform**: Managed container deployment
- **AWS Amplify**: Serverless deployment with CDN

### Production Build
```bash
npm run build             # Production build
npm run start            # Production server
npm run export           # Static export (if applicable)
```

### Performance Optimization
- **Image Optimization**: Automatic WebP conversion and lazy loading
- **Code Splitting**: Route-based and component-based splitting
- **Caching Strategy**: Aggressive caching with smart invalidation
- **CDN Integration**: Global content delivery optimization

## 🤝 Contributing & Development

### Development Workflow
1. **Fork and Clone**: Create your development environment
2. **Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Development**: Follow coding standards and add tests
4. **Quality Gates**: Ensure all tests pass and linting is clean
5. **Pull Request**: Submit with detailed description and screenshots

### Code Standards
- **TypeScript First**: All new code must be TypeScript
- **Component Architecture**: Follow established patterns and conventions
- **Testing Requirements**: Unit tests for utilities, integration tests for features
- **Documentation**: Update README and inline documentation
- **Accessibility**: Ensure WCAG 2.1 AA compliance

### Administrative Features Development
```bash
npm run admin:test        # Test admin functionality
npm run admin:seed        # Seed admin data for development
npm run admin:promote     # Promote users to admin (development)
```

## 📄 License & Legal

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### Third-Party Licenses
- All dependencies are MIT, Apache 2.0, or similarly permissive licenses
- No GPL or copyleft dependencies included
- Full license attribution available in `LICENSES.md`

## 🆘 Support & Community

### Getting Help
- **📖 Documentation**: Comprehensive guides and API documentation
- **🐛 Bug Reports**: GitHub Issues with detailed templates
- **💡 Feature Requests**: GitHub Discussions for community input
- **💬 Community**: Discord server for real-time support

### Support Channels
- **GitHub Issues**: Bug reports and technical issues
- **GitHub Discussions**: Feature requests and general questions
- **Discord Community**: Real-time chat and collaboration
- **Email Support**: Direct support for critical issues

## 🙏 Acknowledgments & Credits

### Core Technologies
- **[Next.js](https://nextjs.org/)**: React framework and development platform
- **[Supabase](https://supabase.com/)**: Backend-as-a-Service and database
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)**: Accessible component primitives
- **[Framer Motion](https://www.framer.com/motion/)**: Animation library

### Design & Assets
- **[Lucide Icons](https://lucide.dev/)**: Beautiful, consistent iconography
- **[Heroicons](https://heroicons.com/)**: Additional icon resources
- **[Unsplash](https://unsplash.com/)**: High-quality photography

### Community & Contributors
- Special thanks to all contributors and beta testers
- Academic advisors who provided domain expertise
- Open source community for tools and inspiration

---

**UniPlan** - Empowering students to take control of their academic journey with intelligent planning, seamless collaboration, and comprehensive progress tracking.
