import { CATEGORIES } from "./types";
import type { CategoryId, Robot } from "./types";
import { summarizeStock } from "./types";

export interface CatalogQuery {
  q: string;
  category: CategoryId | "";
  stock: string;
  sort: string;
  view: "grid" | "table";
}

type RawParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export function parseCatalogQuery(params: RawParams): CatalogQuery {
  const category = one(params.category);
  return {
    q: one(params.q).trim(),
    category: (CATEGORIES as readonly string[]).includes(category)
      ? (category as CategoryId)
      : "",
    stock: one(params.stock),
    sort: one(params.sort) || "updated",
    view: one(params.view) === "table" ? "table" : "grid",
  };
}

export function applyCatalogQuery(robots: Robot[], query: CatalogQuery): Robot[] {
  let result = robots;

  if (query.category) {
    result = result.filter((robot) => robot.category === query.category);
  }

  if (query.q) {
    const needle = query.q.toLowerCase();
    result = result.filter(
      (robot) =>
        robot.name.toLowerCase().includes(needle) ||
        robot.modelId.toLowerCase().includes(needle) ||
        robot.tagline.toLowerCase().includes(needle),
    );
  }

  if (query.stock) {
    result = result.filter((robot) => {
      const stock = summarizeStock(robot);
      switch (query.stock) {
        case "attention":
          return stock.state !== "in-stock";
        case "demo":
          return stock.demo > 0;
        default:
          return stock.state === query.stock;
      }
    });
  }

  const sorted = [...result];
  switch (query.sort) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "stock-low":
      sorted.sort(
        (a, b) => summarizeStock(a).onHand - summarizeStock(b).onHand,
      );
      break;
    case "stock-high":
      sorted.sort(
        (a, b) => summarizeStock(b).onHand - summarizeStock(a).onHand,
      );
      break;
    case "price-high":
      sorted.sort((a, b) => b.buyOff - a.buyOff);
      break;
    case "price-low":
      sorted.sort((a, b) => a.buyOff - b.buyOff);
      break;
    default:
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  return sorted;
}
