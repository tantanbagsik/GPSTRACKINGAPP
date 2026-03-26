# GPS Tracking App

A real-time vehicle tracking system with a Next.js web dashboard, similar to Google Find My Device.

## Features

- 📍 **Live GPS Tracking** - Real-time vehicle location on map
- 🔐 **Login System** - Google/Facebook OAuth authentication
- 🚗 **Vehicle Management** - Add and manage vehicles
- 📊 **Dashboard** - Vehicle stats and status
- 🔔 **GPS Toggle** - Turn GPS on/off per vehicle
- 📱 **Responsive Design** - Works on mobile and desktop

## Tech Stack

- **Frontend**: Next.js 16.2.1 + Tailwind CSS
- **Auth**: NextAuth.js (simulated OAuth)
- **Backend**: C++ GPS Tracker (optional)
- **Database**: SQLite
- **Deployment**: Vercel

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
http://localhost:3000

## Login

1. Go to http://localhost:3000/login
2. Click "Continue with Google"
3. Access Live Tracking at http://localhost:3000/live-tracking

## Live Tracking

- Click **GPS ON** button to activate tracking
- Watch vehicle appear on map in real-time
- Click vehicle to see details (speed, battery, signal)

## Deployment

### Vercel
```bash
vercel --prod
```

### GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── page.js          # Dashboard
│   │   ├── login/page.js    # Login page
│   │   ├── vehicles/        # Vehicles page
│   │   ├── live-tracking/   # Live GPS tracking
│   │   ├── admin/           # Admin panel
│   │   └── api/             # API routes
│   └── core/
│       ├── car_tracking.cpp # C++ GPS tracker
│       └── gps_tracker.cpp  # GPS module
├── package.json
├── vercel.json
└── README.md
```

## API Endpoints

- `GET /api/vehicles` - List vehicles
- `POST /api/gps/toggle` - Toggle GPS
- `GET /api/gps/live` - Get live GPS data

## License

MIT
