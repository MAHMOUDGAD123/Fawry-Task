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

    // Print checkout receipt
    // logger([[`\n${" ".repeat(25)}Checkout receipt${" ".repeat(24)}`, "bg-green", true]], false); // header
    cartItems.forEach((item) => {
      // const total = item.product.price * item.quantity;
      // logger([[`${item.quantity}x ${item.product.name}        ${total}${CURRENCY}`, "fg-cyan", true]], false);
      receiptItems.push({ name: item.product.name, quantity: item.quantity, price: item.product.price });
    });
    // logger([[`${"-".repeat(65)}`, "fg-white", true]], false);
    // logger([[`Subtotal   ${orderSubtotal}${CURRENCY}`, "fg-yellow", true]], false);
    // logger([[`Shipping   ${shippingFees}${CURRENCY}`, "fg-yellow", true]], false);
    // logger([[`Amount     ${paidAmount}${CURRENCY}`, "fg-yellow", true]], false);

    // if (shipmentData) {
    //   const { shippableItems, totalWeightInKg } = shipmentData;
    //   // Print
    //   logger([
    //     [`${" ".repeat(25)}Shipment notice${" ".repeat(25)}`, "bg-gray", true],
    //   ], false);
    //   shippableItems.forEach(([name, { count, totalWeight }]) => {
    //     logger([
    //       [`${count}x ${name}        ${totalWeight / 1000}${WEIGHT_UNIT}`, "fg-cyan", true],
          
    //     ], false);
    //   });
    //   logger([[`${"-".repeat(65)}`, "fg-white", true]], false);
    //   logger([
    //     [`Total package weight      ${totalWeightInKg}${WEIGHT_UNIT}`, "fg-yellow", true],
    //   ], false);
    // }
    // logger([[`${" ".repeat(65)}`, "bg-green", true]], false); // footer

    return {
      shipmentData,
      receiptItems,
      orderSubtotal,
      shippingFees,
      paidAmount,
      customerNewBalance: customer.balance,
    };
  }
}
