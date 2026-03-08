# ⚡ QUICK START - Smart Billing System

## 🎯 5-Minute Setup

### Step 1: Database (1 min)
```bash
createdb tilesoft_db
psql -U postgres -d tilesoft_db -f database/database-schema.sql
```

### Step 2: Backend (2 min)
```bash
cd backend
npm install
# Edit .env with your PostgreSQL password
npm run dev
```
✅ Wait for: "🚀 Server running on port 5000"

### Step 3: Frontend (2 min)
```bash
cd frontend
npm install
npm run dev
```
✅ Wait for: "Local: http://localhost:5173/"

### Step 4: Login
- Open: http://localhost:5173
- Email: `admin@tilesoft.com`
- Password: `admin123`

## 📁 File Locations

### Backend Files:
```
backend/
├── .env                           # EDIT THIS with your DB password
├── package.json
└── src/
    ├── config/database.js
    ├── controllers/*.js           # 7 controllers
    ├── middleware/auth.js
    ├── routes/*.js                # 7 route files
    └── server.js
```

### Frontend Files:
```
frontend/
├── package.json
├── vite.config.js
├── index.html
├── main.jsx
├── App.jsx
├── index.css
└── src/
    ├── components/
    │   ├── Sidebar.jsx
    │   └── Navbar.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Products.jsx
    │   ├── Customers.jsx
    │   ├── Invoices.jsx
    │   ├── Employees.jsx
    │   └── Attendance.jsx
    └── services/
        └── api.js
```

### Database:
```
database/
└── database-schema.sql            # Run this first!
```

## ⚙️ Environment Variables

**backend/.env:**
```env
PORT=5000
JWT_SECRET=your-secret-key

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tilesoft_db
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE    # ⚠️ CHANGE THIS!
```

## 📊 What You Get

✅ **Dashboard** - 7 stat cards + recent invoices  
✅ **Products** - CRUD + Excel export + Images  
✅ **Customers** - CRUD + Excel export + GST numbers  
✅ **Invoices** - Create/View/Print/PDF + GST calculation  
✅ **Employees** - Role-based management  
✅ **Attendance** - Daily tracking with check-in/out  

## 🎨 Sample Data Included

- 1 Admin user (admin@tilesoft.com / admin123)
- 5 Tile products with images
- 3 Customers
- 3 Sample invoices
- 3 Additional employees
- Today's attendance records

## 🚨 Common Issues

**Port 5000 in use:**
```bash
# Change PORT in backend/.env to 5001
```

**Database connection failed:**
```bash
# Check PostgreSQL is running:
pg_ctl status

# Check credentials in .env
```

**Frontend shows blank page:**
```bash
# Clear cache and reload:
Ctrl + Shift + R
```

## 📱 Test the System

1. **Login** → Use demo credentials
2. **Dashboard** → See real stats
3. **Products** → Add a tile product
4. **Customers** → Create a customer
5. **Invoices** → Generate invoice → Download PDF
6. **Employees** → Add staff member
7. **Attendance** → Mark attendance

## 🎯 Production Checklist

Before deploying:
- [ ] Change JWT_SECRET in .env
- [ ] Use strong PostgreSQL password
- [ ] Update company branding
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Set up backups
- [ ] Review security settings

---

**Need Help?** Check README.md for detailed documentation

**Version**: 1.0.0  
**Ready to use!** 🚀
