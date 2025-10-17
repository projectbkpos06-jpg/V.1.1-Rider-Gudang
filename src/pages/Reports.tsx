import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, DollarSign, TrendingUp, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Reports() {
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('final_amount, created_at');
      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = data?.filter(t => new Date(t.created_at) >= today) || [];
      const totalToday = todayTransactions.reduce((sum, t) => sum + Number(t.final_amount), 0);
      const totalAll = data?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

      return {
        totalToday,
        totalAll,
        countToday: todayTransactions.length,
        countAll: data?.length || 0
      };
    }
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select('*, products(name, sku)');
      if (error) throw error;
      return data?.filter(stock => stock.quantity <= stock.min_stock) || [];
    }
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground">Lihat laporan penjualan dan stok</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats?.totalToday.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground">{stats?.countToday} transaksi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats?.totalAll.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground">{stats?.countAll} transaksi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStock?.length || 0}</div>
              <p className="text-xs text-muted-foreground">produk perlu restock</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Transaksi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Rider</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Metode Pembayaran</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono">{tx.transaction_number}</TableCell>
                    <TableCell>{new Date(tx.created_at).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{tx.profiles?.full_name || '-'}</TableCell>
                    <TableCell>Rp {Number(tx.final_amount).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="capitalize">{tx.payment_method || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {lowStock && lowStock.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produk Stok Rendah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Stok Minimum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-mono">{stock.products?.sku}</TableCell>
                      <TableCell>{stock.products?.name}</TableCell>
                      <TableCell className="text-destructive font-medium">{stock.quantity}</TableCell>
                      <TableCell>{stock.min_stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
