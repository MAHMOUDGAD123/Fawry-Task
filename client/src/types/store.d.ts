declare namespace Info {
  type ProductInfo = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    shippable: boolean;
    weight?: number; // in grams
    expirationDate?: Date;
    category: string;
    description: string;
  };

  type CartItemType = {
    product: ProductInfo;
    quantity: number;
  };

  type CartData = {
    items: CartItemType[];
    total: number;
    currency: string;
    weightUnit: WEIGHT_UNIT;
  };

  type Profiledata = {
    id: string;
    name: string;
    balance: number;
    currency: string;
  };

  type GlobalStateType = {
    isLoggedIn: boolean;
    profileData: Profiledata | null;
  };

  type ProductsData = {
    products: ProductInfo[];
    currency: CURRENCY;
    weightUnit: WEIGHT_UNIT;
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
    dateTime: {
      date: string;
      time: string;
    };
  };

  type ReceiptsData = {
    receipts: ReceiptInfo[];
    currency: string;
    weightUnit: string;
  };

  type PopupMessageType = "info" | "error" | "warning";
  type PopupMessageName = Capitalize<PopupMessageType>;
}

// Server responses 🖥️
declare namespace Server {
  type ServerResponseSchema = {
    success: boolean;
    msg: string;
    data: unknown;
  };

  type ProductsResponse = Prettify<
    ServerResponseSchema & {
      data: {
        products: Info.ProductInfo[];
        currency: string;
        weightUnit: string;
      };
    }
  >;

  type ProfileResponse = Prettify<
    ServerResponseSchema & {
      data: Info.Profiledata;
    }
  >;

  type CartResponse = Prettify<
    ServerResponseSchema & {
      data: Info.CartData
    }
  >;

  type CartCountResponse = Prettify<
    ServerResponseSchema & {
      data: {
        cartCount: number;
      };
    }
  >;

  type ReceiptsResponse = Prettify<
    ServerResponseSchema & {
      data: Info.ReceiptsData;
    }
  >;

  type CheckoutResponse = Prettify<
    ServerResponseSchema & {
      data: Info.ReceiptInfo;
    }
  >;
}
