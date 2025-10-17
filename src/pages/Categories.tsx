import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Categories() {
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
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
    mutationFn: async (category: any) => {
      const { error } = await supabase.from('categories').insert(category);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Kategori berhasil ditambahkan");
      setOpen(false);
    },
    onError: () => toast.error("Gagal menambahkan kategori")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...category }: any) => {
      const { error } = await supabase.from('categories').update(category).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Kategori berhasil diupdate");
      setOpen(false);
      setEditingCategory(null);
    },
    onError: () => toast.error("Gagal mengupdate kategori")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Kategori berhasil dihapus");
    },
    onError: () => toast.error("Gagal menghapus kategori")
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const category = {
      name: formData.get('name'),
      description: formData.get('description') || null,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, ...category });
    } else {
      createMutation.mutate(category);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Kategori</h1>
            <p className="text-muted-foreground">Kelola kategori produk</p>
          </div>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingCategory(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Kategori</Label>
                  <Input id="name" name="name" defaultValue={editingCategory?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" name="description" defaultValue={editingCategory?.description} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setOpen(false); setEditingCategory(null); }}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Daftar Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingCategory(category); setOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(category.id)}>
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
