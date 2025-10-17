-- Drop existing tables in correct order (due to foreign key dependencies)
DROP TABLE IF EXISTS distributions;
DROP TABLE IF EXISTS warehouse_stock;
DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (extending auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'rider',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rider_id UUID REFERENCES profiles(id),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transaction_items table
CREATE TABLE transaction_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create warehouse_stock table
CREATE TABLE warehouse_stock (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create distributions table
CREATE TABLE distributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    rider_id UUID REFERENCES profiles(id),
    quantity INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    distributed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_warehouse_stock_updated_at
    BEFORE UPDATE ON warehouse_stock
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert default admin profiles
INSERT INTO profiles (id, full_name, email, role, status) VALUES 
('fb560ce5-6147-48b6-9a8a-c84ccd75838c', 'Admin', 'admin@example.com', 'admin', 'active'),
('fb560ce5-6147-48b6-9a8a-c84ccd75838d', 'Fadlan', 'fadlannafian@gmail.com', 'admin', 'active');

-- Insert some sample categories
INSERT INTO categories (name, description) VALUES
('Minuman', 'Kategori untuk produk minuman'),
('Makanan', 'Kategori untuk produk makanan'),
('Snack', 'Kategori untuk makanan ringan');

-- Insert some sample products
INSERT INTO products (name, sku, description, price, stock, category_id) 
SELECT 
    'Teh Botol', 'TB001', 'Teh dalam kemasan botol', 5000, 100, id 
FROM categories WHERE name = 'Minuman';

INSERT INTO products (name, sku, description, price, stock, category_id)
SELECT 
    'Nasi Goreng', 'NG001', 'Nasi goreng spesial', 15000, 50, id 
FROM categories WHERE name = 'Makanan';

INSERT INTO products (name, sku, description, price, stock, category_id)
SELECT 
    'Keripik Kentang', 'KK001', 'Keripik kentang renyah', 8000, 75, id 
FROM categories WHERE name = 'Snack';