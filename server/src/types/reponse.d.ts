type EndpointResponse = {
  success: boolean;
  msg: string;
  data: unknown;
};

type ProductsResponse = Prettify<
  EndpointResponse & {
    data: {
      products: ProductInfo[];
      currency: string;
      weightUnit: string;
    };
  }
>;

type ProfileResponse = Prettify<
  EndpointResponse & {
    data: ProfileInfo;
  }
>;

type CartResponse = Prettify<
  EndpointResponse & {
    data: {
      items: CartItemType[];
      total: number;
      weightUnit: string;
      currency: string;
    };
  }
>;

type CartCountResponse = Prettify<
  EndpointResponse & {
    data: {
      cartCount: number;
    };
  }
>;

type CheckoutResponse = Prettify<
  EndpointResponse & {
    data: ReceiptInfo;
  }
>;

type ReceiptsResponse = Prettify<
  EndpointResponse & {
    data: {
      receipts: ReceiptInfo[];
      currency: string;
      weightUnit: string;
    };
  }
>;
