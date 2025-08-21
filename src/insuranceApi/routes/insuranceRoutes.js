import express from "express";
import {submitInsurance,getInsuranceDetails} from '../controller/insuranceController.js'


const router = express.Router();

router.post("/submit", submitInsurance);
router.get("/all", getInsuranceDetails);

export default router;