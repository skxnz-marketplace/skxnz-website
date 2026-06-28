import {
  formatCurrency,
  type MarketplaceOrder,
} from "@/lib/data/orders";

export type SellerDemoOrderRow = {
  id: string;
  product: string;
  buyerName: string;
  buyerCity: string;
  quantity: number;
  amount: string;
  status: string;
  date: string;
  dispatchStatus: string;
};

export function getSellerDemoOrderRows(
  orders: MarketplaceOrder[],
): SellerDemoOrderRow[] {
  return orders.map((order) => ({
    id: order.id,
    product: order.productName,
    buyerName: order.buyerName,
    buyerCity: order.buyerCity,
    quantity: 1,
    amount: formatCurrency(order.amount),
    status: order.orderStatus,
    date: order.placedAt,
    dispatchStatus: order.dispatchStatus,
  }));
}
