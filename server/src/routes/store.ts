import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { SessionCustomerData, SessionData } from "@/types/store";
import { createTempCustomersFile, createTempProductsFile, readCustomers, readProducts } from "@/utils/tools";
import { logger } from "@/utils/logger";
import { Cart } from "@/classes/cart";
import { Product, ShippableProduct } from "@/classes/product";
import { CheckoutService } from "@/services/checkout";
import { CURRENCY, WEIGHT_UNIT } from "@/utils/globals";

const createProduct = (product: ProductType) => {
  return product.shippable
  ? new ShippableProduct(product.id, product.name, product.price, product.quantity, product.category, product.description, product.weight ?? 0, product.expirationDate)
  : new Product(product.id, product.name, product.price, product.quantity, product.category, product.description, false, product.weight ?? 0, product.expirationDate);
}

export const storeRoutes = async (app: FastifyInstance) => {
  // Initiate temp files at startup to keep the original files the same
  createTempProductsFile();
  createTempCustomersFile();

  const readSessionData = (_req: FastifyRequest) => {
    return _req.session as unknown as SessionData;
  }

  const isLoggedIn = (loggerName: string) => async (_req: FastifyRequest, _res: FastifyReply) => {
    const reqSession = readSessionData(_req);

    if (!reqSession?.customer?.isLoggedIn) {
      logger([
        [`\n ${loggerName} `, "bg-red", true],
        ["Please, login first", "fg-red"],
      ]);
      _res.status(401).send({ success: false, msg: "Please, login first", data: null } satisfies EndpointResponse);
      return;
    }
  };

  app.post("/login", async (_req: FastifyRequest, _res: FastifyReply) => {
    const reqBody = _req.body as { id: string; password: string };
    const reqSession = readSessionData(_req);
    
    if (reqSession?.customer?.isLoggedIn) {
      const data = reqSession.customer.data;
      const customerData = readCustomers().find(cust => cust.id === data.id)!;

      logger([
        ["\n Login ", "bg-yellow", true],
        [`[${data.id}]`, "fg-cyan", true],
        [" Already logged in", "fg-yellow"],
      ]);

      const profileData: ProfileInfo = {
        id: customerData.id,
        name: customerData.name,
        balance: customerData.balance,
        currency: CURRENCY,
        
      } 
      _res.status(200).send({ success: true, msg: "Already logged in", data: profileData } satisfies EndpointResponse);
      return;
    }

    const { id, password } = reqBody;

    const customer = readCustomers().find((customer) => customer.id === id);

    if (!customer) {
      logger([
        ["\n Login ", "bg-red", true],
        [`[${id}]`, "fg-cyan", true],
        [" Id not found", "fg-red"],
      ]);

      _res.status(404).send({ success: false, msg: "Customer id not found", data: null } satisfies EndpointResponse);
      return;
    }

    if (password !== customer.password) {
      logger([
        ["\n Login ", "bg-red", true],
        [`[${id}]`, "fg-cyan", true],
        [" Password is invalid", "fg-red"],
      ]);

      _res.status(401).send({ success: false, msg: "Password is invalid", data: null } satisfies EndpointResponse);
      return;
    }

    const customerData: SessionCustomerData = {
      id: customer.id,
      name: customer.name,
      balance: customer.balance,
      cart: new Cart(),
      receipts: []
    };

    // open login session
    reqSession.customer = {
      data: customerData,
      isLoggedIn: true,
    };

    logger([
      ["\n Login ", "bg-green", true],
      [`[${customer.id}]`, "fg-cyan", true],
      [" logged in successfully", "fg-green"],
    ]);

    const profileData: ProfileInfo = {
      id: customerData.id,
      name: customerData.name,
      balance: customerData.balance,
      currency: CURRENCY,
    } 

    _res.status(200).send({ success: true, msg: "Logged in successfully", data: profileData } satisfies ProfileResponse);
  });

  app.post("/logout", { preHandler: isLoggedIn("Logout") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { id } = readSessionData(_req).customer!.data;

    _req.session.destroy((err) => {
      if (err) {
        logger([
          ["\n Logout ", "bg-red", true],
          [`[${id}]`, "fg-cyan", true],
          [" Failed to log out", "fg-red"],
        ]);

        _res.status(500).send({ success: false, msg: "Failed to logout", data: null } satisfies EndpointResponse);
      } else {
        logger([
          ["\n Logout ", "bg-green", true],
          [`[${id}]`, "fg-cyan", true],
          [" Logged out successfully", "fg-green"],
        ]);

        _res.status(200).send({ success: true, msg: "logged out successfully", data: null } satisfies EndpointResponse);
      }
    });
    
  });

  app.get("/profile", { preHandler: isLoggedIn("Profile") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { data } = readSessionData(_req).customer!;
    const customerData = readCustomers().find(cust => cust.id === data.id)!;

    logger([
      ["\n Profile ", "bg-green", true],
      [`[${data.id}]`, "fg-cyan", true],
      [" Read profile data successfully", "fg-green"],
    ]);

    const profileData: ProfileInfo = {
      id: customerData.id,
      name: customerData.name,
      balance: customerData.balance,
      currency: CURRENCY,
    } 

    _res.status(200).send({ success: true, msg: "Read profile data successfully", data: profileData } satisfies ProfileResponse);
  });

  app.post("/add-to-cart", { preHandler: isLoggedIn("Cart-Add") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { productId, amount } = _req.body as { productId: string, amount: number };
    const { data } = readSessionData(_req).customer!;
    const dbProducts = readProducts();
    const product = dbProducts.find((prod) => prod.id === productId)!;
    
    try {
      const cartProduct = createProduct(product);
      data.cart.add(cartProduct, amount);

      logger([
        ["\n Cart-Add ", "bg-blue", true],
        [`[${data.id}]`, "fg-cyan", true],
        [` (${amount}) ${product.name}`, "fg-yellow", true],
        [" Added to cart successfully", "fg-blue"],
      ]);

      const total = data.cart.getItems().reduce((prev, curr) => prev + curr.quantity, 0);

      _res.status(200).send({ success: true, msg: "Item successfully added to cart", data: { items: data.cart.getItems(), total, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies CartResponse);
    } catch (err) {
      const error = err as Error;

      logger([
        ["\n Cart-Add ", "bg-red", true],
        [`[${data.id}]`, "fg-cyan", true],
        [` (${amount}) ${product.name}`, "fg-yellow", true],
        [` ${error.message}`, "fg-red"],
      ]);

      const total = data.cart.getItems().reduce((prev, curr) => prev + curr.quantity, 0);

      _res.status(500).send({ success: false, msg: (err as Error).message, data: { items: data.cart.getItems(), total, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies CartResponse)
    }
  });

  app.post("/remove-from-cart", { preHandler: isLoggedIn("Cart-Remove") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { productId, amount } = _req.body as { productId: string, amount: number };
    const { data } = readSessionData(_req).customer!;
    const dbProducts = readProducts();
    const product = dbProducts.find((prod) => prod.id === productId)!;
    
    try {
      const cartProduct = createProduct(product);
      data.cart.remove(cartProduct, amount);

      logger([
        ["\n Cart-Remove ", "bg-blue", true],
        [`[${data.id}]`, "fg-cyan", true],
        [` (${amount}) ${product.name}`, "fg-yellow", true],
        [" Removed from cart successfully", "fg-blue"],
      ]);

      const total = data.cart.getItems().reduce((prev, curr) => prev + curr.quantity, 0);

      _res.status(200).send({ success: true, msg: "Item successfully removed from cart", data: { items: data.cart.getItems(), total, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies CartResponse);
    } catch (err) {
      const error = err as Error;

      logger([
        ["\n Cart-Remove ", "bg-red", true],
        [`[${data.id}]`, "fg-cyan", true],
        [`(${amount}) ${product.name}`, "fg-yellow", true],
        [` ${error.message}`, "fg-red"],
      ]);

      const total = data.cart.getItems().reduce((prev, curr) => prev + curr.quantity, 0);

      _res.status(500).send({ success: false, msg: (err as Error).message, data: { items: data.cart.getItems(), total, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies CartResponse);
    }
  });

  app.get("/cart", { preHandler: isLoggedIn("Cart") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { data } = readSessionData(_req).customer!;

    logger([
      ["\n Cart ", "bg-blue", true],
      [`[${data.id}]`, "fg-cyan", true],
      [` Read cart data successfully`, "fg-blue", true],
    ]);

    const total = data.cart.getItems().reduce((prev, curr) => prev + curr.quantity, 0);

    _res.status(200).send({ success: true, msg: "Cart Items", data: { items: data.cart.getItems(), total, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies CartResponse);
  });

  app.get("/cart-count", { preHandler: isLoggedIn("Cart-Count") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { data } = readSessionData(_req).customer!;

    logger([
      ["\n Cart-Count ", "bg-blue", true],
      [`[${data.id}]`, "fg-cyan", true],
      [` Read cart item count successfully`, "fg-blue", true],
    ]);

    const totalCount = data.cart.getItems().reduce((prev, curr) => prev + curr.quantity, 0);

    _res.status(200).send({ success: true, msg: "Cart Items", data: { cartCount: totalCount } } satisfies CartCountResponse);
  });

  app.post("/cart-clear", { preHandler: isLoggedIn("Cart-Clear") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { data } = readSessionData(_req).customer!;

    logger([
      ["\n Cart-Clear ", "bg-magenta", true],
      [`[${data.id}]`, "fg-cyan", true],
      [` Cart cleared successfully`, "fg-magenta", true],
    ]);

    data.cart.clear();

    _res.status(200).send({ success: true, msg: "Cart is Empty", data: { items: data.cart.getItems(), total: 0, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies CartResponse);
  });

  app.post("/checkout", { preHandler: isLoggedIn("Checkout") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { data } = readSessionData(_req).customer!;

    try {
      logger([
        ["\n Checkout ", "bg-cyan", true],
        [`[${data.id}]`, "fg-cyan", true],
        [` Perform a checkout for (${data.name})`, "fg-cyan"],
      ]);

      // Perform the checkout
      const checkoutDetails = CheckoutService.checkout(data);
      // Add receipt data to session data
      data.receipts.push(checkoutDetails);
      // Clear the cart
      data.cart.clear();

      logger([
        ["\n Checkout ", "bg-cyan", true],
        [`[${data.id}]`, "fg-cyan", true],
        [` Checkout done successfully for (${data.name})`, "fg-cyan"],
      ]);

      _res.status(200).send({ success: true, msg: "Checkout done", data: checkoutDetails } satisfies CheckoutResponse);
    } catch (err) {
      const error = err as Error;

      logger([
        ["\n Checkout ", "bg-red", true],
        [`[${data.id}]`, "fg-cyan", true],
        [` ${error.message}`, "fg-red"],
      ]);

      _res.status(200).send({ success: false, msg: `${error.message}`, data: null } satisfies EndpointResponse);
    }
  });

  app.get("/receipts", { preHandler: isLoggedIn("Receipts") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const { data } = readSessionData(_req).customer!;

    logger([
      ["\n Receipts ", "bg-blue", true],
      [`[${data.id}]`, "fg-cyan", true],
      [` Read receipts successfully`, "fg-blue", true],
    ]);

    _res.status(200).send({ success: true, msg: "Cart Items", data: { receipts: data.receipts, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies ReceiptsResponse);
  });

  app.get("/products", { preHandler: isLoggedIn("Products") }, async (_req: FastifyRequest, _res: FastifyReply) => {
    const products = readProducts();
    const { data } = readSessionData(_req).customer!;

    logger([
      ["\n Products ", "bg-blue", true],
      [`[${data.id}]`, "fg-cyan", true],
      [` Read Products successfully`, "fg-magenta", true],
    ]);

    _res.status(200).send({ success: true, msg: "Cart Items", data: { products, currency: CURRENCY, weightUnit: WEIGHT_UNIT } } satisfies ProductsResponse);
  });
};
