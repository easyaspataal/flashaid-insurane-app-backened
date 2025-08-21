import { saveInsurance, getAllInsurance } from "../modal/insuranceModel.js";


export const submitInsurance = async (req, res) => {
    console.log(' req.body', req.body)
  const { planType, members } = req.body;

  if (!planType || !members || !Array.isArray(members)) {
    return res.status(400).json({ error: "Invalid data format" });
  }

  try {
    const newEntry = await saveInsurance(planType, members);
    res.status(201).json({
      message: "Insurance submitted successfully",
      data: newEntry,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

export const getInsuranceDetails = async (req, res) => {
  try {
    const allData = await getAllInsurance();
    res.json(allData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};