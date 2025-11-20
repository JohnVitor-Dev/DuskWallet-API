import express from "express";
import { getAnalysis, getLastAnalysis, getAnalysisStatus } from "../controllers/analysis.controller.js";
import { checkAiLimit } from "../middlewares/checkAiLimit.js";

const router = express.Router();

router.get('/', checkAiLimit, getAnalysis);
router.get('/last', getLastAnalysis);
router.get('/status', getAnalysisStatus);

export default router;