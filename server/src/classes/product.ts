export class Product implements ProductType {
  constructor(
    public id: string,
    public name: string,
    public price: number,
    public quantity: number,
    public category: string,
    public description: string,
    public shippable: boolean,
    public weight?: number,
    public expirationDate?: Date
  ) {}

  isExpired(): boolean {
    if (!this.expirationDate) return false;
    return new Date() > this.expirationDate;
  }

  isInStock(requestedQuantity: number): boolean {
    return this.quantity >= requestedQuantity;
  }
}

export class ShippableProduct extends Product implements ShippableItemType {
  constructor(
    id: string,
    name: string,
    price: number,
    quantity: number,
    category: string,
    description: string,
    weight: number,
    expirationDate?: Date
  ) {
    super(id, name, price, quantity, category, description, true, weight, expirationDate);
  }

  getName(): string {
    return this.name;
  }

  getWeight(): number {
    return this.weight || 0;
  }
}
