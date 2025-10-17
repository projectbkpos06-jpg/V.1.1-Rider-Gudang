import { supabase } from "@/integrations/supabase/client";

export interface DateRange {
  from: Date;
  to: Date;
}

interface Transaction {
  id: string;
  created_at: string;
  final_amount: number;
  total_amount: number;
  tax_amount: number;
  payment_method: string;
  transaction_number: string;
  rider_id: string;
  status?: string;  // Make it optional since it might not exist in the database
  profiles?: {
    id: string;
    full_name: string;
  };
  transaction_items?: Array<{
    id: string;
    quantity: number;
    price_at_time?: number;
    subtotal: number;
    products?: {
      id: string;
      name: string;
      sku: string;
    }
  }>;
}

export interface ReportFilters {
  dateRange: Required<DateRange>;
  riderId?: string;
  reportType?: string;
}

export async function fetchTransactionHistory(filters: ReportFilters): Promise<Transaction[]> {
  const { from, to } = filters.dateRange;
  
  let query = supabase
    .from('transactions')
    .select(`
      id,
      created_at,
      final_amount,
      total_amount,
      tax_amount,
      payment_method,
      transaction_number,
      rider_id,
      profiles:rider_id(id, full_name),
      transaction_items(
        id,
        quantity,
        subtotal,
        products(id, name, sku)
      )
    `)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false });

  if (filters.riderId) {
    query = query.eq('rider_id', filters.riderId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return (data || []) as unknown as Transaction[];
}

export async function fetchRidersList() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .or('role.eq.rider,role.is.null'); // Get both confirmed riders and new users

  if (error) throw error;
  
  // Filter out non-riders if needed
  const riders = data?.filter(user => !user.role || user.role === 'rider') || [];
  return riders;
}

export async function generateReport(filters: ReportFilters) {
  const { from, to } = filters.dateRange;
  
  // Instead of using RPC, we'll use a direct query
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      created_at,
      final_amount,
      total_amount,
      tax_amount,
      payment_method,
      transaction_number,
      rider_id,
      profiles:rider_id(id, full_name),
      transaction_items(
        id,
        quantity,
        subtotal,
        products(id, name, sku)
      )
    `)
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as unknown as Transaction[];
}