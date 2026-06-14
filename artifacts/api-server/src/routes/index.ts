import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import desksRouter from "./desks.js";
import statsRouter from "./stats.js";
import activityRouter from "./activity.js";
import authRouter from "./auth.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(desksRouter);
router.use(statsRouter);
router.use(activityRouter);
router.use(authRouter);
router.use(adminRouter);

export default router;
