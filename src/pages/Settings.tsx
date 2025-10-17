import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: taxSettings } = useQuery({
    queryKey: ['tax_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const updateTaxMutation = useMutation({
    mutationFn: async ({ id, ...tax }: any) => {
      if (id) {
        const { error } = await supabase.from('tax_settings').update(tax).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tax_settings').insert(tax);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax_settings'] });
      toast.success("Pengaturan pajak berhasil diupdate");
    },
    onError: () => toast.error("Gagal mengupdate pengaturan pajak")
  });

  const handleTaxSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tax = {
      id: taxSettings?.id,
      tax_name: formData.get('tax_name'),
      tax_rate: parseFloat(formData.get('tax_rate') as string),
      is_active: formData.get('is_active') === 'on',
    };

    updateTaxMutation.mutate(tax);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan sistem</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Pengaturan Pajak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTaxSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax_name">Nama Pajak</Label>
                <Input 
                  id="tax_name" 
                  name="tax_name" 
                  defaultValue={taxSettings?.tax_name || 'PPN'} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tarif Pajak (%)</Label>
                <Input 
                  id="tax_rate" 
                  name="tax_rate" 
                  type="number" 
                  step="0.01" 
                  defaultValue={taxSettings?.tax_rate || 10} 
                  required 
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_active" 
                  name="is_active" 
                  defaultChecked={taxSettings?.is_active !== false} 
                />
                <Label htmlFor="is_active">Aktifkan pajak pada transaksi</Label>
              </div>
              <Button type="submit">Simpan Pengaturan</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
