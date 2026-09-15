import { prisma } from "@/lib/prisma";

export class ReportService {
  /**
   * Executive Dashboard KPIs & Analytics
   */
  static async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todaySalesAgg,
      todayPurchasesAgg,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      customerDebtAgg,
      supplierDebtAgg,
      todaySaleItems,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      prisma.purchase.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { gt: 0, lte: 5 },
        },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 0 },
        },
      }),
      prisma.customer.aggregate({
        where: { isActive: true },
        _sum: { credit: true },
      }),
      prisma.supplier.aggregate({
        _sum: { debt: true },
      }),
      prisma.saleItem.findMany({
        where: { sale: { createdAt: { gte: today } } },
        select: {
          unitPrice: true,
          purchasePrice: true,
          quantity: true,
        },
      }),
    ]);

    // Calculate today's gross profit = sum of (unitPrice - purchasePrice) * quantity
    const todayGrossProfit = todaySaleItems.reduce((acc, item) => {
      const u = Number(item.unitPrice) || 0;
      const p = Number(item.purchasePrice) || 0;
      return acc + (u - p) * item.quantity;
    }, 0);

    // Sales over the last 7 days for trend charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const salesLast7Days = await prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, finalAmount: true },
    });

    const trendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      });
      trendMap[dateKey] = 0;
    }

    for (const s of salesLast7Days) {
      const dateKey = s.createdAt.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      });
      if (trendMap[dateKey] !== undefined) {
        trendMap[dateKey] += Number(s.finalAmount);
      }
    }

    const salesTrend = Object.entries(trendMap).map(([day, amount]) => ({
      day,
      amount,
    }));

    // Top 5 selling products
    const topItems = await prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const topProductDetails = await Promise.all(
      topItems.map(async (item) => {
        const prod = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, category: true },
        });
        return {
          productId: item.productId,
          name: prod?.name || "Produit Inconnu",
          category: prod?.category || "Divers",
          quantity: item._sum.quantity || 0,
          total: Number(item._sum.subtotal || 0),
        };
      }),
    );

    return {
      todaySales: Number(todaySalesAgg._sum.finalAmount || 0),
      todaySalesCount: todaySalesAgg._count.id || 0,
      todayPurchases: Number(todayPurchasesAgg._sum.totalAmount || 0),
      todayProfit: todayGrossProfit,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      customerDebtTotal: Number(customerDebtAgg._sum.credit || 0),
      supplierDebtTotal: Number(supplierDebtAgg._sum.debt || 0),
      salesTrend,
      topProducts: topProductDetails,
    };
  }

  /**
   * Detailed Financial and Inventory Report
   */
  static async getFinancialReport(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const whereSale: any = {};
    const wherePurchase: any = {};
    const whereExpense: any = {};

    if (params?.startDate || params?.endDate) {
      const dateFilter: any = {};
      if (params.startDate) dateFilter.gte = new Date(params.startDate);
      if (params.endDate) dateFilter.lte = new Date(params.endDate);

      whereSale.date = dateFilter;
      wherePurchase.date = dateFilter;
      whereExpense.date = dateFilter;
    }

    const [salesAgg, expensesAgg, saleItems, allProducts] = await Promise.all([
      prisma.sale.aggregate({
        where: whereSale,
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: whereExpense,
        _sum: { amount: true },
      }),
      prisma.saleItem.findMany({
        where: { sale: whereSale },
        select: {
          unitPrice: true,
          purchasePrice: true,
          quantity: true,
        },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { stockQuantity: true, purchasePrice: true, unitPrice: true },
      }),
    ]);

    const totalRevenue = Number(salesAgg._sum.finalAmount || 0);
    const totalExpenses = Number(expensesAgg._sum.amount || 0);

    let totalCogs = 0;
    for (const item of saleItems) {
      totalCogs += (Number(item.purchasePrice) || 0) * item.quantity;
    }

    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;

    let stockCostValue = 0;
    let stockRetailValue = 0;
    for (const p of allProducts) {
      if (p.stockQuantity > 0) {
        stockCostValue += p.stockQuantity * (Number(p.purchasePrice) || 0);
        stockRetailValue += p.stockQuantity * (Number(p.unitPrice) || 0);
      }
    }

    return {
      totalRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netProfit,
      stockCostValue,
      stockRetailValue,
      salesCount: salesAgg._count.id || 0,
    };
  }
}
