import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import candidatesRouter from "./candidates";
import votesRouter from "./votes";
import authRouter from "./auth";
import adminsRouter from "./admins";
import settingsRouter from "./settings";
import commentsRouter from "./comments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminsRouter);
router.use(studentsRouter);
router.use(candidatesRouter);
router.use(votesRouter);
router.use(settingsRouter);

export default router;
