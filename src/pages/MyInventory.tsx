import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function MyInventory() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Produk Saya</h1>
          <p className="text-muted-foreground">
            Inventori produk yang Anda bawa
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventori Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Konten halaman inventori saya akan ditampilkan di sini</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
