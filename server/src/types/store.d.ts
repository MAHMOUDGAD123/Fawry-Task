import type { Cart } from "@/classes/cart";

export type CustomerType = {
  id: string;
  password: string;
  name: string;
  balance: number;
  cart: Cart;
  receipts: ReceiptInfo[]
};

export type SessionCustomerData = Prettify<Omit<CustomerType, "password">>;

export type SessionData = {
  customer?: {
    data: SessionCustomerData;
    isLoggedIn: true;
  };
};
