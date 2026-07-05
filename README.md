# EquiFeed — AI-Powered Social Media Post Ranking Platform

A full-stack social media platform that uses AI-powered scoring to rank and surface the most engaging content. Built with Next.js 15, React 19, Clerk authentication, Clerk authentication, Drizzle ORM, and a Python FastAPI scoring engine.

## 🏗️ Architecture

```
EquiFeed/
├── Frontend-Focus/artifacts/equifeed/   # Next.js 15 + React 19 Frontend
│   ├── app/                    # App Router pages (Home, Explore, Trends, Analytics, Creator Dashboard)
│   ├── components/             # React components (UI, Feed, Posts, Charts)
│   ├── lib/                    # Utilities, API clients, Auth helpers
│   ├── hooks/                  # Custom React hooks
│   └── styles/                 # Global styles, Tailwind config
├── scoring-engine/              # Python FastAPI Scoring Engine
│   ├── main.py                 # FastAPI app with scoring endpoints
│   ├── scorer.py               # Core scoring algorithm (engagement, relevance, quality)
│   ├── models.py               # Pydantic models for scoring
│   ├── llm_client.py           # LLM client for content analysis
│   └── feedback.py             # Feedback loop for continuous learning
└── scoring-engine/requirements.txt
```

## ✨ Features

### 🏠 Home Feed (For All Users)
- **AI-Ranked Feed**: Posts ranked by engagement score, relevance, and quality
- **Infinite Scroll**: Infinite scrolling with React Query infinite queries
- **Real-time Updates**: Optimistic updates with React Query mutations
- **Role-based Access**: Public feed for all, creator features gated by role

### 🔍 Explore
- **3-Column Grid**: Masonry-style image grid with lazy loading
- **Search & Filter**: Client-side search with debounced filtering
- **Post Detail Sheet**: Full-screen bottom sheet with scroll-snap feed
- **Keyboard Navigation**: Arrow keys for navigation, ESC to close

### 📈 Trends
- **Trending Posts**: Real-time trending content ranked by velocity
- **Trending Topics**: AI-extracted topics with volume metrics
- **Hashtag Trends**: Rising hashtags with growth indicators
- **Spotlight Carousel**: Featured trending content carousel

### 📊 Analytics Dashboard (Creator Only)
- **Engagement Score**: Weighted engagement metrics
- **Quality Score**: Content quality assessment
- **Reach Metrics**: Impressions, reach, virality score
- **Audience Insights**: Demographics, active hours, top locations
- **Score Breakdown**: Radar chart breaking down score components
- **Post Performance**: Table with sorting, filtering, pagination

### ✍️ Creator Dashboard
- **Post Creation**: Rich text editor with media upload (Cloudinary)
- **Draft Management**: Auto-save drafts with localStorage backup
- **Scheduled Posts**: Schedule posts for future publishing
- **Post History**: Paginated table with status filters
- **Analytics Preview**: Quick stats per post

### 🔐 Authentication (Clerk)
- **Clerk Authentication**: Secure auth with email, social, MFA
- **Role-Based Access**: `user` | `creator` roles via Clerk metadata
- **Onboarding Flow**: Role selection → profile completion → dashboard
- **Session Management**: Server-side session validation

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **UI Components** | Radix UI, shadcn/ui, Lucide Icons, Recharts |
| **State** | Zustand, TanStack Query (React Query) |
| **Auth** | Clerk (Next.js middleware) |
| **Database** | PostgreSQL (Neon), Drizzle ORM |
| **Storage** | Cloudinary (images/videos) |
| **Scoring Engine** | Python 3.12, FastAPI, Pydantic, OpenAI SDK |
| **Deployment** | Vercel (Frontend), Railway/Render (Scoring Engine) |

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x
- Python 3.12+
- PostgreSQL (Neon recommended)
- Clerk account
- Cloudinary account
- OpenAI API key (for scoring engine)

### Frontend (Next.js)

```bash
cd Frontend-Focus/artifacts/equifeed
npm install
cp .env.local.example .env.local  # Configure env vars
npm run dev
```

### Scoring Engine (FastAPI)

