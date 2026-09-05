# KinBech Admin Console

Complete admin panel for managing KinBech marketplace based on the detailed page structure specification.

## Features

### Overview Section
- **Dashboard**: Platform health overview with statistics, weekly charts, activity feed, and attention items

### Marketplace Section
- **Users**: Master list of buyer and seller accounts with verification and suspension controls
- **Shops**: Business seller profiles with verification queue and management
- **Listings**: Product listing moderation with approval/rejection workflows

### Trust & Safety Section
- **Reports**: User-reported content queue with priority-based triage
- **Reviews**: Rating and review moderation with flag management

### System Section
- **Notifications**: Platform-wide announcement composer with audience targeting
- **Settings & Roles**: Admin role management and platform configuration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on http://localhost:5001

### Installation

```bash
cd Admin
npm install
```

### Running the Admin Panel

```bash
npm run dev
```

The admin panel will be available at http://localhost:5173

## Theme & Design

The admin panel uses the same color scheme as the KinBech mobile app:

- **Primary Color**: Emerald Green (#059669)
- **Background**: Light gray (#F9FAFB)
- **Card**: White (#FFFFFF)
- **Text**: Dark gray (#111827)
- **Success**: Green (#059669)
- **Warning**: Amber (#D97706)
- **Error**: Red (#DC2626)
- **Info**: Blue (#2563EB)

## Page Structure

### Layout
- **Fixed Sidebar**: 280px width with KinBech branding and grouped navigation
- **Top Bar**: Page title, description, global search, and notifications
- **Content Area**: Page-specific content with consistent design patterns

### Navigation Groups
1. **Overview**: Dashboard
2. **Marketplace**: Users, Shops, Listings
3. **Trust & Safety**: Reports, Reviews
4. **System**: Notifications, Settings & Roles

### Page Features

#### Dashboard
- 4 stat cards with trend indicators (users, listings, reports, pending shops)
- Weekly listings bar chart
- Recent activity feed
- "Needs your attention" table with priority items

#### Users
- Filter chips: All, Verified, Unverified, Suspended
- Search by name, email, or phone
- Table with seller type, join date, listings count, status
- Actions: View profile, Suspend/Reinstate

#### Shops
- Filter chips: All, Pending Verification, Verified, Rejected
- Search by name, category, or location
- Table with category, owner, rating, verification status
- Actions: View, Approve/Reject (pending), Suspend (verified)

#### Listings
- Filter chips: All, Reported, Pending Review, Sold
- Search by title, category, or seller
- Table with post date, seller/shop, category, price, status
- Actions: View, Approve/Reject (pending), Remove (active/reported)

#### Reports
- Filter chips: Open, Under Review, Resolved
- Search by item, reason, or reporter
- Table with reported item type, reason, reporter, time, priority
- Actions: View, Dismiss, Take Action

#### Reviews
- Filter chips: Flagged, All Reviews
- Search by text, reviewer, or reviewee
- Table with review text, about, by, rating, flag reason
- Actions: View, Keep, Remove (flagged)

#### Notifications
- Compose form with title, message, audience targeting, delivery method
- Recently sent notifications list
- Draft management system

#### Settings & Roles
- Admin roles table with permissions
- Platform settings form (expiry, pricing, currency, support email)
- Role permission reference
- Invite new admin functionality

## Authentication

The admin panel uses JWT tokens for authentication. Login credentials should match the backend admin user setup.

## Project Structure

```
Admin/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with sidebar and top bar
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── pages/
│   │   ├── Login.jsx           # Admin login page
│   │   ├── Dashboard.jsx       # Dashboard with stats and activity
│   │   ├── Users.jsx           # Users management
│   │   ├── Shops.jsx           # Shops verification and management
│   │   ├── Listings.jsx        # Listings moderation
│   │   ├── Reports.jsx         # Reports queue and triage
│   │   ├── Reviews.jsx         # Reviews moderation
│   │   ├── Notifications.jsx   # Platform announcements
│   │   └── Settings.jsx        # System settings and roles
│   ├── services/
│   │   └── api.js              # API service with axios
│   ├── theme/
│   │   └── colors.js           # KinBech theme colors
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Complete styling
└── package.json
```

## Backend Integration

The admin panel expects the following API endpoints (to be implemented):

### Authentication
- `POST /auth/login` - Admin login
- `GET /auth/me` - Get current user

### Users
- `GET /admin/users` - Get all users
- `POST /admin/users/:id/suspend` - Suspend user
- `POST /admin/users/:id/reinstate` - Reinstate user

### Shops
- `GET /admin/shops` - Get all shops
- `POST /admin/shops/:id/approve` - Approve shop verification
- `POST /admin/shops/:id/reject` - Reject shop verification
- `POST /admin/shops/:id/suspend` - Suspend shop

### Listings
- `GET /admin/listings` - Get all listings
- `POST /admin/listings/:id/approve` - Approve listing
- `POST /admin/listings/:id/reject` - Reject listing
- `DELETE /admin/listings/:id` - Remove listing

### Reports
- `GET /admin/reports` - Get all reports
- `POST /admin/reports/:id/dismiss` - Dismiss report
- `POST /admin/reports/:id/action` - Take action on report

### Reviews
- `GET /admin/reviews` - Get all reviews
- `POST /admin/reviews/:id/keep` - Keep flagged review
- `DELETE /admin/reviews/:id` - Remove review

### Notifications
- `POST /admin/notifications/send` - Send notification
- `GET /admin/notifications/history` - Get notification history

### Settings
- `GET /admin/settings` - Get platform settings
- `PUT /admin/settings` - Update platform settings
- `GET /admin/admins` - Get admin list
- `POST /admin/admins/invite` - Invite new admin
- `DELETE /admin/admins/:id` - Remove admin

## Development

To add new features:

1. Create page components in `src/pages/`
2. Add routes in `src/App.jsx`
3. Update navigation in `src/components/Layout.jsx`
4. Add API calls in `src/services/api.js`
5. Maintain KinBech theme consistency

## Build Priority

Based on the specification, recommended implementation order:

1. **Phase 1**: Users (suspend/reinstate) and Reports (core trust & safety)
2. **Phase 2**: Shops (verification queue) and Listings (moderation)
3. **Phase 3**: Dashboard (once real data exists)
4. **Phase 4**: Reviews, Notifications, and Settings & Roles