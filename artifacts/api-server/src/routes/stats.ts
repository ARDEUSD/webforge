import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { desksTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const [totalRow] = await db.select({ count: count() }).from(desksTable);
  const [occupiedRow] = await db
    .select({ count: count() })
    .from(desksTable)
    .where(eq(desksTable.status, "occupied"));
  const [freeRow] = await db
    .select({ count: count() })
    .from(desksTable)
    .where(eq(desksTable.status, "free"));
  const [awayRow] = await db
    .select({ count: count() })
    .from(desksTable)
    .where(eq(desksTable.status, "away"));

  const total = Number(totalRow?.count ?? 0);
  const occupied = Number(occupiedRow?.count ?? 0);
  const free = Number(freeRow?.count ?? 0);
  const away = Number(awayRow?.count ?? 0);
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  res.json({ total, occupied, free, away, occupancyRate });
});

export default router;