```bash
cd scoring-engine
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure env vars
python main.py
```

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud
```

**Scoring Engine** (`.env`):
```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## 📁 Project Structure Details

### Frontend (Next.js App Router)
```
app/
├── (auth)/                 # Auth group (sign-in, sign-up, onboarding)
├── (dashboard)/            # Protected dashboard routes
│   ├── creator/            # Creator dashboard & post creation
│   └── analytics/          # Analytics dashboard (creator only)
├── (public)/               # Public routes
│   ├── explore/            # Explore grid & post detail
│   ├── trends/             # Trending content
│   └── feed/               # Home feed
├── api/                    # API routes
│   ├── posts/              # Posts CRUD
│   ├── analytics/          # Analytics endpoints
│   ├── trends/             # Trending endpoints
│   └── upload/             # Cloudinary upload
├── layout.tsx              # Root layout with providers
└── globals.css             # Global styles + Tailwind
```

### Scoring Engine (FastAPI)
```
scoring-engine/
├── main.py                 # FastAPI app, routes
├── scorer.py               # ScoringAlgorithm class
├── models.py               # Pydantic models (Post, Score, Feedback)
├── llm_client.py           # OpenAI client for content analysis
├── feedback.py             # Feedback loop implementation
└── requirements.txt
```

## 🔑 Key Components

### Scoring Algorithm (`scorer.py`)
```python
class ScoringAlgorithm:
    def calculate_score(self, post: Post, context: ScoringContext) -> ScoreBreakdown:
        # Engagement Score (0-100): likes, comments, shares, saves velocity
        # Relevance Score (0-100): User interest match, topic affinity
        # Quality Score (0-100): Content quality, originality, media quality
        # Final Score: Weighted combination with decay factors
```

### Post Detail Sheet (`PostDetailSheet.tsx`)
- Full-screen bottom sheet with scroll-snap
- Vertical feed navigation (swipe/arrow keys)
- Optimistic like/comment/share
- Keyboard accessible (ESC, arrows)

### Analytics Dashboard (`AnalyticsDashboard.tsx`)
- Recharts visualizations (Radar, Line, Bar, Area)
- Date range picker, export CSV
- Real-time WebSocket updates (planned)

## 🔧 Development

### Available Scripts

**Frontend:**
```bash
npm run dev        # Dev server on :3000
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

**Scoring Engine:**
```bash
python main.py           # Dev server on :8000
python -m pytest tests/  # Run tests
```

### Code Style
- **TypeScript**: Strict mode, path aliases (`@/`)
- **Python**: Black, Ruff, MyPy
- **Git**: Conventional commits, pre-commit hooks

## 🚀 Deployment

### Frontend (Vercel)
1. Connect repo to Vercel
2. Configure environment variables
3. Deploy (auto-detects Next.js)

### Scoring Engine (Railway/Render/Fly.io)
1. Create Python service
2. Set environment variables
3. Deploy with `python main.py`
4. Set `NEXT_PUBLIC_API_URL` to deployed URL

### Database (Neon)
1. Create Neon project
2. Run migrations: `npx drizzle-kit push`
3. Add `DATABASE_URL` to env

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/posts` | List posts (feed) |
| `POST` | `/api/posts` | Create post |
| `GET` | `/api/posts/[id]` | Get post detail |
| `POST` | `/api/posts/[id]/like` | Like/unlike post |
| `GET` | `/api/analytics` | Creator analytics |
| `GET` | `/api/trends` | Trending content |
| `POST` | `/api/upload` | Upload to Cloudinary |
| `POST` | `/api/score` | Score content (engine) |

## 🧪 Testing

```bash
# Frontend
npm run test        # Vitest
npm run test:e2e    # Playwright

# Scoring Engine
pytest tests/ -v
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- Issues: [GitHub Issues](https://github.com/Satish-vaishyar/EquiFeed---AI-powered-social-media-post-ranking-platform/issues)
- Discussions: [GitHub Discussions](https://github.com/Satish-vaishyar/EquiFeed---AI-powered-social-media-post-ranking-platform/discussions)