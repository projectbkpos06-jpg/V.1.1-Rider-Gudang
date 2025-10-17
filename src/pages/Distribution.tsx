import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruckIcon } from "lucide-react";

export default function Distribution() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Distribusi</h1>
          <p className="text-muted-foreground">
            Kelola distribusi produk ke rider
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              Daftar Distribusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Konten halaman distribusi akan ditampilkan di sini</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
