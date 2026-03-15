# Consultant Feature Documentation - Roman Urdu

## Overview
Arachnie mein consultant feature ek powerful system hai jo users ko US immigration ke bare mein personalized guidance provide karti hai. Ye feature users ko consultation ke liye appointment book karne ki facility deti hai aur admins ko requests manage karne ki facility deti hai.

## User Side Functionality (User Kaam Kaise Karta Hai)

### 1. Consultation Booking Process
- User services page pe ja sakta hai aur "Book Consultation" button click kar sakta hai
- 3-step form hai jisme user apni details fill karta hai:
  - Step 1: Issue category (jese I-130 petition preparation, K-1 fiancé visa, etc.), visa category (IR-1, CR-1, K-1, etc.), case stage (USCIS, NVC, interview, etc.) select karta hai
  - Step 2: Personal information jese name, email, WhatsApp phone number, preferred language (English/Urdu), aur case summary provide karta hai
  - Step 3: Available time slots select karta hai aur agar zarurat ho to 2 alternate slots bhi select kar sakta hai

### 2. Reference ID System
- Har submission ke baad user ko ek unique reference ID milta hai (jese REQ-123456)
- Ye ID user apni requests track karne ke liye use kar sakta hai

### 3. My Requests Section
- User "My Requests" tab pe ja kar apne sabhi pending aur confirmed appointments dekh sakta hai
- Search functionality se user apne requests ko reference ID, name ya email ke basis pe filter kar sakta hai
- Agar admin ne alternative slots propose kiye hain to user unme se koi ek slot approve kar sakta hai

### 4. Appointment Statuses
- Pending Approval: User ne slot select kiya hai lekin admin ne confirm nahi kiya
- Confirmed: Admin ne appointment confirm kar diya hai
- Alternatives Proposed: Admin ne user ke liye alternative slots suggest kiye hain
- Needs More Info: Admin ko user se additional information chahiye
- Canceled: Appointment cancel ho gaya hai

## Admin Side Functionality (Admin Portal)

### 1. Admin Dashboard
- Admin admin panel mein consultation requests dekh sakta hai
- Different statuses ke hisaab se requests filter ki ja sakti hain
- Stats show hoti hain jese pending requests, confirmed requests, etc.

### 2. Request Management
- Admin har request ki details dekh sakta hai
- Actions available hain:
  - Approve Slot: User ke requested slot ko confirm kar deta hai
  - Propose Alternatives: User ke liye 3 tak alternative slots suggest kar sakta hai
  - Need Info: User se additional information mangne ke liye
  - Cancel: Request cancel kar deta hai

### 3. Alternative Slots System
- Agar user ka preferred slot available nahi hai to admin alternative slots suggest kar sakta hai
- User ko notification jaati hai aur wo alternative slots mein se koi ek select kar sakta hai

## Data Flow and API Endpoints

### 1. Frontend Components
- `app/book-consultation/page.tsx`: Main consultation booking form
- `app/admin/components/consultation-requests/ConsultationRequestsTable.tsx`: Admin dashboard for managing requests

### 2. Backend API Routes
- `app/api/consultation/route.ts`: Handle karta hai:
  - GET: Sabhi consultation requests fetch karta hai
  - POST: Naya consultation request create karta hai
  - PUT: Existing request ko update karta hai (approve, propose alternatives, etc.)

- `app/api/consultation/slots/route.ts`: Handle karta hai:
  - GET: Available time slots fetch karta hai
  - POST: Naya time slot create karta hai
  - PUT: Existing time slot update karta hai

### 3. Service Layer
- `lib/services/consultationService.ts`: Business logic aur database operations handle karta hai
- Supabase database se integration karta hai

### 4. Data Types
- `types/consultation.ts`: Define karta hai:
  - ConsultationBooking: Main request object
  - TimeSlot: Available time slots
  - ConsultationRequest: Request creation object

## Database Schema

### 1. consultation_bookings table (Supabase)
- id: Unique identifier
- reference_id: User ke liye unique reference code
- issue_category: Immigration issue ka type
- visa_category: Visa type (IR-1, K-1, etc.)
- case_stage: Current case stage (USCIS, NVC, etc.)
- urgency: Normal ya urgent priority
- preferred_language: User ki preferred language
- full_name, email, whatsapp_phone: Contact information
- embassy_consulate: Related embassy ya consulate
- case_summary: Detailed case description
- selected_slot: User ke requested appointment time
- alternate_slots: Admin ke suggested alternative times
- status: Current request status
- admin_notes: Admin ke additional notes
- created_at, updated_at, expires_at: Timestamps

### 2. time_slots table (Supabase)
- id: Unique identifier
- date: Slot date
- start_time, end_time: Slot timing
- status: Available, unavailable, etc.
- max_bookings: Maximum allowed bookings for this slot
- current_bookings: Currently booked appointments

## Technical Architecture

### 1. Frontend Technology
- Next.js 14 with App Router
- React for UI components
- Tailwind CSS for styling
- Lucide React for icons

### 2. Backend Technology
- Next.js API routes
- Supabase for database
- TypeScript for type safety

### 3. State Management
- React hooks (useState, useEffect) for component state
- Client-side form management

## Security and Validation

### 1. Input Validation
- Frontend mein required field validation
- Backend mein complete data validation
- Email format validation

### 2. Data Protection
- Supabase authentication (though not fully implemented in provided code)
- Secure API endpoints
- Environment variables for sensitive data

## User Experience Features

### 1. Multi-step Form
- 3-step process for easy navigation
- Progress indicator
- Responsive design

### 2. Real-time Updates
- Live status updates
- Instant feedback on actions
- Loading indicators

### 3. Search and Filter
- Powerful search functionality
- Multiple filter options
- Quick access to specific requests

## Admin Experience Features

### 1. Dashboard Overview
- Visual statistics
- Quick action buttons
- Status-based filtering

### 2. Efficient Management
- Bulk operations capability
- Detailed request view
- Quick action tools

### 3. Communication Tools
- Note-taking system
- Alternative slot suggestions
- Status update notifications

## Integration Points

### 1. Future Enhancements
- Email/SMS notifications (mentioned in code but not fully implemented)
- Document attachment system
- Payment integration possibility
- Video consultation setup

## Conclusion

Ye consultant feature ek comprehensive solution hai jo users aur admins dono ke liye efficient workflow provide karti hai. Users immigration consultation ke liye easily appointment book kar sakte hain aur admins requests ko efficiently manage kar sakte hain. System scalable hai aur future enhancements ke liye taiyar hai.