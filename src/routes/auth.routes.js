import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { validationRegisterUser, validationLoginUser, validate } from "../middlewares/validation.js";

const router = express.Router();

router.post("/register", validationRegisterUser, validate, registerUser);
router.post("/login", validationLoginUser, validate, loginUser);

export default router;