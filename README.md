# 🚀 Smart Billing System - Complete Project

A full-stack invoicing and billing system built with React, Node.js, Express, and PostgreSQL.

## 📋 Features

### ✅ Authentication & Authorization
- JWT-based secure login/logout
- Role-based access control (Admin, Manager, User, Staff, Driver)
- Password hashing with bcrypt

### ✅ Dashboard
- Real-time statistics (Products, Customers, Invoices, Revenue, Employees, Attendance)
- Recent invoices overview
- Auto-refreshing data

### ✅ Products Management
- CRUD operations (Create, Read, Update, Delete)
- Product images support (Unsplash URLs)
- Excel export functionality
- HSN code tracking
- Rate and unit management

### ✅ Customers Management
- Complete customer database
- Company details and contact persons
- GST number tracking
- Excel export functionality
- Email and phone management

### ✅ Invoices System
- **Create invoices** with multiple products
- **Automatic GST calculation** (28%: 14% CGST + 14% SGST)
- **View invoice** modal with professional layout
- **Print functionality** with CSS media queries
- **PDF generation** with jsPDF and jspdf-autotable
- **Excel export** for all invoices
- Status tracking (Pending/Paid/Cancelled)
- Invoice numbering system
- Customer selection and new customer creation

### ✅ Employees Management
- Add/Edit/Delete employees
- Role assignment (Admin, Manager, User, Staff, Driver)
- Contact information management
- Password management

### ✅ Attendance System
- Daily attendance marking
- Check-in/Check-out time tracking
- Status tracking (Present/Absent/Leave/Half-day)
- Employee-wise attendance records
- Date-wise filtering

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **XLSX** - Excel export
- **jsPDF** - PDF generation
- **Vite** - Build tool

## 📁 Project Structure

```
tilesoft/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           # PostgreSQL connection
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login/Register
│   │   │   ├── productController.js  # Products CRUD
│   │   │   ├── customerController.js # Customers CRUD
│   │   │   ├── invoiceController.js  # Invoices with GST
│   │   │   ├── userController.js     # Employees CRUD
│   │   │   ├── attendanceController.js # Attendance tracking
│   │   │   └── dashboardController.js  # Statistics
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification
│   │   ├── routes/
│   │   │   └── *.js                  # API routes
│   │   └── server.js                 # Express server
│   ├── package.json
│   └── .env                          # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   │   └── Navbar.jsx            # Top navigation
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── Dashboard.jsx         # Dashboard with stats
│   │   │   ├── Products.jsx          # Products management
│   │   │   ├── Customers.jsx         # Customers management
│   │   │   ├── Invoices.jsx          # Invoices with PDF
│   │   │   ├── Employees.jsx         # Employee management
│   │   │   └── Attendance.jsx        # Attendance marking
│   │   ├── services/
│   │   │   └── api.js                # Axios API wrapper
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── database/
    └── database-schema.sql           # Complete database schema
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Database Setup

**Install PostgreSQL:**
Download from: https://www.postgresql.org/download/

**Create Database:**
```bash
createdb tilesoft_db
```

**Run Schema:**
```bash
psql -U postgres -d tilesoft_db -f database/database-schema.sql
```

This will:
- Create all tables (users, products, customers, invoices, invoice_items, attendance)
- Insert sample data (admin user, products, customers, invoices)
- Set up indexes for performance

**Default Admin User:**
- Email: `admin@tilesoft.com`
- Password: `admin123`

### 2. Backend Setup

```bash
cd backend
npm install
```

**Configure Environment:**
Create/Edit `.env` file:
```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tilesoft_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
```

**Start Backend:**
```bash
npm run dev
```

Should display: `🚀 Server running on port 5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Start Frontend:**
```bash
npm run dev
```

Should display: `Local: http://localhost:5173/`

### 4. Access Application

Open browser: **http://localhost:5173**

Login with:
- Email: `admin@tilesoft.com`
- Password: `admin123`

## 📖 Usage Guide

### Creating an Invoice

1. Go to **Invoices** page
2. Click **+ Create Invoice**
3. Select customer (or create new)
4. Add products with quantities
5. System auto-calculates GST (28%)
6. Save invoice
7. View/Print/Download PDF

### PDF Generation

Invoices can be downloaded as professional PDFs with:
- Company header with blue branding
- Customer details (Bill To)
- Invoice info (Number, Dates, Status)
- Items table with quantities and rates
- GST breakdown (CGST 14% + SGST 14%)
- Total amount
- Terms & conditions footer

### Excel Export

All modules support Excel export:
- Products → Export product catalog
- Customers → Export customer database
- Invoices → Export invoice records

