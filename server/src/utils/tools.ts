import fs from "fs";
import type { CustomerType } from "@/types/store";
import {
  CUSTOMERS_FILE_PATH,
  PRODUCTS_FILE_PATH,
  TEMP_CUSTOMERS_FILE_PATH,
  TEMP_PRODUCTS_FILE_PATH,
} from "./globals";
import { logger } from "./logger";

export const waitFor = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const readLocalJsonFile = (path: string) => {
  return JSON.parse(fs.readFileSync(path).toString());
};

export const writeToLocalJsonFile = (path: string, newData: unknown) => {
  fs.writeFileSync(path, JSON.stringify(newData, null, 2));
};

// ============================================================================

export const createTempProductsFile = () => {
  logger([
    ["\n Initialization ", "bg-magenta", true],
    ["Temp products file created", "fg-magenta"]
  ]);
  fs.copyFileSync(PRODUCTS_FILE_PATH, TEMP_PRODUCTS_FILE_PATH);
};

export const createTempCustomersFile = () => {
  logger([
    ["\n Initialization ", "bg-magenta", true],
    ["Temp customers file created", "fg-magenta"]
  ]);
  fs.copyFileSync(CUSTOMERS_FILE_PATH, TEMP_CUSTOMERS_FILE_PATH);
};

export const readProducts = () => {
  return readLocalJsonFile(TEMP_PRODUCTS_FILE_PATH) as unknown as ProductType[];
};

export const updateProducts = (newData: ProductType[]) => {
  writeToLocalJsonFile(TEMP_PRODUCTS_FILE_PATH, newData) as unknown as ProductType[];
};

export const readCustomers = () => {
  return readLocalJsonFile(TEMP_CUSTOMERS_FILE_PATH) as unknown as CustomerType[];
};

export const updateCustomers = (newData: CustomerType[]) => {
  writeToLocalJsonFile(TEMP_CUSTOMERS_FILE_PATH, newData) as unknown as CustomerType[];
}
