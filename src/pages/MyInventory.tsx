import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function MyInventory() {
  const { user } = useAuth();

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['rider_inventory', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rider_inventory')
        .select('*, products(name, sku, price)')
        .eq('rider_id', user?.id!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const totalValue = inventory?.reduce((sum, item) => 
    sum + (item.quantity * Number(item.products?.price || 0)), 0
  ) || 0;

  const totalItems = inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Produk Saya</h1>
          <p className="text-muted-foreground">Inventori produk yang Anda bawa</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">{inventory?.length || 0} jenis produk</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Nilai</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {totalValue.toLocaleString('id-ID')}</div>
              <p className="text-xs text-muted-foreground">Nilai inventori saat ini</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventori Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Harga Satuan</TableHead>
                    <TableHead>Total Nilai</TableHead>
                    <TableHead>Terakhir Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.products?.sku}</TableCell>
                      <TableCell>{item.products?.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>Rp {Number(item.products?.price).toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        Rp {(item.quantity * Number(item.products?.price || 0)).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>{new Date(item.updated_at).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
