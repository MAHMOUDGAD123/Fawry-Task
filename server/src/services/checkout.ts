import type { SessionCustomerData } from "@/types/store";
import {
  readCustomers,
  readProducts,
  updateCustomers,
  updateProducts,
} from "@/utils/tools";
import { ShippingService } from "./shipping";
// import { logger } from "@/utils/logger";
// import { CURRENCY, WEIGHT_UNIT } from "@/utils/globals";

export class CheckoutService {
  public static checkout(customer: SessionCustomerData): ReceiptInfo {
    const cart = customer.cart;

    // Check cart if empty
    if (cart.isEmpty()) {
      throw new Error("Cart is empty");
    }

    // Validate all products first as a last check before checkout
    const cartItems = cart.getItems();

    for (const item of cartItems) {
      if (item.product.isExpired()) {
        throw new Error(`Product ${item.product.name} has expired`);
      }
      // Update value from db as a last check
      cart.updateQuantityFromDB(item);
      if (!item.product.isInStock(item.quantity)) {
        throw new Error(`Product ${item.product.name} is out of stock`);
      }
    }

    // Calculate totals
    const orderSubtotal = cart.getSubtotal();
    const shippableItems = cart.getShippableItems();
    const shippingFees = ShippingService.calculateShippingFee(shippableItems);
    const paidAmount = orderSubtotal + shippingFees;

    // Check customer balance
    if (customer.balance < paidAmount) {
      throw new Error(
        `Balance not enough. Required: ${paidAmount}, Available: ${customer.balance}`
      );
    }

    // Check if there's a shippable products to process
    const shipmentData = ShippingService.processShipment(shippableItems);

    // Update products quantity in db
    const dbProducts = readProducts();
    cartItems.forEach((item) => {
      const dbProduct = dbProducts.find((prod) => prod.id === item.product.id)!;
      dbProduct.quantity -= item.quantity; // in db
      item.product.quantity -= item.quantity; // in the cart
    });
    updateProducts(dbProducts);

    // Update customer balance
    customer.balance -= paidAmount;

    // Update customer balance in db
    const dbCustomers = readCustomers();
    const dbCustomer = dbCustomers.find((cust) => cust.id === customer.id)!;
    dbCustomer.balance = customer.balance;
    updateCustomers(dbCustomers);

    const receiptItems: ReceiptItem[] = [];

    cartItems.forEach((item) => {
      receiptItems.push({ name: item.product.name, quantity: item.quantity, price: item.product.price });
    });

    
    const now = new Date();

    const dateTime = {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString()
    }

    return {
      shipmentData,
      receiptItems,
      orderSubtotal,
      shippingFees,
      paidAmount,
      customerNewBalance: customer.balance,
      dateTime
    };
  }
}
