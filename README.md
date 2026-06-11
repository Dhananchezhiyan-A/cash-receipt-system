# DreamCode Technology - Cash Receipt Management System

A full-stack MERN cash receipt and payment voucher management system with JWT authentication, role-based access control, user management, live receipt previews, printable/PDF receipts, dashboard analytics, and transaction history.

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Axios
- React Hot Toast
- jsPDF and html2canvas
- Lucide React icons

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Helmet, CORS, Morgan, Express Rate Limit

## Main Features

### Authentication
- Login with email and password.
- Access token and refresh token support.
- JWT-protected API routes.
- Automatic access-token refresh from the frontend API client.
- Passwords stored securely with bcrypt.
- Deactivated or soft-deleted users cannot log in or refresh tokens.
- Authenticated profile endpoint.
- Change password endpoint.

### Role-Based Access Control

The application supports three roles:

| Role | Permissions |
| --- | --- |
| Admin | Full access to users, receipts, vouchers, dashboard, transaction history, edit, delete, reset password, activate/deactivate users |
| Manager | View dashboard, all users read-only, all receipts and vouchers read-only, print/share/download transactions |
| User | Create and manage only their own receipts and vouchers, cannot access user management, cannot view other users' data |

### Dashboard
- Total cash receipts.
- Total payment vouchers.
- Total amount received.
- Total amount paid.
- Net balance.
- Today and monthly cash movement.
- Total users, active users, inactive users, admins, managers, and normal users for Admin/Manager.
- Recent transactions.
- Recent users for Admin/Manager.
- Monthly receipts and payments chart.
- Clickable dashboard cards that navigate to filtered pages.

Dashboard navigation examples:
- Total Cash Receipts -> `/receipts?type=in`
- Total Payment Vouchers -> `/receipts?type=out`
- Total Users -> `/users`
- Active Users -> `/users?status=active`
- Admins -> `/users?role=admin`
- Recent Transactions -> `/transactions`

### Cash Receipt IN
- Create cash receipts for money received.
- Live receipt preview updates as the form changes.
- Automatic amount-in-words generation.
- Client and server validation.
- Print and PDF download support.
- Form resets after successful save.

### Cash Receipt OUT / Payment Voucher
- Create payment vouchers for money paid out.
- Live voucher preview.
- Automatic amount-in-words generation.
- Print and PDF download support.
- Form resets after successful save.

### Transaction History
- Combined receipt and voucher history.
- URL-driven filters, so search/filter/pagination state is preserved.
- Search by number, party, or purpose.
- Filter by transaction type, date range, and payment mode.
- Pagination and date sorting.
- Responsive table.
- View, edit, delete, print, share, and download PDF actions based on role.
- Admin can delete transactions.
- Manager has read-only transaction access.
- User sees only their own transactions.

### User Management
- Admin and Manager can view users.
- Admin can create users.
- Admin can edit users.
- Admin can change roles.
- Admin can activate/deactivate users.
- Admin can soft-delete users.
- Admin can reset passwords.
- Manager has read-only user list access.
- Search by name or email.
- Filter by role and status.
- Pagination and sorting.
- User list state is reflected in the URL.

## Project Structure

```text
cash-receipt-system/
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |   |-- layout/
|   |   |   `-- receipt/
|   |   |-- context/
|   |   |-- pages/
|   |   |   |-- Dashboard/
|   |   |   |-- Login/
|   |   |   |-- ReceiptIn/
|   |   |   |-- ReceiptList/
|   |   |   |-- ReceiptOut/
|   |   |   `-- Users/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- utils/
|   |-- app.js
|   |-- server.js
|   `-- package.json
`-- README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB local instance or MongoDB Atlas connection string

## Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cash-receipt-system
JWT_SECRET=replace-with-a-strong-access-token-secret
JWT_REFRESH_SECRET=replace-with-a-strong-refresh-token-secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Optional: create `client/.env` if your API URL is different from the default:

```env
VITE_API_URL=http://localhost:5000/api
```

The frontend defaults to `http://localhost:5000/api` when `VITE_API_URL` is not set.

## Installation and Setup

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Seed demo users

```bash
npm run seed
```

Seeded demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@dreamcode.tech | admin123 |
| Manager | manager@dreamcode.tech | manager123 |
| User | user@dreamcode.tech | user123 |

Note: New users created from User Management require passwords of at least 8 characters. The seed script keeps the original demo passwords from the project.

### 3. Start the backend

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

### 4. Install frontend dependencies

Open a second terminal:

