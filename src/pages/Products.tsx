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
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  cost: number;
  price: number;
  stock: number;
  image_url?: string;
  category_id?: string;
  categories?: {
    name: string;
  };
}

export default function Products() {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Transform data to include stock with default value 0
      const productsWithStock = productsData?.map(product => ({
        ...product,
        stock: 0,  // Default value for stock
      })) || [];
      
      return productsWithStock;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (product: Omit<Product, 'id'>) => {
      const { error } = await supabase.from('products').insert(product);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produk berhasil ditambahkan");
      setOpen(false);
    },
    onError: () => toast.error("Gagal menambahkan produk")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, stock, ...product }: Product) => {
      const { error } = await supabase.from('products').update(product).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produk berhasil diupdate");
      setOpen(false);
      setEditingProduct(null);
    },
    onError: () => toast.error("Gagal mengupdate produk")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produk berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus produk")
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validate required fields
    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const priceStr = formData.get('price') as string;

    if (!name || !sku || !priceStr) {
      toast.error("Nama, SKU, dan harga harus diisi");
      return;
    }

    // Validate price format
    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) {
      toast.error("Harga tidak valid");
      return;
    }

    // Validate cost
    const costStr = formData.get('cost') as string;
    if (!costStr) {
      toast.error("Harga modal harus diisi");
      return;
    }
    const cost = parseFloat(costStr);
    if (isNaN(cost) || cost < 0) {
      toast.error("Harga modal tidak valid");
      return;
    }

    const product = {
      name,
      sku,
      description: formData.get('description') as string || null,
      category_id: formData.get('category_id') as string || null,
      cost,
      price,
      stock: 0, // Default stock ketika produk baru dibuat
      image_url: formData.get('image_url') as string || null,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...product });
    } else {
      createMutation.mutate(product);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Produk</h1>
            <p className="text-muted-foreground">Kelola semua produk di sistem</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingProduct(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input id="name" name="name" defaultValue={editingProduct?.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" name="sku" defaultValue={editingProduct?.sku} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">Kategori</Label>
                  <Select name="category_id" defaultValue={editingProduct?.category_id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Harga Modal</Label>
                    <Input 
                      id="cost" 
                      name="cost" 
                      type="number" 
                      step="0.01" 
                      min="0"
                      defaultValue={editingProduct?.cost} 
                      required 
                      placeholder="Masukkan harga modal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga Jual</Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      min="0"
                      defaultValue={editingProduct?.price} 
                      required 
                      placeholder="Masukkan harga jual"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL Gambar</Label>
                  <Input 
                    id="image_url" 
                    name="image_url" 
                    type="url"
                    defaultValue={editingProduct?.image_url}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Masukkan URL gambar produk (opsional)
                  </p>
                </div>
                {editingProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stok</Label>
                    <Input 
                      id="stock" 
                      name="stock" 
                      type="number" 
                      min="0"
                      defaultValue={editingProduct?.stock} 
                      disabled 
                    />
                    <p className="text-xs text-muted-foreground">
                      Stok diperbarui melalui halaman Warehouse
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingProduct(null); }}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Update' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Daftar Produk
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
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Harga Modal</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.categories?.name || '-'}</TableCell>
                      <TableCell>Rp {Number(product.cost).toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {Number(product.price).toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingProduct(product); setOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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
