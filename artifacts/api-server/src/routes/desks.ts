import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  desksTable,
  sessionsTable,
  activityLogTable,
} from "@workspace/db/schema";
import { eq, and, lt, ilike } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const AWAY_TIMEOUT_MS = 30 * 60 * 1000;

async function autoReleaseAway() {
  const cutoff = new Date(Date.now() - AWAY_TIMEOUT_MS);
  const expired = await db
    .select({ session: sessionsTable, desk: desksTable })
    .from(sessionsTable)
    .innerJoin(desksTable, eq(sessionsTable.deskId, desksTable.id))
    .where(and(eq(sessionsTable.status, "away"), lt(sessionsTable.updatedAt, cutoff)));

  for (const { session, desk } of expired) {
    await db.insert(activityLogTable).values({
      deskId: desk.id,
      deskNumber: desk.number,
      studentName: session.studentName,
      studentId: session.studentId,
      action: "checkout",
    });
    await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
    await db.update(desksTable).set({ status: "free" }).where(eq(desksTable.id, desk.id));
  }
}

router.get("/desks", async (_req, res) => {
  await autoReleaseAway();
  const rows = await db
    .select({ desk: desksTable, session: sessionsTable })
    .from(desksTable)
    .leftJoin(sessionsTable, eq(desksTable.id, sessionsTable.deskId))
    .orderBy(desksTable.number);

  res.json(rows.map(({ desk, session }) => ({ ...desk, session: session ?? null })));
});

router.get("/desks/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  if (!q) { res.json([]); return; }

  await autoReleaseAway();
  const rows = await db
    .select({ desk: desksTable, session: sessionsTable })
    .from(desksTable)
    .leftJoin(sessionsTable, eq(desksTable.id, sessionsTable.deskId))
    .orderBy(desksTable.number);

  const zoneKeywords: Record<string, string[]> = {
    quiet_study: ["quiet", "study"],
    collaboration: ["collaboration", "collab"],
    pc_lab: ["pc", "lab", "computer"],
    window_view: ["window", "view"],
  };

  const numericQ = parseInt(q);
  const filtered = rows
    .filter(({ desk }) => {
      if (!isNaN(numericQ) && desk.number === numericQ) return true;
      const keywords = zoneKeywords[desk.zone] ?? [];
      return keywords.some((kw) => kw.includes(q) || q.includes(kw));
    })
    .map(({ desk, session }) => ({ ...desk, session: session ?? null }));

  res.json(filtered);
});

router.get("/desks/my-desk", async (req, res) => {
  const studentId = String(req.query.studentId ?? "").trim();
  if (!studentId) {
    res.status(400).json({ error: "studentId query param is required" });
    return;
  }

  await autoReleaseAway();
  const rows = await db
    .select({ desk: desksTable, session: sessionsTable })
    .from(sessionsTable)
    .innerJoin(desksTable, eq(sessionsTable.deskId, desksTable.id))
    .where(ilike(sessionsTable.studentId, studentId));

  if (!rows.length) {
    res.status(404).json({ error: "No active session found for this Student ID" });
    return;
  }

  const { desk, session } = rows[0];
  res.json({ ...desk, session: session ?? null });
});

router.get("/desks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid desk ID" }); return; }

  const rows = await db
    .select({ desk: desksTable, session: sessionsTable })
    .from(desksTable)
    .leftJoin(sessionsTable, eq(desksTable.id, sessionsTable.deskId))
    .where(eq(desksTable.id, id));

  if (!rows.length) { res.status(404).json({ error: "Desk not found" }); return; }
  const { desk, session } = rows[0];
  res.json({ ...desk, session: session ?? null });
});

const checkinSchema = z.object({
  studentName: z.string().min(1).max(100),
  studentId: z.string().min(1).max(50),
});

router.post("/desks/:id/checkin", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid desk ID" }); return; }

  const parsed = checkinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const { studentName, studentId } = parsed.data;

  const [desk] = await db.select().from(desksTable).where(eq(desksTable.id, id));
  if (!desk) { res.status(404).json({ error: "Desk not found" }); return; }
  if (desk.status !== "free") { res.status(409).json({ error: "Desk is not available" }); return; }

  const existing = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.studentId, studentId));
  if (existing.length > 0) {
    res.status(409).json({ error: "Student already has an active session at another desk" });
    return;
  }

  await db.insert(sessionsTable).values({ deskId: id, studentName, studentId });
  await db.update(desksTable).set({ status: "occupied" }).where(eq(desksTable.id, id));
  await db.insert(activityLogTable).values({
    deskId: id,
    deskNumber: desk.number,
    studentName,
    studentId,
    action: "checkin",
  });

  res.json({ success: true, message: `Checked in to Desk ${desk.number}` });
});

router.post("/desks/:id/away", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid desk ID" }); return; }

  const [desk] = await db.select().from(desksTable).where(eq(desksTable.id, id));
  if (!desk) { res.status(404).json({ error: "Desk not found" }); return; }
  if (desk.status !== "occupied") {
    res.status(409).json({ error: "Desk is not currently occupied" });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.deskId, id));
  if (!session) { res.status(404).json({ error: "No active session found" }); return; }

  await db
    .update(sessionsTable)
    .set({ status: "away", updatedAt: new Date() })
    .where(eq(sessionsTable.id, session.id));
  await db.update(desksTable).set({ status: "away" }).where(eq(desksTable.id, id));
  await db.insert(activityLogTable).values({
    deskId: id,
    deskNumber: desk.number,
    studentName: session.studentName,
    studentId: session.studentId,
    action: "away",
  });

  res.json({ success: true, message: `Desk ${desk.number} marked as away` });
});

router.post("/desks/:id/checkout", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid desk ID" }); return; }

  const [desk] = await db.select().from(desksTable).where(eq(desksTable.id, id));
  if (!desk) { res.status(404).json({ error: "Desk not found" }); return; }
  if (desk.status === "free") {
    res.status(409).json({ error: "Desk is already free" });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.deskId, id));
  if (!session) { res.status(404).json({ error: "No active session found" }); return; }

  await db.insert(activityLogTable).values({
    deskId: id,
    deskNumber: desk.number,
    studentName: session.studentName,
    studentId: session.studentId,
    action: "checkout",
  });
  await db.delete(sessionsTable).where(eq(sessionsTable.id, session.id));
  await db.update(desksTable).set({ status: "free" }).where(eq(desksTable.id, id));

  res.json({ success: true, message: `Desk ${desk.number} released` });
});

export default router;
