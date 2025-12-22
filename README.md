# BTTH 2.0 - Registration & Payment System

A complete registration and payment system for Bakliwal Tutorials Talent Hunt (BTTH 2.0) scholarship exam built with Next.js 16, MongoDB, and Razorpay.

## Features

- 🎨 Modern, responsive landing page with exam details
- 📝 Multi-step registration form with validation
- 💳 Integrated Razorpay payment gateway
- 💾 MongoDB for data persistence (draft & completed registrations)
- 🔐 Admin dashboard with Clerk authentication
- 📊 Advanced filtering, sorting, and CSV export
- 🌓 Dark mode support
- ⚡ Built with Next.js 16 App Router

## Tech Stack

- **Framework:** Next.js 16
- **Database:** MongoDB
- **Payment:** Razorpay
- **Authentication:** Clerk
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **Form Validation:** React Hook Form + Zod
- **HTTP Client:** Axios

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Razorpay account
- Clerk account

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

3. Update `.env.local` with your credentials:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Clerk (for admin authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── payment/          # Payment API routes
│   │   └── registrations/    # Registration API routes
│   ├── admin/                # Admin dashboard
│   ├── register/             # Registration form
│   ├── registration-success/ # Success page
│   └── page.tsx              # Landing page
├── components/
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── axios.ts              # Axios instance
│   ├── mongodb.ts            # MongoDB connection
│   └── utils.ts              # Utility functions
└── tasks/
    └── project.md            # Project requirements
```

## Key Pages

- **`/`** - Landing page with exam details
- **`/register`** - Registration form with payment
- **`/registration-success`** - Post-payment success page
- **`/admin`** - Admin dashboard (requires authentication)

## API Routes

### Registrations

- `POST /api/registrations/draft` - Create draft registration
- `GET /api/registrations/[id]` - Get registration by ID
- `GET /api/registrations/list` - List all registrations (admin only)

### Payment

- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment signature

## Payment Integration

The system uses **Razorpay** for payment processing:

1. User fills registration form
2. Draft registration saved to MongoDB
3. Razorpay order created
4. Payment modal opens
5. On success, payment verified and registration marked complete
6. User redirected to success page

## Admin Dashboard

Access the admin dashboard at `/admin` (requires Clerk authentication):

- View all registrations
- Filter by class, exam date, status
- Search by name, mobile, or school
- Sort by any column
- Export data to CSV

## Database Schema

### Registration Document

```javascript
{
  studentName: String,
  currentClass: String,
  schoolName: String,
  parentMobile: String,
  examDate: Date,
  referralSource: String,
  referralOther: String (optional),
  status: 'draft' | 'completed',
  paymentStatus: 'pending' | 'paid',
  paymentId: String,
  orderId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Deployment

1. Set up MongoDB Atlas database
2. Configure Razorpay production keys
3. Set up Clerk production instance
4. Deploy to Vercel or your preferred platform
5. Update environment variables in production

## Important Notes

- Registration fee is set to ₹500 (50000 paise)
- Exam dates: 11th January 2026 and 18th January 2026
- All registrations are saved in draft state before payment
- Only completed payments update registration status to 'completed'

## Support

For issues or questions, contact the development team.
