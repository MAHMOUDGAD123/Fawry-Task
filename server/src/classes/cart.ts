import { readProducts } from "@/utils/tools";

export class Cart {
  private items: CartItemType[] = [];

  add(product: ProductType | ShippableItemType, quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (product.isExpired()) {
      throw new Error(`Product ${product.name} has expired`);
    }

    if (!product.isInStock(quantity)) {
      // This check if to make sure that the product won't be added to the cart if it's out of stock 🐂💩
      throw new Error(`Not enough stock for ${product.name}. Available: ${product.quantity}, Total requested: ${quantity}`);
    }

    const existingItem = this.items.find(item => item.product.id === product.id);
    
    if (existingItem) {
      const currentQuantityinDB = this.updateQuantityFromDB(existingItem);
      const newQuantity = existingItem.quantity + quantity;

      if (!product.isInStock(newQuantity)) {
        // Set the quantity in cart for the item to the max value in db
        existingItem.quantity = currentQuantityinDB;
        throw new Error(`Not enough stock for ${product.name}. Available: ${product.quantity}, Total requested: ${newQuantity}`);
      }

      // Set the new value
      existingItem.quantity = newQuantity;
    } else {
      this.items.push({ product, quantity });
    }
  }

  remove(product: ProductType | ShippableItemType, quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const existingItem = this.items.find(item => item.product.id === product.id)!;
    
    if (existingItem) {
      const newQuantity = existingItem.quantity - quantity;
      existingItem.quantity = newQuantity;

      if (newQuantity <= 0) {
        this.items = this.items.filter((item) => item.quantity > 0);
      }
    } else {
      throw new Error('Product not exist in cart');
    }
  }

  updateQuantityFromDB(existingItem: CartItemType): number {
    // Update the value from db first
    const currentQuantityinDB = readProducts().find((prod) => prod.id === existingItem.product.id)!.quantity;
    existingItem.product.quantity = currentQuantityinDB; // update in cart product
    return currentQuantityinDB;
  }

  getItems(): CartItemType[] {
    return [...this.items];
  }

  getItemsCount(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  getSubtotal(): number {
    return this.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  getShippableItems(): ShippableItemType[] {
    const shippableItems: ShippableItemType[] = [];
    
    this.items.forEach(item => {
      if (item.product.shippable) {
        for (let i = 0; i < item.quantity; ++i) {
          shippableItems.push(item.product as ShippableItemType);
        }
      }
    });
    
    return shippableItems;
  }
}
