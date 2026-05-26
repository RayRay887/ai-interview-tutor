# Prepify

AI-powered technical interview preparation platform. Practice coding, communication, and behavioral interviews with realistic mock sessions.

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the landing page.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Routes

- `/` — Landing page with sample questions
- `/questions` — Full question bank
- `/practice/:slug` — Practice session (e.g. `/practice/two-sum`)

## Project Structure

```
src/
├── components/
│   ├── effects/      # Background, particles
│   ├── hero/         # Terminal preview
│   ├── layout/       # Navbar, Footer, Layout
│   ├── practice/     # Practice session UI
│   ├── questions/    # Question cards
│   ├── sections/     # Page sections
│   └── ui/           # Reusable UI primitives
├── data/             # Questions, nav, mock data
├── pages/            # Route pages
└── App.tsx
```
