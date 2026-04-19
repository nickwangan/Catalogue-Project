# Fashion Catalog Manager
TESTING
A complete fashion product catalog management system built with React, TypeScript, and Supabase.

## Features

- ✅ Role-based access control (Manager & Employee)
- ✅ Add, Edit, and Delete products (Managers only)
- ✅ View all products (All users)
- ✅ Search and filter functionality
- ✅ Real-time data with React Query
- ✅ Secure authentication with Supabase
- ✅ Row-level security policies

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Data Fetching**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form

## Setup Instructions

### 1. **Supabase Setup**

#### 1.1 Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be created
3. Go to **Settings → API** to find your:
   - `VITE_SUPABASE_URL` (Project URL)
   - `VITE_SUPABASE_ANON_KEY` (Anon Key)

#### 1.2 Run the Database Schema
1. Go to **SQL Editor** in Supabase
2. Click **New Query**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run**

This will create:
- `fashion_catalog` table with all product fields
- `user_roles` table for role management
- Row-Level Security (RLS) policies
- Indexes for better performance

#### 1.3 Enable Email/Password Auth
1. Go to **Authentication → Providers**
2. Make sure **Email** provider is enabled
3. Go to **Authentication → URL Configuration**
4. Add redirect URL: `http://localhost:5173`

### 2. **Project Setup**

#### 2.1 Install Dependencies
```bash
cd fashion-catalog
npm install
```

#### 2.2 Create Environment File
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### 2.3 Create Demo Users
You can create users manually through the Supabase dashboard or sign up through the app:

**Option A: Via App (Recommended)**
1. Start the app: `npm run dev`
2. Sign up with email and password
3. Choose role (Manager or Employee)

**Option B: Via Supabase Dashboard**
1. Go to **Authentication → Users**
2. Click **Add User**
3. Create a user with any email/password
4. Go to SQL Editor and manually add their role:
```sql
INSERT INTO user_roles (user_id, role) VALUES ('user-id-here', 'manager');
```

### 3. **Run the Application**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## User Roles

### Manager
- ✅ View all products
- ✅ Add new products
- ✅ Edit existing products
- ✅ Delete products

### Employee
- ✅ View all products (read-only)
- ❌ Cannot add, edit, or delete products

## Product Fields

Each product in the catalog has:
- **Manufacturer**: The company that manufactures the product
- **Brand**: The brand name
- **Category**: Product category (e.g., Footwear, Apparel)
- **Gender**: Target gender (Men, Women, Unisex, Kids)
- **Material**: Primary material composition
- **Quality**: Quality level or grade
- **Price Range**: Pricing bracket (e.g., $50-$100)
- **Date**: Date added to catalog

## Project Structure

```
fashion-catalog/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   └── LoginPage.tsx
│   │   └── Dashboard/
│   │       ├── Dashboard.tsx
│   │       ├── ProductTable.tsx
│   │       └── ProductForm.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useProducts.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase-setup.sql
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Key Features Explained

### Authentication
- Built with Supabase Auth
- Email/password login and signup
- Role selection during signup
- Automatic role fetching on login

### Real-time Data
- React Query handles all data fetching
- Automatic refetch on mutations
- Optimized caching strategies

### Role-Based Access Control
- Managed through `user_roles` table
- RLS policies enforce permissions at database level
- Frontend shows/hides UI based on role

### Search & Filters
- Search by manufacturer or brand
- Filter by category
- Filter by gender
- Clear filters to reset

## Security

- ✅ Row-Level Security (RLS) on database
- ✅ Supabase Auth with secure sessions
- ✅ Environment variables for sensitive data
- ✅ Password-protected accounts
- ✅ Role-based access control

## Troubleshooting

### "Missing Supabase environment variables"
- Copy `.env.local.example` to `.env.local`
- Fill in your actual Supabase credentials
- Restart the dev server

### "User role not found"
- Make sure you added the user to the `user_roles` table
- Check that the `user_id` matches exactly

### "Cannot add/edit/delete as Manager"
- Check the database RLS policies in Supabase
- Verify your user role is "manager" in `user_roles` table
- Check browser console for error messages

### "Table not found"
- Make sure you ran the `supabase-setup.sql` script
- Check Supabase SQL Editor for any errors
- Verify all tables exist in the Tables list

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Deployment Options

- **Vercel**: Recommended for React apps
- **Netlify**: Simple deployment with Git integration
- **Self-hosted**: Use any Node.js hosting

Just ensure your `VITE_SUPABASE_*` environment variables are set in your hosting platform.

## License

MIT
"# Catalogue-Project" 