```bash
cd client
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Available Scripts

### Backend

```bash
npm run dev      # start Express server with nodemon
npm start        # start Express server with node
npm run seed     # create demo users
```

### Frontend

```bash
npm run dev      # start Vite dev server
npm run build    # create production build
npm run preview  # preview production build
```

## Frontend Routes

| Route | Access | Description |
| --- | --- | --- |
| `/login` | Public | Login page |
| `/` | Authenticated | Dashboard |
| `/receipts/in` | Admin, Manager, User | Cash receipt IN form |
| `/receipts/out` | Admin, Manager, User | Payment voucher OUT form |
| `/receipts` | Authenticated | Transaction list with filters |
| `/transactions` | Authenticated | Transaction history |
| `/users` | Admin, Manager | User management page |

## API Endpoints

All endpoints use the `/api` prefix.

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Login and receive tokens |
| POST | `/auth/refresh` | Public with refresh token | Refresh access token |
| POST | `/auth/logout` | Public | Logout response |
| GET | `/auth/profile` | Authenticated | Get current user |
| POST | `/auth/change-password` | Authenticated | Change own password |

### Users

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/users` | Admin, Manager | Paginated user list |
| GET | `/users/:id` | Admin, Manager | View user details |
| POST | `/users` | Admin | Create user |
| PUT | `/users/:id` | Admin | Update user |
| PATCH | `/users/:id/status` | Admin | Activate/deactivate user |
| POST | `/users/:id/reset-password` | Admin | Reset password |
| DELETE | `/users/:id` | Admin | Soft-delete user |

Supported user-list query parameters:

```text
q
role=admin|manager|user
status=active|inactive
page
limit
sortBy=name|email|role|active|createdAt|updatedAt
sortOrder=asc|desc
```

### Cash Receipts

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/receipts` | Authenticated | List receipts |
| POST | `/receipts` | Authenticated | Create receipt |
| GET | `/receipts/:id` | Authenticated | View receipt |
| PUT | `/receipts/:id` | Admin, User owner | Update receipt |
| DELETE | `/receipts/:id` | Admin | Soft-delete receipt |

### Payment Vouchers

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/vouchers` | Authenticated | List vouchers |
| POST | `/vouchers` | Authenticated | Create voucher |
| GET | `/vouchers/:id` | Authenticated | View voucher |
| PUT | `/vouchers/:id` | Admin, User owner | Update voucher |
| DELETE | `/vouchers/:id` | Admin | Soft-delete voucher |

Supported receipt/voucher query parameters:

```text
q
from
to
paymentMode
page
limit
sortBy
sortOrder
```

### Dashboard

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/dashboard/stats` | Authenticated | Dashboard totals, recent activity, chart data |
| GET | `/dashboard/transactions` | Authenticated | Combined receipt and voucher history |

Supported transaction-history query parameters:

```text
q
type=all|in|out
from
to
paymentMode
page
limit
sortOrder=asc|desc
```

## Data Models

### User

- `name`
- `email`
- `password`
- `role`: `admin`, `manager`, `user`
- `active`
- `deleted`
- `deletedAt`
- `createdAt`
- `updatedAt`

### CashReceipt

- `receiptNumber`
- `date`
- `receivedFrom`
- `purpose`
- `paymentMode`
- `amount`
- `amountInWords`
- `receivedBy`
- `createdBy`
- `deleted`
- `createdAt`
- `updatedAt`

### PaymentVoucher

- `voucherNumber`
- `date`
- `paidTo`
- `purpose`
- `paymentMode`
- `amount`
- `amountInWords`
- `approvedBy`
- `createdBy`
- `deleted`
- `createdAt`
- `updatedAt`

## Validation Rules

- Receipt and voucher amount must be greater than `0` and less than or equal to `999999999.99`.
- Amount accepts numeric input and formatted strings such as `1,000.50`.
- Date must be valid.
- Payment mode must be one of:
  - Cash
  - UPI
  - Bank Transfer
  - Cheque
  - NEFT
  - RTGS
  - IMPS
  - Card
  - Other
- User email must be unique.
- New user and reset passwords must be at least 8 characters.

## Print and PDF

The receipt and voucher preview is the source for print and PDF output.

- Print uses browser print support and print-specific CSS.
- PDF uses `html2canvas` and `jsPDF`.
- The DreamCode Technology logo appears in the sidebar, login page, receipt preview, print output, and PDF.

## Security Notes

- API routes are protected with JWT middleware where required.
- Passwords are hashed with bcrypt before save.
- Soft-deleted and inactive users are blocked from authentication.
- User management mutation routes are Admin-only.
- Manager transaction access is read-only.
- Normal users are scoped to their own receipts and vouchers.
- Express uses Helmet, CORS, JSON body limits, request logging, and rate limiting.

## Production Notes

- Replace JWT secrets with strong private values.
- Set `CLIENT_URL` to the deployed frontend origin.
- Set `VITE_API_URL` to the deployed backend `/api` URL.
- Use a managed MongoDB instance or a properly secured MongoDB server.
- The frontend build may warn about large chunks because PDF generation dependencies are bundled. This does not block the build.

## Branding

Logo files:

```text
client/public/logo.png
client/src/assets/logo.png
```

Replace both files to update the application branding.
#   c a s h - r e c e i p t - s y s t e m  
 