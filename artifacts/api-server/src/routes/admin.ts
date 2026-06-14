import { Router } from "express";
import { db } from "@workspace/db";
import {
  desksTable,
  sessionsTable,
  activityLogTable,
} from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAdmin);

router.get("/admin/desks", async (_req, res) => {
  const rows = await db
    .select({ desk: desksTable, session: sessionsTable })
    .from(desksTable)
    .leftJoin(sessionsTable, eq(desksTable.id, sessionsTable.deskId))
    .orderBy(desksTable.number);

  res.json(rows.map(({ desk, session }) => ({ ...desk, session: session ?? null })));
});

router.post("/admin/desks/:id/reset", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid desk ID" }); return; }

  const [desk] = await db.select().from(desksTable).where(eq(desksTable.id, id));
  if (!desk) { res.status(404).json({ error: "Desk not found" }); return; }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.deskId, id));

  if (session) {
    await db.insert(activityLogTable).values({
      deskId: desk.id,
      deskNumber: desk.number,
      studentName: session.studentName,
      studentId: session.studentId,
      action: "checkout",
    });
    await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
  }

  await db.update(desksTable).set({ status: "free" }).where(eq(desksTable.id, id));
  res.json({ success: true, message: `Desk ${desk.number} force-released` });
});

router.get("/admin/activity", async (req, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 100);
  const offset = parseInt(String(req.query.offset ?? "0"));

  const activity = await db
    .select()
    .from(activityLogTable)
    .orderBy(desc(activityLogTable.occurredAt))
    .limit(limit)
    .offset(offset);

  res.json(activity);
});

export default router;
