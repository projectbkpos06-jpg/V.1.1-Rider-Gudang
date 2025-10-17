import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Users, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface SelectedRoles {
  [key: string]: string | undefined;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { isAdmin, user, signOut } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<SelectedRoles>({});
  const navigate = useNavigate();

  // Profile query
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Tax settings query
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

  // Users list query
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin // Only fetch if user is admin
  });

  // Update tax settings mutation
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

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: 'admin' | 'rider' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Role pengguna berhasil diupdate");
    },
    onError: () => toast.error("Gagal mengupdate role pengguna")
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Gagal keluar dari sistem');
    }
  };

  const renderProfileSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Profil Saya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input value={profile?.email || '-'} disabled />
        </div>
        <div className="grid gap-2">
          <Label>Nama Lengkap</Label>
          <Input value={profile?.full_name || '-'} disabled />
        </div>
        <div className="grid gap-2">
          <Label>Role</Label>
          <Input value={profile?.role || '-'} disabled />
        </div>
        {!isAdmin && (
          <Button
            variant="destructive"
            className="w-full mt-4 flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Keluar dari Sistem
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="space-y-6 p-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Pengaturan</h1>
            <p className="text-muted-foreground">Kelola profil dan pengaturan</p>
          </div>
          {renderProfileSection()}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan sistem</p>
        </div>

        <Tabs defaultValue="tax" className="space-y-4">
          <TabsList className="w-full flex">
            <TabsTrigger value="profile" className="flex-1">Profil</TabsTrigger>
            <TabsTrigger value="tax" className="flex-1">Pengaturan Pajak</TabsTrigger>
            <TabsTrigger value="users" className="flex-1">Manajemen Pengguna</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            {renderProfileSection()}
          </TabsContent>

          <TabsContent value="tax">
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
                      defaultChecked={taxSettings?.is_active} 
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                  <Button type="submit">Simpan</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manajemen Pengguna
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Terdaftar</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.full_name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role || 'Belum diatur'}</TableCell>
                            <TableCell>
                              {format(new Date(user.created_at), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Select
                                  defaultValue={user.role || ''}
                                  onValueChange={(value) => {
                                    if (value === 'admin' || value === 'rider') {
                                      setSelectedRoles((prev) => ({
                                        ...prev,
                                        [user.id]: value
                                      }));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Pilih role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="rider">Rider</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                {selectedRoles[user.id] && selectedRoles[user.id] !== user.role && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      updateUserRoleMutation.mutate({
                                        userId: user.id,
                                        role: selectedRoles[user.id] as 'admin' | 'rider'
                                      });
                                      setSelectedRoles((prev) => ({
                                        ...prev,
                                        [user.id]: undefined
                                      }));
                                    }}
                                  >
                                    Simpan
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {users?.map((user) => (
                      <div key={user.id} className="bg-white p-4 border-b last:border-b-0">
                        <div className="space-y-2">
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-muted-foreground">Role</div>
                              <div>{user.role || 'Belum diatur'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Terdaftar</div>
                              <div>{format(new Date(user.created_at), 'dd MMM yyyy')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Select
                              defaultValue={user.role || ''}
                              onValueChange={(value) => {
                                if (value === 'admin' || value === 'rider') {
                                  setSelectedRoles((prev) => ({
                                    ...prev,
                                    [user.id]: value
                                  }));
                                }
                              }}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Pilih role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rider">Rider</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {selectedRoles[user.id] && selectedRoles[user.id] !== user.role && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  updateUserRoleMutation.mutate({
                                    userId: user.id,
                                    role: selectedRoles[user.id] as 'admin' | 'rider'
                                  });
                                  setSelectedRoles((prev) => ({
                                    ...prev,
                                    [user.id]: undefined
                                  }));
                                }}
                              >
                                Simpan
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}