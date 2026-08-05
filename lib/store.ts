import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { seedRobots } from "./seed";
import type { ActivityEntry, Database, Robot } from "./types";

/**
 * A JSON file is the record of truth. It is deliberately the only module that
 * touches persistence: swapping in Postgres or the ERP later means rewriting
 * this file and nothing else.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "rims.json");
const IMAGE_DIR = path.join(process.cwd(), "public", "robots");
const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg", ".avif"];

/** Serialises read-modify-write cycles so two operators cannot clobber each
 *  other within a single server process. */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function seedDatabase(): Database {
  const now = Date.now();
  const robots = seedRobots(now);
  const activity: ActivityEntry[] = robots.map((robot) => ({
    id: `seed-${robot.slug}`,
    robotSlug: robot.slug,
    robotName: robot.name,
    kind: "created" as const,
    summary: "Added to the catalogue",
    at: robot.updatedAt,
    by: robot.updatedBy,
  }));
  return { robots, activity };
}

async function loadRaw(): Promise<Database> {
  try {
    const contents = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(contents) as Database;
    if (!Array.isArray(parsed.robots)) throw new Error("malformed");
    return { robots: parsed.robots, activity: parsed.activity ?? [] };
  } catch {
    const seeded = seedDatabase();
    await ensureDir(DATA_DIR);
    await fs.writeFile(DB_FILE, JSON.stringify(seeded, null, 2), "utf8");
    return seeded;
  }
}

/**
 * Photographs are wired up by filename: drop `beetle.webp` into
 * `public/robots/` and the Beetle picks it up on the next request. An explicit
 * `image` path set through the interface always wins.
 */
async function resolveImages(robots: Robot[]): Promise<Robot[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(IMAGE_DIR);
  } catch {
    return robots;
  }
  const bySlug = new Map<string, string>();
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(ext)) continue;
    bySlug.set(path.basename(file, ext).toLowerCase(), `/robots/${file}`);
  }
  return robots.map((robot) =>
    robot.image ? robot : { ...robot, image: bySlug.get(robot.slug) ?? null },
  );
}

export async function readDatabase(): Promise<Database> {
  const db = await loadRaw();
  return { ...db, robots: await resolveImages(db.robots) };
}

export async function listRobots(): Promise<Robot[]> {
  const { robots } = await readDatabase();
  return robots;
}

export async function getRobot(slug: string): Promise<Robot | null> {
  const robots = await listRobots();
  return robots.find((robot) => robot.slug === slug) ?? null;
}

export async function listActivity(limit?: number): Promise<ActivityEntry[]> {
  const { activity } = await readDatabase();
  const sorted = [...activity].sort((a, b) => b.at.localeCompare(a.at));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function listActivityFor(slug: string): Promise<ActivityEntry[]> {
  const activity = await listActivity();
  return activity.filter((entry) => entry.robotSlug === slug);
}

/**
 * Applies a change to one robot and records what happened, in one write.
 * The mutator returns the updated robot plus the log lines it produced; if it
 * returns no entries nothing is written, so a no-op edit leaves no trace.
 */
export async function commitRobotChange(
  slug: string,
  mutate: (robot: Robot) => {
    robot: Robot;
    entries: Omit<ActivityEntry, "id" | "robotSlug" | "robotName" | "at">[];
  },
): Promise<{ ok: true; robot: Robot } | { ok: false; error: string }> {
  return enqueue(async () => {
    const db = await loadRaw();
    const index = db.robots.findIndex((robot) => robot.slug === slug);
    if (index === -1) {
      return { ok: false as const, error: "That robot is no longer in the catalogue." };
    }

    const { robot, entries } = mutate(db.robots[index]);
    if (entries.length === 0) {
      return { ok: true as const, robot };
    }

    const at = new Date().toISOString();
    db.robots[index] = { ...robot, updatedAt: at, updatedBy: entries[0].by };
    db.activity.unshift(
      ...entries.map((entry, offset) => ({
        ...entry,
        id: `${slug}-${Date.now()}-${offset}`,
        robotSlug: slug,
        robotName: robot.name,
        at,
      })),
    );
    /* Keep the log to a working size; older entries belong in an export. */
    db.activity = db.activity.slice(0, 2000);

    await ensureDir(DATA_DIR);
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
    return { ok: true as const, robot: db.robots[index] };
  });
}
