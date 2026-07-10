import { db } from "./index";
import { appStats } from "./schema";
import { sql, eq } from "drizzle-orm";

export async function incrementScanCount(): Promise<void> {
  try {
    await db
      .insert(appStats)
      .values({ id: "singleton", totalScans: 1 })
      .onConflictDoUpdate({
        target: appStats.id,
        set: { totalScans: sql`${appStats.totalScans} + 1` },
      });
  } catch (err) {
    console.error("Failed to increment scan count", err);
  }
}

export async function getTotalScans(): Promise<number> {
  try {
    const [row] = await db
      .select()
      .from(appStats)
      .where(eq(appStats.id, "singleton"));
    return row?.totalScans ?? 0;
  } catch (err) {
    console.error("Failed to read scan count", err);
    return 0;
  }
}
