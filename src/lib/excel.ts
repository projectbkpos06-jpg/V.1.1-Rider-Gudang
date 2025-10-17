import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface TransactionSummary {
  totalAmount: number;
  totalTransactions: number;
  averageAmount: number;
  topSellingProducts: Array<{
    name: string;
    sku: string;
    quantity: number;
    totalAmount: number;
  }>;
}

export function generateSalesReport(transactions: any[], rider?: { id: string; full_name: string }) {
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Generate summary data
  const summary = generateSummary(transactions);
  
  // Create summary worksheet
  const summaryWS = XLSX.utils.aoa_to_sheet([
    ['Ringkasan Laporan Penjualan'],
    ['Periode:', `${format(new Date(), 'dd MMMM yyyy')}`],
    rider ? ['Rider:', rider.full_name] : ['Rider:', 'Semua Rider'],
    [''],
    ['Total Penjualan:', `Rp ${summary.totalAmount.toLocaleString('id-ID')}`],
    ['Jumlah Transaksi:', summary.totalTransactions.toString()],
    ['Rata-rata per Transaksi:', `Rp ${summary.averageAmount.toLocaleString('id-ID')}`],
    [''],
    ['Top 5 Produk Terlaris:'],
    ['Nama Produk', 'SKU', 'Jumlah Terjual', 'Total Penjualan'],
    ...summary.topSellingProducts.map(product => [
      product.name,
      product.sku,
      product.quantity,
      `Rp ${product.totalAmount.toLocaleString('id-ID')}`
    ])
  ]);
  
  // Create detailed transactions worksheet
  const transactionsData = [
    ['No.', 'Tanggal', 'No. Transaksi', 'Rider', 'Total Item', 'Metode Pembayaran', 'Total'],
    ...transactions.map((tx, index) => [
      index + 1,
      format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm'),
      tx.transaction_number,
      tx.profiles?.full_name || '-',
      tx.transaction_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0,
      tx.payment_method || '-',
      `Rp ${Number(tx.final_amount).toLocaleString('id-ID')}`
    ])
  ];
  const transactionsWS = XLSX.utils.aoa_to_sheet(transactionsData);

  // Create product details worksheet
  const productDetails = generateProductDetails(transactions);
  const productDetailsWS = XLSX.utils.aoa_to_sheet([
    ['Detail Produk Terjual'],
    [''],
    ['SKU', 'Nama Produk', 'Jumlah Terjual', 'Total Penjualan'],
    ...productDetails.map(product => [
      product.sku,
      product.name,
      product.quantity,
      `Rp ${product.totalAmount.toLocaleString('id-ID')}`
    ])
  ]);

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(wb, summaryWS, 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, transactionsWS, 'Detail Transaksi');
  XLSX.utils.book_append_sheet(wb, productDetailsWS, 'Detail Produk');

  // Generate Excel file
  const fileName = rider 
    ? `Laporan_Penjualan_${rider.full_name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    : `Laporan_Penjualan_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

function generateSummary(transactions: any[]): TransactionSummary {
  const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.final_amount), 0);
  const totalTransactions = transactions.length;
  const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

  // Generate top selling products
  const productMap = new Map();
  transactions.forEach(tx => {
    tx.transaction_items?.forEach((item: any) => {
      const product = item.products;
      if (product) {
        const existing = productMap.get(product.id) || {
          name: product.name,
          sku: product.sku,
          quantity: 0,
          totalAmount: 0
        };
        existing.quantity += item.quantity || 0;
        existing.totalAmount += Number(item.subtotal) || 0;
        productMap.set(product.id, existing);
      }
    });
  });

  const topSellingProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalAmount,
    totalTransactions,
    averageAmount,
    topSellingProducts
  };
}

function generateProductDetails(transactions: any[]) {
  const productMap = new Map();
  
  transactions.forEach(tx => {
    tx.transaction_items?.forEach((item: any) => {
      const product = item.products;
      if (product) {
        const existing = productMap.get(product.id) || {
          sku: product.sku,
          name: product.name,
          quantity: 0,
          totalAmount: 0
        };
        existing.quantity += item.quantity || 0;
        existing.totalAmount += Number(item.subtotal) || 0;
        productMap.set(product.id, existing);
      }
    });
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity);
}