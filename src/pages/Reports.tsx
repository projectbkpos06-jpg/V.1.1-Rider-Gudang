import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-muted-foreground">
            Lihat laporan penjualan dan stok
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Konten halaman laporan akan ditampilkan di sini</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
