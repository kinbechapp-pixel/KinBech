# KinBech - Local Marketplace Application

A complete local marketplace solution with mobile app, backend API, and admin panel.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd KinBech
```

2. **Install root dependencies**
```bash
npm install
```

3. **Install individual service dependencies**
```bash
cd Backend && npm install && cd ..
cd Admin && npm install && cd ..
cd Mobile && npm install && cd ..
```

4. **Start MongoDB**
Make sure MongoDB is running locally on port 27017 or update the connection string in `Backend/src/config/db.js`

### Running the Project

#### Run All Services (Recommended)
```bash
# Development mode (Backend + Admin Panel)
npm run dev

# Production mode
npm start
```

#### Run Individual Services

**Backend API**
```bash
cd Backend
npm run dev        # Development with hot reload
npm start          # Production
```
- API runs on: http://localhost:5001

**Admin Panel**
```bash
cd Admin
npm run dev        # Development with hot reload
npm run build      # Build for production
npm run preview    # Preview production build
```
- Admin panel runs on: http://localhost:5173 (dev)

**Mobile App**
```bash
cd Mobile
npm start          # Start Expo development server
```
- Scan QR code with Expo Go app

## 📁 Project Structure

```
KinBech/
├── Backend/          # Node.js + Express API
├── Admin/            # React + Vite Admin Panel
├── Mobile/           # React Native + Expo Mobile App
├── package.json      # Root scripts for running all services
└── README.md         # This file
```

## 🔗 Service URLs

- **Backend API:** http://localhost:5001
- **Admin Panel:** http://localhost:5173
- **Mobile App:** Via Expo Go (scan QR code)

## 📱 Features

### Mobile App
- Phone-based authentication
- Individual & Shop seller modes
- Location-based item discovery
- Real-time chat
- Reviews & ratings
- Wishlist functionality

### Admin Panel
- Dashboard with statistics
- User management
- Shop verification
- Listing moderation
- Review moderation
- Report handling
- Broadcast notifications

## 📚 Documentation

For detailed project documentation, see [PROJECT_REPORT.md](./PROJECT_REPORT.md)

## ⚠️ Development Notes

- Admin Panel currently uses mock data (API integration pending)
- Backend API is fully functional for mobile app
- MongoDB connection required for backend to work

## 🛠️ Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running: `mongod` or use MongoDB Atlas
- Check connection string in `Backend/src/config/db.js`

**Port Already in Use**
- Backend uses port 5001
- Admin panel uses port 5173
- Mobile uses Expo's default ports

**Dependencies Issues**
- Delete `node_modules` and run `npm install` again
- Try clearing npm cache: `npm cache clean --force`

## 📄 License

This project is private and confidential.

---

**Last Updated:** September 5, 2026


============ admin default login ===============
 Default admin user create ho gaya:
 
Email: admin@kinbech.com
Password: admin123
Phone: 9800000000