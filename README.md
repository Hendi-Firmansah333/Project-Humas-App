# 🎓 Admin Humas App

A modern web-based Public Relations Administration System built using **NestJS** and **React**.

---

## 📌 Overview

Admin Humas App is a web application designed to simplify public relations administration within an educational institution.

The system enables administrators to manage:

- News
- Activities
- Announcements
- Galleries
- Users
- Dashboard Analytics

---

## 🚀 Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Axios
- React Router

### Backend

- NestJS
- TypeScript
- Prisma ORM
- MySQL
- JWT Authentication

---

## 📂 Project Structure

```
Project-Humas-App
│
├── mobile/      # Aplikasi Flutter (tim lapangan)
├── frontend/    # Dashboard web admin
├── backend/     # API NestJS
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/admin-humas-app.git
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

### Backend

```bash
cd backend

npm install

npm run start:dev
```

---

### Mobile (Flutter)

```bash
cd mobile

flutter pub get

flutter run
```

Login demo (mode offline): password `Humas@123`

---

## Environment Variables

Backend

```env
DATABASE_URL=
JWT_SECRET=
PORT=
```

Frontend

```env
VITE_API_URL=
```

---

## Features

✅ Authentication

✅ Dashboard

✅ Manage Activities

✅ Manage News

✅ Manage Gallery

✅ Manage Announcements

✅ Responsive UI

---

## API

Backend runs on

```
http://localhost:3000
```

Frontend

```
http://localhost:5173
```

---

## Future Improvements

- Role Management
- File Storage
- Notification System
- Search & Filter
- Audit Log

---

## Author

**Hendi Firmansah**

Politeknik Negeri Lampung

---

## License

MIT License