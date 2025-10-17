import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse } from "lucide-react";

export default function WarehousePage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gudang</h1>
          <p className="text-muted-foreground">
            Kelola stok gudang
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Stok Gudang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Konten halaman gudang akan ditampilkan di sini</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
