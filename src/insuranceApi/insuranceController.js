// insuranceController.js
import {
  saveInsurance,
  getAllInsurance,
  getUserByMobile,
  updateInsuranceStatusByTxnId,
} from "./insuranceModel.js";

export const submitInsurance = async (req, res) => {
  const {
    planType,
    members,
    mobileNumber,
    transactionId,
    amount,
    currency,
    email,
    udf5,
    status,
    // Only the fields that exist in qatar_insurance_transactions
    payment_mode,
    bank_ref_num,
    pg_transaction_id,
    addedon,
    error_message,
    field9,
    mihpayid,
    net_amount_debit,
    payment_source,
    pg_type,
    bankcode,
    hash_value,
    error_code,
    phone,
  } = req.body;

  if (!planType || !members || !Array.isArray(members) || !mobileNumber) {
    return res.status(400).json({
      error:
        "Invalid data format. planType, members array, and mobileNumber are required",
    });
  }

  try {
    const transactionDetails = {
      payment_mode,
      bank_ref_num,
      pg_transaction_id,
      addedon,
      error_message,
      field9,
      mihpayid,
      net_amount_debit,
      payment_source,
      pg_type,
      bankcode,
      hash_value,
      error_code,
      phone,
    };

    const newEntry = await saveInsurance(
      planType,
      members,
      mobileNumber,
      transactionId,
      amount,
      currency,
      email,
      udf5,
      status,
      transactionDetails
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

export const updateInsuranceStatus = async (req, res) => {
  try {
    const {
      transactionId,
      status,
      // Only columns the model updates
      payment_mode,
      bank_ref_num,
      pg_transaction_id,
      addedon,
      error_message,
      field9,
      mihpayid,
      net_amount_debit,
      payment_source,
      pg_type,
      bankcode,
      hash_value,
      error_code,
      phone,
    } = req.body;

    if (!transactionId || !status) {
      return res
        .status(400)
        .json({ error: "transactionId and status are required" });
    }

    const transactionDetails = {};
    if (payment_mode !== undefined) transactionDetails.payment_mode = payment_mode;
    if (bank_ref_num !== undefined) transactionDetails.bank_ref_num = bank_ref_num;
    if (pg_transaction_id !== undefined) transactionDetails.pg_transaction_id = pg_transaction_id;
    if (addedon !== undefined) transactionDetails.addedon = addedon;
    if (error_message !== undefined) transactionDetails.error_message = error_message;
    if (field9 !== undefined) transactionDetails.field9 = field9;
    if (mihpayid !== undefined) transactionDetails.mihpayid = mihpayid;
    if (net_amount_debit !== undefined) transactionDetails.net_amount_debit = net_amount_debit;
    if (payment_source !== undefined) transactionDetails.payment_source = payment_source;
    if (pg_type !== undefined) transactionDetails.pg_type = pg_type;
    if (bankcode !== undefined) transactionDetails.bankcode = bankcode;
    if (hash_value !== undefined) transactionDetails.hash_value = hash_value;
    if (error_code !== undefined) transactionDetails.error_code = error_code;
    if (phone !== undefined) transactionDetails.phone = phone; 

    const updated = await updateInsuranceStatusByTxnId(
      transactionId,
      status,
      transactionDetails
    );

    return res.status(200).json({
      message: "Status updated", 
      data: updated,
    });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ error: "Transaction not found" });
    }
    console.error("Update status error:", err);
    return res.status(500).json({ error: "Database error" });
  }
};
