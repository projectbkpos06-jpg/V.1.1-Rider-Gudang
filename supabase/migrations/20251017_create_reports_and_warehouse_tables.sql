-- Buat tabel untuk gudang/warehouse
CREATE TABLE IF NOT EXISTS warehouse_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Buat tabel untuk distribusi
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rider_id UUID REFERENCES profiles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Buat tabel untuk item distribusi
CREATE TABLE IF NOT EXISTS distribution_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID REFERENCES distributions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Buat tabel untuk transaksi
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    rider_id UUID REFERENCES profiles(id),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Buat tabel untuk item transaksi
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    price_at_time DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Buat trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tambahkan trigger ke tabel yang memiliki updated_at
CREATE TRIGGER update_warehouse_stock_updated_at
    BEFORE UPDATE ON warehouse_stock
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tambahkan RLS (Row Level Security)
ALTER TABLE warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Buat policies untuk warehouse_stock
CREATE POLICY "Warehouse stock is viewable by authenticated users" 
ON warehouse_stock FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Warehouse stock is editable by authenticated users" 
ON warehouse_stock FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Buat policies untuk distributions
CREATE POLICY "Distributions are viewable by authenticated users" 
ON distributions FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Distributions are editable by authenticated users" 
ON distributions FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Buat policies untuk distribution_items
CREATE POLICY "Distribution items are viewable by authenticated users" 
ON distribution_items FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Distribution items are editable by authenticated users" 
ON distribution_items FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Buat policies untuk transactions
CREATE POLICY "Transactions are viewable by authenticated users" 
ON transactions FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Transactions are editable by authenticated users" 
ON transactions FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Buat policies untuk transaction_items
CREATE POLICY "Transaction items are viewable by authenticated users" 
ON transaction_items FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Transaction items are editable by authenticated users" 
ON transaction_items FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);