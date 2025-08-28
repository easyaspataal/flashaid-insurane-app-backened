// insuranceController.js
import { saveInsurance, getAllInsurance, getUserByMobile } from "./insuranceModel.js";

export const submitInsurance = async (req, res) => {
  const { planType, members, mobileNumber, transactionId, amount, currency, email, udf5 } = req.body;

  if (!planType || !members || !Array.isArray(members) || !mobileNumber) {
    return res.status(400).json({ 
      error: "Invalid data format. planType, members array, and mobileNumber are required" 
    });
  }

  try {
    const newEntry = await saveInsurance(
      planType, 
      members, 
      mobileNumber, 
      transactionId, 
      amount, 
      currency, 
      email, 
      udf5
    );
    res.status(201).json({
      message: "Insurance submitted successfully",
      data: newEntry,
    });
  } catch (err) {
    console.error("Insurance submission error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

export const getInsuranceDetails = async (req, res) => {
  try {
    const allData = await getAllInsurance();
    res.json(allData);
  } catch (err) {
    console.error("Get insurance details error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

export const getUserInsurance = async (req, res) => {
  const { mobileNumber } = req.params;
  
  if (!mobileNumber) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const userData = await getUserByMobile(mobileNumber);
    res.json(userData);
  } catch (err) {
    console.error("Get user insurance error:", err);
    res.status(500).json({ error: "Database error" });
  }
};
