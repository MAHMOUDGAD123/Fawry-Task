type EnvironmentMode = "development" | "production";

type ProfileInfo = {
  id: string;
  name: string;
  balance: number;
  currency: string;
};

type ProductType = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  shippable: boolean;
  weight?: number; // in grams
  expirationDate?: Date;
  category: string;
  description: string;
  isExpired(): boolean;
  isInStock(requestedQuantity: number): boolean;
};

type ProductInfo = Omit<ProductType, "isExpired" | "isInStock">;

type ShippableItemType = Prettify<
  ProductType & {
    getName(): string;
    getWeight(): number;
  }
>;

type CartItemType = {
  product: ProductType | ShippableItemType;
  quantity: number;
};

type CheckoutDetailsType = {
  orderSubtotal: number;
  shippingFees: number;
  paidAmount: number;
  customerNewBalance: number;
};

type ShipmentInfo = {
  shippableItems: [string, { count: number; totalWeight: number }][];
  totalWeightInKg: number;
};

type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

type ReceiptInfo = {
  shipmentData: ShipmentInfo | null;
  receiptItems: ReceiptItem[];
  orderSubtotal: number;
  shippingFees: number;
  paidAmount: number;
  customerNewBalance: number;
};
