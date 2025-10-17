import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TruckIcon, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Distribution() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: distributions, isLoading } = useQuery({
    queryKey: ['distributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distributions')
        .select('*, products(name, sku), profiles!distributions_rider_id_fkey(full_name)')
        .order('distributed_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: riders } = useQuery({
    queryKey: ['riders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'rider')
        .order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (distribution: any) => {
      const { error } = await supabase.from('distributions').insert(distribution);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse_stock'] });
      queryClient.invalidateQueries({ queryKey: ['rider_inventory'] });
      toast.success("Distribusi berhasil dibuat");
      setOpen(false);
    },
    onError: (error: any) => toast.error(error.message || "Gagal membuat distribusi")
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const distribution = {
      product_id: formData.get('product_id'),
      rider_id: formData.get('rider_id'),
      quantity: parseInt(formData.get('quantity') as string),
      distributed_by: user?.id,
      notes: formData.get('notes') || null,
    };

    createMutation.mutate(distribution);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Distribusi</h1>
            <p className="text-muted-foreground">Kelola distribusi produk ke rider</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Distribusi Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Distribusi Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rider_id">Rider</Label>
                  <Select name="rider_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {riders?.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_id">Produk</Label>
                  <Select name="product_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input id="quantity" name="quantity" type="number" min="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea id="notes" name="notes" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Distribusi</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Riwayat Distribusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions?.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell>{new Date(dist.distributed_at).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>{dist.profiles?.full_name}</TableCell>
                      <TableCell>
                        {dist.products?.name}
                        <span className="text-muted-foreground ml-2">({dist.products?.sku})</span>
                      </TableCell>
                      <TableCell>{dist.quantity}</TableCell>
                      <TableCell>{dist.notes || '-'}</TableCell>
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
