import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function POS() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">POS</h1>
          <p className="text-muted-foreground">
            Point of Sale - Sistem penjualan
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              POS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Konten halaman POS akan ditampilkan di sini</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
