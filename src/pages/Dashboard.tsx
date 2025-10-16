import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  lowStockCount: number;
  activeRiders: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    lowStockCount: 0,
    activeRiders: 0,
  });
  const [loading, setLoading] = useState(true);

  // Dummy data untuk chart
  const salesData = [
    { name: "Sen", penjualan: 4000, pendapatan: 2400 },
    { name: "Sel", penjualan: 3000, pendapatan: 1398 },
    { name: "Rab", penjualan: 2000, pendapatan: 9800 },
    { name: "Kam", penjualan: 2780, pendapatan: 3908 },
    { name: "Jum", penjualan: 1890, pendapatan: 4800 },
    { name: "Sab", penjualan: 2390, pendapatan: 3800 },
    { name: "Min", penjualan: 3490, pendapatan: 4300 },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load total revenue
      const { data: transactions } = await supabase
        .from("transactions")
        .select("final_amount");
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

      // Load transaction count
      const { count: transactionCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true });

      // Load low stock count - get items where quantity < min_stock
      const { data: allStock } = await supabase
        .from("warehouse_stock")
        .select("quantity, min_stock");
      
      const lowStock = allStock?.filter(item => item.quantity < item.min_stock) || [];
      
      // Load active riders
      const { count: riderCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "rider");

      setStats({
        totalRevenue,
        totalTransactions: transactionCount || 0,
        lowStockCount: lowStock?.length || 0,
        activeRiders: riderCount || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Pendapatan",
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`,
      icon: DollarSign,
      description: "Total penjualan keseluruhan",
      color: "text-success",
    },
    {
      title: "Total Transaksi",
      value: stats.totalTransactions,
      icon: TrendingUp,
      description: "Jumlah transaksi",
      color: "text-primary",
    },
    {
      title: "Stok Rendah",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      description: "Produk perlu restock",
      color: "text-warning",
    },
    {
      title: "Rider Aktif",
      value: stats.activeRiders,
      icon: Users,
      description: "Total kasir/rider",
      color: "text-accent",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan aktivitas dan performa sistem</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Penjualan Mingguan</CardTitle>
            <CardDescription>Grafik penjualan 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorPenjualan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="penjualan" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPenjualan)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendapatan Mingguan</CardTitle>
            <CardDescription>Grafik pendapatan 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pendapatan" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;