# 🚔 Police Management System with Real-time Geofencing

A comprehensive police management system built with Next.js, React, and MongoDB that includes real-time geofencing, officer tracking, and supervisor dashboards.

## ✨ Features

- **🔐 Authentication System** - Secure login for officers and supervisors
- **📍 Real-time Geofencing** - 200m radius alerts when officers leave assigned areas
- **📱 Responsive Design** - Works on desktop and mobile devices
- **🗺️ Live Location Tracking** - Real-time officer location updates on supervisor maps
- **🔔 Smart Notifications** - Toast alerts and sticky banners for geofence violations
- **📊 Dashboard Analytics** - Statistics and personnel management
- **⚡ Socket.IO Integration** - Real-time bidirectional communication
- **🎯 Duty Management** - Clock in/out system with duty assignments

## 🛠️ Tech Stack

### Backend
- **Next.js 14** - Full-stack React framework
- **Node.js** - JavaScript runtime
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time communication
- **bcrypt** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Zustand** - State management
- **React Query** - Data fetching
- **Sonner** - Toast notifications

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/ashmit-w/bigflexhackers.git
cd bigflexhackers

# Run the setup script
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (free tier available)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/ashmit-w/bigflexhackers.git
cd bigflexhackers
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file (will be created automatically by setup script)
# Or create manually: touch .env.local
```

### 3. Configure Environment Variables

Edit `backend/.env.local` with your MongoDB credentials:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Development mode
NODE_ENV=development
```

### 4. MongoDB Atlas Setup

1. **Create a MongoDB Atlas account** at [mongodb.com](https://www.mongodb.com/atlas)
2. **Create a new cluster** (free tier available)
3. **Create a database user**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `your-username`
   - Password: `your-password`
   - Privileges: "Read and write to any database"
4. **Whitelist your IP address**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Add your current IP or `0.0.0.0/0` for all IPs (development only)
5. **Get your connection string**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `<database>` in your `.env.local`

### 5. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

### 6. Create Demo Data

```bash
# Go back to backend directory
cd ../backend

# Create demo officers and duties
node create-demo-data.js
```

### 7. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 8. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## 👥 Demo Accounts

After running `create-demo-data.js`, you can use these accounts:

### Officers
- **DEMO001** - John Smith (Constable) - Password: `demo123`
- **DEMO002** - Sarah Johnson (Head Constable) - Password: `demo123`
- **DEMO003** - Amit Patel (Sub Inspector) - Password: `demo123`

### Supervisors
- **SUPER001** - Supervisor One (Inspector) - Password: `demo123`

## 🧪 Testing Geofencing

1. **Login as DEMO003** (Amit Patel)
2. **Clock in** to start duty
3. **Open another tab** and login as a supervisor
4. **Go to Live Map** to see officer locations
5. **Test geofencing** by updating officer location:

```bash
# Move outside geofence (>200m)
curl -X POST http://localhost:3000/api/location/update \
  -H "Content-Type: application/json" \
  -d '{"officerId": "DEMO003", "lat": 15.2736, "lon": 73.9589}'

# Move back inside geofence
curl -X POST http://localhost:3000/api/location/update \
  -H "Content-Type: application/json" \
  -d '{"officerId": "DEMO003", "lat": 15.4989, "lon": 73.8278}'
```

## 📁 Project Structure

```
GPH/
├── backend/                 # Next.js API server
│   ├── src/
│   │   ├── app/api/        # API routes
│   │   ├── lib/            # Utilities (auth, mongodb)
│   │   └── schemas/        # Database models
│   ├── server.js           # Main server file
│   ├── package.json        # Dependencies
│   └── .env.local         # Environment variables
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── lib/           # Utilities
│   ├── package.json       # Dependencies
│   └── vite.config.ts     # Vite configuration
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Officer/supervisor login

### Duties
- `PATCH /api/duties/clock-in` - Clock in officer
- `PATCH /api/duties/clock-out` - Clock out officer
- `GET /api/duties/recent` - Get recent duties

### Location
- `POST /api/location/update` - Update officer location (with geofencing)

### Personnel
- `GET /api/officers/on-duty` - Get on-duty officers
- `GET /api/personnel/on-duty` - Get personnel overview

### Statistics
- `GET /api/stats/supervisor` - Supervisor dashboard stats
- `GET /api/stats/sectors` - Sector statistics

## 🌍 Geofencing System

The system implements real-time geofencing with the following features:

- **200-meter radius** around assigned duty locations
- **Real-time alerts** when officers leave their jurisdiction
- **Time tracking** for violations (10+ minutes triggers supervisor alerts)
- **Socket.IO events** for live updates:
  - `officer-geofence-exit` - Officer left jurisdiction
  - `officer-geofence-enter` - Officer returned to jurisdiction
  - `officer-location-updated` - Location update for supervisors
  - `supervisor-geofence-alert` - High-priority alert for supervisors

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your connection string in `.env.local`
   - Verify IP address is whitelisted in MongoDB Atlas
   - Ensure username/password are correct

2. **Socket.IO Not Working**
   - Check browser console for connection errors
   - Verify both frontend and backend are running
   - Check CORS settings

3. **Geofencing Not Triggering**
   - Ensure officer is clocked in
   - Check distance calculation (should be >200m)
   - Verify Socket.IO connection

4. **Build Errors**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again
   - Check Node.js version (v18+)

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=socket.io:*
```

## 📱 Mobile Support

The application is fully responsive and works on:
- **Desktop browsers** (Chrome, Firefox, Safari, Edge)
- **Mobile browsers** (iOS Safari, Chrome Mobile)
- **Tablet devices** (iPad, Android tablets)

## 🔒 Security Features

- **Password hashing** with bcrypt
- **JWT tokens** for authentication
- **CORS protection** for API endpoints
- **Input validation** on all API routes
- **Environment variable** protection

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

- **Heroku** - Add MongoDB Atlas addon
- **Railway** - Connect GitHub repository
- **DigitalOcean** - Use App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ashmit Arya**
- GitHub: [@ashmit-w](https://github.com/ashmit-w)
- Project: [Police Management System](https://github.com/ashmit-w/bigflexhackers)

## 🙏 Acknowledgments

- **MongoDB Atlas** for database hosting
- **Vercel** for deployment platform
- **Shadcn/ui** for beautiful components
- **Socket.IO** for real-time communication
- **Tailwind CSS** for styling

## 📞 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Contact the author** for direct support

---

**Happy coding! 🚔✨**