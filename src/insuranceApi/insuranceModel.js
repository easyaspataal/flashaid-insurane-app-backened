import { db_query } from "../db/pgDb.js";

// Save insurance entry with members, handling existing users by mobile number
export async function saveInsurance(planType, members, mobileNumber) {
  try {
    // Check if user already exists by mobile number
    const userResult = await db_query(
      "SELECT id FROM qatar_users_tb WHERE mobile_number = $1",
      [mobileNumber]
    );

    let userId;

    if (userResult?.rows?.length > 0) {
      // User exists, use existing user ID
      userId = userResult.rows[0].id;
    } else {
      // Create new user
      const newUserResult = await db_query(
        "INSERT INTO qatar_users_tb (mobile_number) VALUES ($1) RETURNING id",
        [mobileNumber]
      );
      userId = newUserResult.rows[0].id;
    }

    // Create new insurance entry linked to the user
    const insuranceResult = await db_query(
      "INSERT INTO qatar_insurance_tb (user_id, plan_type) VALUES ($1, $2) RETURNING id, plan_type, created_at",
      [userId, planType]
    );

    if (!insuranceResult || insuranceResult.rows.length === 0) {
      throw new Error("Failed to insert insurance record");
    }

    const insuranceId = insuranceResult.rows[0].id;

    // Insert members
    for (const member of members) {
      await db_query(
        "INSERT INTO qatar_insurance_members_tb (insurance_id, role, name, gender, dob) VALUES ($1, $2, $3, $4, $5)",
        [insuranceId, member.role, member.name, member.gender, member.dob]
      );
    }

    return {
      ...insuranceResult.rows[0],
      userId,
      mobileNumber
    };
  } catch (err) {
    throw err;
  }
}

// Get all insurance data with members and user information
export async function getAllInsurance() {
  try {
    const insuranceResult = await db_query(`
      SELECT i.*, u.mobile_number 
      FROM qatar_insurance_tb i 
      JOIN qatar_users_tb u ON i.user_id = u.id 
      ORDER BY i.id DESC
    `, []);

    const allInsurance = [];

    for (const ins of insuranceResult.rows) {
      const membersResult = await db_query(
        "SELECT role, name, gender, dob FROM qatar_insurance_members_tb WHERE insurance_id = $1",
        [ins.id]
      );
      allInsurance.push({
        ...ins,
        members: membersResult.rows,
      });
    }

    return allInsurance;
  } catch (err) {
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
      return {
        mobileNumber,
        insurancePlans: []
      };
    }

    const userId = userResult.rows[0].id;

    const insuranceResult = await db_query(
      "SELECT * FROM qatar_insurance_tb WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const userInsurance = [];

    for (const ins of insuranceResult.rows) {
      const membersResult = await db_query(
        "SELECT role, name, gender, dob FROM qatar_insurance_members_tb WHERE insurance_id = $1",
        [ins.id]
      );
      userInsurance.push({
        ...ins,
        members: membersResult.rows,
      });
    }

    return {
      mobileNumber,
      userId,
      insurancePlans: userInsurance
    };
  } catch (err) {
    throw err;
  }
}