import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import candidatesRouter from "./candidates";
import votesRouter from "./votes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(candidatesRouter);
router.use(votesRouter);

export default router;
