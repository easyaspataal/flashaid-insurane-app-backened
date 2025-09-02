// insuranceModel.js
import { db_query } from "../db/pgDb.js";

// Save insurance entry with members and transaction details
export async function saveInsurance(
  planType,
  members,
  mobileNumber,
  transactionId,
  amount,
  currency,
  email,
  udf5,
  status,
  transactionDetails = {}
) {
  try {
    // Ensure user
    const userResult = await db_query(
      "SELECT id FROM qatar_users_tb WHERE mobile_number = $1",
      [mobileNumber]
    );

    let userId;
    if (userResult?.rows?.length > 0) {
      userId = userResult.rows[0].id;
    } else {
      const newUserResult = await db_query(
        "INSERT INTO qatar_users_tb (mobile_number) VALUES ($1) RETURNING id",
        [mobileNumber]
      );
      userId = newUserResult.rows[0].id;
    }

    // Extract only the columns that exist in qatar_insurance_transactions
    const {
      payment_mode = null,
      bank_ref_num = null,
      pg_transaction_id = null,
      addedon = null,
      error_message = null,
      field9 = null,
      mihpayid = null,
      net_amount_debit = null,
      payment_source = null,
      pg_type = null,
      bankcode = null,
      hash_value = null,
      error_code = null,
      phone = null,
    } = transactionDetails;

    // Insert insurance row
    const insuranceResult = await db_query(
      `
      INSERT INTO qatar_insurance_transactions
        (user_id, plan_type, transactionid, amount, currency, email, udf5, status,
         payment_mode, bank_ref_num, pg_transaction_id, addedon, error_message, field9,
         mihpayid, net_amount_debit, payment_source, pg_type, bankcode, hash_value, error_code, phone)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,
         $9,$10,$11,$12,$13,$14,
         $15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING id, user_id, plan_type, transactionid, amount, currency, email, udf5, status,
                payment_mode, bank_ref_num, pg_transaction_id, addedon, error_message, field9,
                mihpayid, net_amount_debit, payment_source, pg_type, bankcode, hash_value, error_code,phone,
                created_at
      `,
      [
        userId, planType, transactionId, amount, currency, email, udf5, status,
        payment_mode, bank_ref_num, pg_transaction_id, addedon, error_message, field9,
        mihpayid, net_amount_debit, payment_source, pg_type, bankcode, hash_value, error_code,phone,
      ]
    );

    if (!insuranceResult || insuranceResult.rows.length === 0) {
      throw new Error("Failed to insert insurance record");
    }

    const insuranceId = insuranceResult.rows[0].id;

    // Insert members
    for (const member of members) {
      await db_query(
        `INSERT INTO qatar_insurance_members_tb (insurance_id, role, name, gender, dob)
         VALUES ($1, $2, $3, $4, $5)`,
        [insuranceId, member.role, member.name, member.gender, member.dob]
      );
    }

    return {
      ...insuranceResult.rows[0],
      userId,
      mobileNumber,
    };
  } catch (err) {
    console.error("Save insurance error:", err);
    throw err;
  }
}

