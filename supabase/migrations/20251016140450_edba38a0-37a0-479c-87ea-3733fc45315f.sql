-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'rider');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role DEFAULT 'rider' NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create warehouse stock table
CREATE TABLE public.warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 0 NOT NULL CHECK (quantity >= 0),
  min_stock INTEGER DEFAULT 10 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(product_id)
);

-- Create distributions table (tracking stock given to riders)
CREATE TABLE public.distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  distributed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notes TEXT
);

-- Create rider inventory table (current stock each rider has)
CREATE TABLE public.rider_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 0 NOT NULL CHECK (quantity >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(rider_id, product_id)
);

-- Create transactions table (sales records)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT UNIQUE NOT NULL,
  rider_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create transaction items table
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

-- Create returns table (products returned to warehouse)
CREATE TABLE public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT,
  returned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tax settings table
CREATE TABLE public.tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_name TEXT NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for products
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for warehouse_stock
CREATE POLICY "Anyone can view warehouse stock" ON public.warehouse_stock FOR SELECT USING (true);
CREATE POLICY "Admins can manage warehouse stock" ON public.warehouse_stock FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for distributions
CREATE POLICY "Anyone can view distributions" ON public.distributions FOR SELECT USING (true);
CREATE POLICY "Admins can create distributions" ON public.distributions FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for rider_inventory
CREATE POLICY "Riders can view own inventory" ON public.rider_inventory FOR SELECT USING (auth.uid() = rider_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all inventories" ON public.rider_inventory FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "System can manage rider inventory" ON public.rider_inventory FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for transactions
CREATE POLICY "Riders can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = rider_id OR public.is_admin(auth.uid()));
CREATE POLICY "Riders can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = rider_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies for transaction_items
CREATE POLICY "Users can view transaction items" ON public.transaction_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id AND (t.rider_id = auth.uid() OR public.is_admin(auth.uid()))
  )
);
CREATE POLICY "Users can create transaction items" ON public.transaction_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id AND t.rider_id = auth.uid()
  )
);

-- RLS Policies for returns
CREATE POLICY "Anyone can view returns" ON public.returns FOR SELECT USING (true);
CREATE POLICY "Riders can create returns" ON public.returns FOR INSERT WITH CHECK (auth.uid() = rider_id);

-- RLS Policies for tax_settings
CREATE POLICY "Anyone can view tax settings" ON public.tax_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage tax settings" ON public.tax_settings FOR ALL USING (public.is_admin(auth.uid()));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    CASE 
      WHEN NEW.email = 'fadlannafian@gmail.com' THEN 'admin'::public.user_role
      ELSE 'rider'::public.user_role
    END
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update warehouse stock after distribution
CREATE OR REPLACE FUNCTION public.handle_distribution()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reduce warehouse stock
  UPDATE public.warehouse_stock
  SET quantity = quantity - NEW.quantity,
      updated_at = NOW()
  WHERE product_id = NEW.product_id;
  
  -- Add to rider inventory
  INSERT INTO public.rider_inventory (rider_id, product_id, quantity)
  VALUES (NEW.rider_id, NEW.product_id, NEW.quantity)
  ON CONFLICT (rider_id, product_id)
  DO UPDATE SET 
    quantity = public.rider_inventory.quantity + NEW.quantity,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger for distribution
CREATE TRIGGER on_distribution_created
  AFTER INSERT ON public.distributions
  FOR EACH ROW EXECUTE FUNCTION public.handle_distribution();

-- Function to handle product returns
CREATE OR REPLACE FUNCTION public.handle_return()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add back to warehouse stock
  UPDATE public.warehouse_stock
  SET quantity = quantity + NEW.quantity,
      updated_at = NOW()
  WHERE product_id = NEW.product_id;
  
  -- Remove from rider inventory
  UPDATE public.rider_inventory
  SET quantity = GREATEST(0, quantity - NEW.quantity),
      updated_at = NOW()
  WHERE rider_id = NEW.rider_id AND product_id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- Trigger for returns
CREATE TRIGGER on_return_created
  AFTER INSERT ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.handle_return();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers for tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouse_stock_updated_at BEFORE UPDATE ON public.warehouse_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_inventory_updated_at BEFORE UPDATE ON public.rider_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tax_settings_updated_at BEFORE UPDATE ON public.tax_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tax setting
INSERT INTO public.tax_settings (tax_name, tax_rate, is_active)
VALUES ('PPN', 10.00, true);