# 🚀 SMART BILLING SYSTEM - COMPLETE SETUP GUIDE

## 📁 PROJECT STRUCTURE

```
tilesoft/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── customerController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── userController.js
│   │   │   ├── attendanceController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── customers.js
│   │   │   ├── invoices.js
│   │   │   ├── users.js
│   │   │   ├── attendance.js
│   │   │   └── dashboard.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   └── Navbar.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Products.jsx
    │   │   ├── Customers.jsx
    │   │   ├── Invoices.jsx
    │   │   ├── Employees.jsx
    │   │   └── Attendance.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    ├── vite.config.js
    └── index.html
```

## 🗄️ DATABASE SETUP

### 1. Install PostgreSQL
Download and install from: https://www.postgresql.org/download/

### 2. Create Database
```sql
CREATE DATABASE tilesoft_db;
```

### 3. Run the Schema
Use the `database-schema.sql` file to create all tables

```bash
psql -U postgres -d tilesoft_db -f database-schema.sql
```

## 🔧 BACKEND SETUP

### 1. Navigate to Backend Folder
```bash
cd C:\Users\ELCOT\Desktop\tilesoft-day1\tilesoft\backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Edit `.env` file with your database credentials:
```
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tilesoft_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
```

### 4. Start Backend Server
```bash
npm run dev
```

Should see: `🚀 Server running on port 5000`

## 🎨 FRONTEND SETUP

### 1. Navigate to Frontend Folder
```bash
cd C:\Users\ELCOT\Desktop\tilesoft-day1\tilesoft\frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Frontend Server
```bash
npm run dev
```

Should see: `Local: http://localhost:5173/`

## 🌐 ACCESS THE APPLICATION

Open your browser and go to: **http://localhost:5173**

### Default Login Credentials
- Email: `admin@tilesoft.com`
- Password: `admin123`

## 📦 FEATURES INCLUDED

✅ **Authentication System**
- Login/Logout with JWT tokens
- Role-based access (admin, manager, user, staff, driver)

✅ **Dashboard**
- Real-time statistics
- Product count, Customer count, Invoice count
- Total revenue, Pending invoices
- Employee count, Today's attendance
- Recent invoices list

✅ **Products Management**
- CRUD operations (Create, Read, Update, Delete)
- Product images (Unsplash URLs)
- Excel export functionality
- Search and filter

✅ **Customers Management**
- CRUD operations
- Company details, GST numbers
- Contact information
- Excel export

✅ **Invoices System**
- Create invoices with multiple items
- Automatic GST calculation (28%: 14% CGST + 14% SGST)
- View invoice modal
- Print functionality
- PDF generation with jsPDF
- Excel export
- Status tracking (pending/paid/cancelled)

✅ **Employees Management**
- CRUD operations for staff
- Role assignment
- Contact details
- Password management

✅ **Attendance System**
- Mark attendance with check-in/check-out
- Today's attendance view
- Status tracking (present/absent/leave)
- Employee-wise attendance records

## 📄 FILE MAPPING GUIDE

### Backend Files:
1. `package.json` → `backend/package.json`
2. `.env` → `backend/.env`
3. `database.js` → `backend/src/config/database.js`
4. `authController.js` → `backend/src/controllers/authController.js`
5. `productController.js` → `backend/src/controllers/productController.js`
6. `customerController.js` → `backend/src/controllers/customerController.js`
7. `invoiceController.js` → `backend/src/controllers/invoiceController.js`
8. `userController.js` → `backend/src/controllers/userController.js`
9. `attendanceController.js` → `backend/src/controllers/attendanceController.js`
10. `dashboardController.js` → `backend/src/controllers/dashboardController.js`
11. `auth-middleware.js` → `backend/src/middleware/auth.js`
12. `auth-routes.js` → `backend/src/routes/auth.js`
13. `products-routes.js` → `backend/src/routes/products.js`
14. `customers-routes.js` → `backend/src/routes/customers.js`
15. `invoices-routes.js` → `backend/src/routes/invoices.js`
16. `users-routes.js` → `backend/src/routes/users.js`
17. `attendance-routes.js` → `backend/src/routes/attendance.js`
18. `dashboard-routes.js` → `backend/src/routes/dashboard.js`
19. `server.js` → `backend/src/server.js`

### Frontend Files:
1. `frontend-package.json` → `frontend/package.json`
2. `vite.config.js` → `frontend/vite.config.js`
3. `index.html` → `frontend/index.html`
4. `main.jsx` → `frontend/src/main.jsx`
5. `App.jsx` → `frontend/src/App.jsx`
6. `index.css` → `frontend/src/index.css`
7. `api.js` → `frontend/src/services/api.js`
8. `Sidebar.jsx` → `frontend/src/components/Sidebar.jsx`
9. `Navbar.jsx` → `frontend/src/components/Navbar.jsx`
10. `Login.jsx` → `frontend/src/pages/Login.jsx`
11. `Dashboard.jsx` → `frontend/src/pages/Dashboard.jsx`
12. `Products.jsx` → `frontend/src/pages/Products.jsx`
13. `Customers.jsx` → `frontend/src/pages/Customers.jsx`
14. `Invoices.jsx` → `frontend/src/pages/Invoices.jsx`
15. `Employees.jsx` → `frontend/src/pages/Employees.jsx`
16. `Attendance.jsx` → `frontend/src/pages/Attendance.jsx`

## ⚡ QUICK START COMMANDS

### Terminal 1 (Backend):
```bash
cd C:\Users\ELCOT\Desktop\tilesoft-day1\tilesoft\backend
npm install
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd C:\Users\ELCOT\Desktop\tilesoft-day1\tilesoft\frontend
npm install
npm run dev
```

### Browser:
Open **http://localhost:5173**
Login with: `admin@tilesoft.com` / `admin123`

## 🎯 TESTING THE FEATURES

1. **Login** → Use demo credentials
2. **Dashboard** → See real-time stats
3. **Products** → Add/Edit/Delete products, Export to Excel
4. **Customers** → Manage customer database
5. **Invoices** → Create invoices, View PDF, Print, Export
6. **Employees** → Manage staff
7. **Attendance** → Mark daily attendance

## 🐛 TROUBLESHOOTING

### Backend Won't Start:
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Run: `npm install` again

### Frontend Won't Start:
- Run: `npm install` again
- Check port 5173 is not in use
- Clear browser cache

### Database Connection Error:
- Verify PostgreSQL service is running
- Check database name and credentials
- Ensure database exists

### 401 Unauthorized:
- Token expired - logout and login again
- Clear localStorage and try again

## 📞 SUPPORT

For any issues or questions, refer to this guide or check the error messages in the terminal.

---

**Built with ❤️ for Tilesoft Solutions**
