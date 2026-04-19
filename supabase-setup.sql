-- Fashion Catalog Database Schema
-- Run these queries in Supabase SQL Editor

-- 1. Create fashion_catalog table
CREATE TABLE fashion_catalog (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  manufacturer VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  material VARCHAR(255) NOT NULL,
  quality VARCHAR(100) NOT NULL,
  price_range VARCHAR(100) NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create user_roles table
CREATE TABLE user_roles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'employee')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX idx_fashion_catalog_created_by ON fashion_catalog(created_by);
CREATE INDEX idx_fashion_catalog_category ON fashion_catalog(category);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- 4. Enable RLS on both tables
ALTER TABLE fashion_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for fashion_catalog table

-- Allow managers to do everything (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Managers can do everything on fashion_catalog"
ON fashion_catalog
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'manager'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'manager'
  )
);

-- Allow employees to only SELECT (read-only)
CREATE POLICY "Employees can view fashion_catalog"
ON fashion_catalog
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('manager', 'employee')
  )
);

-- 6. RLS Policies for user_roles table

-- Users can view their own role
CREATE POLICY "Users can view their own role"
ON user_roles
FOR SELECT
USING (user_roles.user_id = auth.uid());

-- Managers can view all roles for administration purposes
CREATE POLICY "Managers can view all roles for admin"
ON user_roles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'manager'
  )
);

-- 7. Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS VARCHAR AS $$
  SELECT role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE SQL;

-- 8. Function to set updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_fashion_catalog_updated_at
BEFORE UPDATE ON fashion_catalog
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
