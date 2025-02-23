import express from "express";
import controllers from "../controllers";

const router = express.Router();

router.post("/users", controllers.createUser);
router.post("/transactions", controllers.processTransaction);

export default router;
