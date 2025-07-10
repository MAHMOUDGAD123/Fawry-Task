export class ShippingService {
  private static readonly SHIPPING_RATE_PER_KG = 30; // in LE
  private static readonly MIN_SHIPPING_FEE = 10; // in LE

  static calculateShippingFee(items: ShippableItemType[]): number {
    if (items.length === 0) return 0;

    const totalWeight = items.reduce((weight, item) => weight + item.getWeight(), 0);
    const weightInKg = totalWeight / 1000;
    
    const shippingFee = Math.max(
      weightInKg * this.SHIPPING_RATE_PER_KG,
      this.MIN_SHIPPING_FEE
    );

    return Math.round(shippingFee * 100) / 100;
  }

  static processShipment(items: ShippableItemType[]): ShipmentInfo | null {
    if (items.length <= 0) return null;
    
    // Map items using the name as the key
    const itemsMap = new Map<string, { count: number; totalWeight: number }>();
    
    items.forEach(item => {
      const name = item.getName();
      const existing = itemsMap.get(name);
      
      if (existing) {
        ++existing.count;
        existing.totalWeight += item.getWeight();
      } else {
        itemsMap.set(name, { count: 1, totalWeight: item.getWeight() });
      }
    });

    // Calc total weight in kg
    const mapEntries = [...itemsMap];
    const totalWeightInKg = mapEntries.reduce((weight, [_, { count, totalWeight }]) => weight + count * totalWeight, 0) / 1000;

    return {
      shippableItems: mapEntries,
      totalWeightInKg
    }
  }
}