### Attendance Marking

1. Go to **Attendance** page
2. Click **+ Mark Attendance**
3. Select employee and date
4. Enter check-in/check-out times
5. Select status (Present/Absent/Leave)
6. Save

## 🗄️ Database Schema

### Users Table
- Admin, employees, and staff
- Roles: admin, manager, user, staff, driver
- Password: bcrypt hashed

### Products Table
- Product catalog
- HSN codes, rates, units
- Optional image URLs

### Customers Table
- Company details
- GST numbers
- Contact information

### Invoices Table
- Invoice header
- Links to customer
- Status tracking (pending/paid/cancelled)
- Subtotal and total amounts

### Invoice Items Table
- Line items for each invoice
- Product details and quantities
- Rate and amount per item

### Attendance Table
- Daily attendance records
- Check-in/check-out times
- Status tracking

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/login       - User login
POST /api/auth/register    - User registration
GET  /api/auth/me          - Get current user
```

### Products
```
GET    /api/products       - Get all products
GET    /api/products/:id   - Get product by ID
POST   /api/products       - Create product
PUT    /api/products/:id   - Update product
DELETE /api/products/:id   - Delete product
```

### Customers
```
GET    /api/customers       - Get all customers
GET    /api/customers/:id   - Get customer by ID
POST   /api/customers       - Create customer
PUT    /api/customers/:id   - Update customer
DELETE /api/customers/:id   - Delete customer
```

### Invoices
```
GET    /api/invoices            - Get all invoices
GET    /api/invoices/:id        - Get invoice with items
POST   /api/invoices            - Create invoice
PUT    /api/invoices/:id        - Update invoice
DELETE /api/invoices/:id        - Delete invoice
PATCH  /api/invoices/:id/status - Update invoice status
```

### Employees
```
GET    /api/users       - Get all employees
GET    /api/users/:id   - Get employee by ID
POST   /api/users       - Create employee
PUT    /api/users/:id   - Update employee
DELETE /api/users/:id   - Delete employee
```

### Attendance
```
GET    /api/attendance        - Get all attendance records
GET    /api/attendance/today  - Get today's attendance
GET    /api/attendance/:id    - Get attendance by ID
POST   /api/attendance        - Mark attendance
PUT    /api/attendance/:id    - Update attendance
DELETE /api/attendance/:id    - Delete attendance
```

### Dashboard
```
GET /api/dashboard/stats - Get dashboard statistics
```

## 🐛 Troubleshooting

### Backend Won't Start
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Run `npm install` again
- Check port 5000 is available

### Frontend Won't Start
- Run `npm install` again
- Check port 5173 is available
- Clear browser cache

### Database Connection Error
- Verify PostgreSQL service is running
- Check database name exists: `psql -l`
- Verify credentials in `.env`

### 401 Unauthorized Error
- Token expired → Logout and login again
- Clear browser localStorage
- Check JWT_SECRET in backend `.env`

### Invoice Creation Fails
- Check backend logs for errors
- Verify customer exists
- Verify products exist
- Check database schema matches code

## 📝 Sample Data

The schema includes sample data:
- **1 Admin user**: admin@tilesoft.com / admin123
- **5 Products**: Various tile products with images
- **3 Customers**: ABC Constructions, XYZ Developers, Prime Interiors
- **3 Invoices**: Sample invoices with different statuses
- **3 Additional employees**: Sales Manager, Warehouse Staff, Delivery Driver
- **Attendance records**: Sample for current date

## 🎨 Customization

### Change Company Name
Edit in:
- Frontend: `Login.jsx`, `Sidebar.jsx`
- Backend: Update company details in invoice responses

### Change GST Rate
Edit in:
- Backend: `invoiceController.js` → Change `0.28` to desired rate
- Frontend: `Invoices.jsx` → Update display calculations

### Add New Roles
Edit in:
- Backend: Update role options in `userController.js`
- Frontend: Update role dropdown in `Employees.jsx`

## 📄 License

This project is for educational and commercial use.

## 👥 Support

For issues or questions:
1. Check this README
2. Review error messages in terminal
3. Check browser console for frontend errors
4. Verify database schema matches code

## 🎯 Next Steps

After setup, you can:
1. ✅ Customize company branding
2. ✅ Add more products to catalog
3. ✅ Create customers in your region
4. ✅ Start generating invoices
5. ✅ Track employee attendance
6. ✅ Export data to Excel for analysis

---

**Built with ❤️ for Tilesoft Solutions**

**Version**: 1.0.0  
**Last Updated**: February 2026
