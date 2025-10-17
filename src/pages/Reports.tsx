import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, DollarSign, TrendingUp, Package, CalendarDays, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import { fetchTransactionHistory, fetchRidersList } from "@/lib/reports";

export default function Reports() {
  console.log("Reports component rendered"); // Debugging
  const [selectedTab, setSelectedTab] = useState("overview");
  const defaultDateRange = {
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  };

  const [date, setDate] = useState<DateRange>({
    from: defaultDateRange.from,
    to: defaultDateRange.to
  });
  const [selectedRider, setSelectedRider] = useState<string>('all');

  // Fetch riders list
  const { data: riders, isError: ridersError, error: ridersErrorDetails } = useQuery({
    queryKey: ['riders'],
    queryFn: fetchRidersList
  });

  // Fetch transaction history with filters
  const { data: transactionHistory, isError: transactionError, error: transactionErrorDetails } = useQuery({
    queryKey: ['transaction-history', date, selectedRider],
    queryFn: () => fetchTransactionHistory({
      dateRange: {
        from: date?.from || defaultDateRange.from,
        to: date?.to || defaultDateRange.to,
      },
      riderId: selectedRider === 'all' ? undefined : selectedRider
    }),
    enabled: !!date?.from
  });

  // Error handling
  if (ridersError) {
    console.error("Riders error:", ridersErrorDetails);
  }
  if (transactionError) {
    console.error("Transaction error:", transactionErrorDetails);
  }

  // Show error UI if needed
  if (ridersError || transactionError) {
    return (
      <AppLayout>
        <div className="p-4">
          <div className="rounded-lg bg-red-50 p-4">
            <h3 className="text-lg font-medium text-red-800">Error Loading Data</h3>
            <p className="mt-2 text-sm text-red-700">
              {ridersErrorDetails?.message || transactionErrorDetails?.message || 
               "There was an error loading the data. Please try again later."}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

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

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal w-[300px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd LLL, y")} -{" "}
                        {format(date.to, "dd LLL, y")}
                      </>
                    ) : (
                      format(date.from, "dd LLL, y")
                    )
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select
              value={selectedRider}
              onValueChange={setSelectedRider}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Pilih rider">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {selectedRider
                        ? riders?.find((r) => r.id === selectedRider)?.full_name
                        : "Semua Rider"}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Rider</SelectItem>
                {riders?.map((rider) => (
                  <SelectItem key={rider.id} value={rider.id}>
                    {rider.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="overview" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Rider</TableHead>
                      <TableHead>Total Item</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionHistory?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.created_at), "dd MMM yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{transaction.profiles?.full_name}</TableCell>
                        <TableCell>
                          {transaction.transaction_items?.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {transaction.total_amount?.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          {transaction.status && (
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              transaction.status === "completed" && "bg-green-100 text-green-800",
                              transaction.status === "pending" && "bg-yellow-100 text-yellow-800",
                              transaction.status === "cancelled" && "bg-red-100 text-red-800",
                            )}>
                              {transaction.status}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
