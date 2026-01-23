# StorePlatform - Multi-Store E-commerce Platform

A full-stack platform that enables users to create and manage their own e-commerce stores.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Features

- 🔐 Store Owner Authentication (Sign up/Login)
- 💳 Credits System (100 credits on signup)
- 🏪 Create Multiple Stores
- 📊 Dashboard to manage stores
- 🔗 Unique Sub-URL for each store

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd shopify-clone
```

2. Install dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Set up environment variables
```bash
# Backend (.env)
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

4. Run the application
```bash
# Frontend (from frontend directory)
npm run dev

# Backend (from backend directory)
node src/index.js
```

## Deployment

This project is deployed on Vercel. The frontend is automatically deployed from the `main` branch.

## License

MIT
