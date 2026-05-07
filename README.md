# DecorGenie AI — Full Production App

AI-powered interior designer for Indian homes. Upload a room photo, choose a style, and get instant redesigns, color palettes, furniture layouts, Vastu tips, renovation budgets, and shopping recommendations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| Backend | Python FastAPI |
| AI — Vision & Reasoning | Anthropic Claude (claude-sonnet-4-20250514) |
| AI — Image Generation | Stability AI SDXL / Replicate |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (room images) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Project Structure

```
decorgenie/
├── frontend/               # Next.js app
│   ├── pages/
│   │   ├── index.js        # Landing page + designer
│   │   ├── dashboard.js    # User saved designs
│   │   └── api/            # Next.js API proxy routes
│   ├── components/
│   │   ├── Designer.jsx    # Main AI designer component
│   │   ├── ResultsTabs.jsx # 5-tab results panel
│   │   ├── ShoppingGrid.jsx
│   │   ├── PricingSection.jsx
│   │   └── Navbar.jsx
│   ├── lib/
│   │   ├── api.js          # Backend API calls
│   │   ├── supabase.js     # Supabase client
│   │   └── hooks.js        # Custom React hooks
│   ├── styles/
│   │   └── globals.css
│   ├── .env.local.example
│   └── package.json
│
├── backend/                # FastAPI app
│   ├── main.py             # App entry point
│   ├── routes/
│   │   ├── design.py       # /api/design — AI design generation
│   │   ├── image.py        # /api/image — SDXL image generation
│   │   └── user.py         # /api/user — saved designs
│   ├── services/
│   │   ├── claude.py       # Claude AI integration
│   │   ├── stability.py    # Stability AI integration
│   │   └── supabase.py     # Database service
│   ├── models/
│   │   └── schemas.py      # Pydantic models
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── supabase/
│   └── schema.sql          # Database schema
│
└── README.md
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/decorgenie.git
cd decorgenie

# Frontend
cd frontend && npm install

# Backend
cd ../backend && pip install -r requirements.txt
```

### 2. Set Up Environment Variables

**Frontend** — copy `frontend/.env.local.example` → `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend** — copy `backend/.env.example` → `backend/.env`:
```
ANTHROPIC_API_KEY=your_anthropic_key
STABILITY_API_KEY=your_stability_key         # optional
REPLICATE_API_TOKEN=your_replicate_token     # optional
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Storage and create a bucket called `room-images`
4. Copy your project URL and keys to `.env` files

### 4. Run Locally

```bash
# Terminal 1 — Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Deploy Frontend to Vercel

```bash
cd frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard → Settings → Environment Variables.

### Deploy Backend to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select `backend/` as root directory
4. Add environment variables in Railway dashboard
5. Railway auto-detects the `Dockerfile` and deploys

After Railway gives you a URL (e.g. `https://decorgenie-api.railway.app`), update `NEXT_PUBLIC_BACKEND_URL` in Vercel.

---

## API Keys You Need

| Key | Where to Get | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | ✅ Yes |
| `SUPABASE_URL` + keys | [supabase.com](https://supabase.com) | ✅ Yes |
| `STABILITY_API_KEY` | [platform.stability.ai](https://platform.stability.ai) | Optional |
| `REPLICATE_API_TOKEN` | [replicate.com](https://replicate.com) | Optional |

> Without Stability/Replicate keys, the app generates text-based design plans only (still very useful). Image generation is an enhancement.

---

## Monetization Setup

### Freemium Limits
Edit `backend/services/limits.py` to configure:
- Free tier: 3 designs/month
- Pro tier: 25 designs/month  
- Business tier: unlimited

### Payment Integration (Razorpay)
Add your Razorpay keys to `.env`:
```
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

### Affiliate Links
Edit `frontend/lib/shopping.js` to add your affiliate IDs for:
- Pepperfry (peppercommerce)
- Amazon India Associates
- IKEA India

---

## Roadmap

- [x] Phase 1 — AI design generation (text: colors, materials, budget, furniture)
- [x] Phase 2 — Before/After UI, shopping grid, 5-tab results
- [x] Phase 3 — User auth, saved designs, PDF export
- [ ] Phase 4 — SDXL image generation (photorealistic renders)
- [ ] Phase 5 — AR room preview (WebXR)
- [ ] Phase 6 — CAD floorplan export, contractor matching

---

## License
MIT — built with ✦ in Madurai, Tamil Nadu.
