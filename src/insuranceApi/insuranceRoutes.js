import express from "express";
import { submitInsurance, getInsuranceDetails, getUserInsurance } from "./insuranceController.js";

const router = express.Router();

router.post("/submit", submitInsurance);
router.get("/all", getInsuranceDetails);
router.get("/user/:mobileNumber", getUserInsurance);

export default router;