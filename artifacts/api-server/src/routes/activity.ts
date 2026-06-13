import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { activityLogTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/activity", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 50);
  const activity = await db
    .select()
    .from(activityLogTable)
    .orderBy(desc(activityLogTable.occurredAt))
    .limit(limit);
  res.json(activity);
});

export default router;
