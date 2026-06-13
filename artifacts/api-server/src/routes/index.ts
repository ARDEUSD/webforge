import { Router, type IRouter } from "express";
import healthRouter from "./health";
import desksRouter from "./desks";
import statsRouter from "./stats";
import activityRouter from "./activity";
import authRouter from "./auth";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(desksRouter);
router.use(statsRouter);
router.use(activityRouter);
router.use(authRouter);
router.use(adminRouter);

export default router;