// Update insurance status and selected transaction details
export async function updateInsuranceStatusByTxnId(
  transactionId,
  newStatus,
  transactionDetails = {}
) {
  const allowed = new Set([
    "INITIATED", "PENDING", "SUCCESS", "FAILED",
    "success", "failed", "pending"
  ]);
  if (!allowed.has(newStatus)) {
    throw new Error("Invalid status value");
  }

  let updateFields = ["status = $1"];
  let values = [newStatus];
  let paramIndex = 2;

  // Only columns that exist
  const {
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
  } = transactionDetails;

  if (payment_mode !== undefined) {
    updateFields.push(`payment_mode = $${paramIndex++}`);
    values.push(payment_mode);
  }
  if (bank_ref_num !== undefined) {
    updateFields.push(`bank_ref_num = $${paramIndex++}`);
    values.push(bank_ref_num);
  }
  if (pg_transaction_id !== undefined) {
    updateFields.push(`pg_transaction_id = $${paramIndex++}`);
    values.push(pg_transaction_id);
  }
  if (addedon !== undefined) {
    updateFields.push(`addedon = $${paramIndex++}`);
    values.push(addedon);
  }
  if (error_message !== undefined) {
    updateFields.push(`error_message = $${paramIndex++}`);
    values.push(error_message);
  }
  if (field9 !== undefined) {
    updateFields.push(`field9 = $${paramIndex++}`);
    values.push(field9);
  }
  if (mihpayid !== undefined) {
    updateFields.push(`mihpayid = $${paramIndex++}`);
    values.push(mihpayid);
  }
  if (net_amount_debit !== undefined) {
    updateFields.push(`net_amount_debit = $${paramIndex++}`);
    values.push(net_amount_debit);
  }
  if (payment_source !== undefined) {
    updateFields.push(`payment_source = $${paramIndex++}`);
    values.push(payment_source);
  }
  if (pg_type !== undefined) {
    updateFields.push(`pg_type = $${paramIndex++}`);
    values.push(pg_type);
  }
  if (bankcode !== undefined) {
    updateFields.push(`bankcode = $${paramIndex++}`);
    values.push(bankcode);
  }
  if (hash_value !== undefined) {
    updateFields.push(`hash_value = $${paramIndex++}`);
    values.push(hash_value);
  }
  if (error_code !== undefined) {
    updateFields.push(`error_code = $${paramIndex++}`);
    values.push(error_code);
  }
  if (phone !== undefined) { updateFields.push(`phone = $${paramIndex++}`); values.push(phone); }

  // WHERE param
  values.push(transactionId);

  const result = await db_query(
    `
    UPDATE qatar_insurance_transactions
       SET ${updateFields.join(", ")}
     WHERE transactionid = $${paramIndex}
       AND status IS DISTINCT FROM $1
     RETURNING id, user_id, plan_type, transactionid, amount, currency, email, udf5, status,
               payment_mode, bank_ref_num, pg_transaction_id, addedon, error_message, field9,
               mihpayid, net_amount_debit, payment_source, pg_type, bankcode, hash_value, error_code,phone,
               created_at
    `,
    values
  );

  if (result.rowCount === 0) {
    const exists = await db_query(
      `SELECT 1 FROM qatar_insurance_transactions WHERE transactionid = $1`,
      [transactionId]
    );
    if (exists.rowCount === 0) {
      const e = new Error("Transaction not found");
      e.code = "NOT_FOUND";
      throw e;
    }
  }

  return result.rows[0] ?? null;
}

// Get all insurance data with members and user information
export async function getAllInsurance() {
  try {
    const insuranceResult = await db_query(
      `
      SELECT i.*, u.mobile_number
      FROM qatar_insurance_transactions i
      JOIN qatar_users_tb u ON i.user_id = u.id
      ORDER BY i.id DESC
      `,
      []
    );

    const allInsurance = [];
    for (const ins of insuranceResult.rows) {
      const membersResult = await db_query(
        `SELECT role, name, gender, dob
           FROM qatar_insurance_members_tb
          WHERE insurance_id = $1`,
        [ins.id]
      );
      allInsurance.push({ ...ins, members: membersResult.rows });
    }

    return allInsurance;
  } catch (err) {
    console.error("Get all insurance error:", err);
    throw err;
  }
}

// Get specific user's insurance data by mobile number
export async function getUserByMobile(mobileNumber) {
  try {
    const userResult = await db_query(
      "SELECT id FROM qatar_users_tb WHERE mobile_number = $1",
      [mobileNumber]
    );

    if (!userResult || userResult.rows.length === 0) {
      return { mobileNumber, insurancePlans: [] };
    }

    const userId = userResult.rows[0].id;

    const insuranceResult = await db_query(
      "SELECT * FROM qatar_insurance_transactions WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const userInsurance = [];
    for (const ins of insuranceResult.rows) {
      const membersResult = await db_query(
        `SELECT role, name, gender, dob
           FROM qatar_insurance_members_tb
          WHERE insurance_id = $1`,
        [ins.id]
      );
      userInsurance.push({ ...ins, members: membersResult.rows });
    }

    return { mobileNumber, userId, insurancePlans: userInsurance };
  } catch (err) {
    console.error("Get user by mobile error:", err);
    throw err;
  }
}
