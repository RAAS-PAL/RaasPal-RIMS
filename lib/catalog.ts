import type { CategoryId, CategoryMeta, WarehouseMeta } from "./types";

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  cleaning: {
    id: "cleaning",
    label: "Cleaning",
    blurb: "Scrubbers, sweepers and vacuum units for floors and open halls.",
  },
  delivery: {
    id: "delivery",
    label: "Delivery",
    blurb: "Tray and cabinet robots that carry goods between floors and rooms.",
  },
  reception: {
    id: "reception",
    label: "Reception",
    blurb: "Front-of-house robots that greet, guide and hand over.",
  },
  patrol: {
    id: "patrol",
    label: "Patrol",
    blurb: "Security and inspection units running scheduled routes.",
  },
  cooking: {
    id: "cooking",
    label: "Cooking",
    blurb: "Automated woks and fryers for commercial kitchens.",
  },
  "canal-cleaning": {
    id: "canal-cleaning",
    label: "Canal cleaning",
    blurb: "Surface craft that collect waste from waterways.",
  },
  spider: {
    id: "spider",
    label: "Spider",
    blurb: "Facade units that climb and clean high-rise glass.",
  },
};

export const CATEGORY_ORDER: CategoryId[] = [
  "cleaning",
  "delivery",
  "reception",
  "patrol",
  "cooking",
  "canal-cleaning",
  "spider",
];

export const WAREHOUSES: WarehouseMeta[] = [
  { code: "BKK-WH01", name: "Bangkok distribution centre", city: "Bangkok" },
  { code: "CNX-WH02", name: "Chiang Mai hub", city: "Chiang Mai" },
  { code: "PKT-WH03", name: "Phuket depot", city: "Phuket" },
];

export const DEFAULT_WAREHOUSE = WAREHOUSES[0].code;

export function warehouseName(code: string) {
  return WAREHOUSES.find((w) => w.code === code)?.name ?? code;
}

/* ---------------------------------------------------------------------------
   Commercial model
   RaasPal quotes three ways off a single buy-off price: outright purchase, a
   monthly lease, and an annual maintenance agreement. Both schedules are fixed
   shares of the buy-off price, so changing a price re-prices every quote.
   The rates below are the ones used on the published Beetle sheet.
--------------------------------------------------------------------------- */

/** Monthly lease rate as a share of buy-off, by contract length in years. */
export const LEASE_RATES: {
  years: number;
  rate: number;
  recommended?: boolean;
}[] = [
  { years: 1, rate: 0.062444 },
  { years: 2, rate: 0.055556 },
  { years: 3, rate: 0.05, recommended: true },
  { years: 4, rate: 0.045556 },
  { years: 5, rate: 0.041778 },
];

/** Annual maintenance rate as a share of buy-off, by agreement length. */
export const MA_RATES: { years: number; rate: number }[] = [
  { years: 2, rate: 0.12 },
  { years: 3, rate: 0.13 },
  { years: 4, rate: 0.14 },
  { years: 5, rate: 0.15 },
];

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

export function leaseSchedule(buyOff: number) {
  return LEASE_RATES.map(({ years, rate, recommended }) => ({
    years,
    monthly: roundTo(buyOff * rate, 100),
    ...(recommended ? { recommended: true } : {}),
  }));
}

export function maintenanceSchedule(buyOff: number) {
  return MA_RATES.map(({ years, rate }) => ({
    years,
    yearly: roundTo(buyOff * rate, 500),
  }));
}
