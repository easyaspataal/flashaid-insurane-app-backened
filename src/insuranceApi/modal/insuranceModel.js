import { db_query } from "../../db.js";

// Save insurance entry with members
export async function saveInsurance(planType, members) {
  try {
    const insuranceResult = await db_query(
      "INSERT INTO insurance_tb2 (plan_type) VALUES ($1) RETURNING id, plan_type, created_at",
      [planType]
    );

    const insuranceId = insuranceResult.rows[0].id;

    for (const member of members) {
      await db_query(
        "INSERT INTO members_tb2 (insurance_id, role, name, gender, dob) VALUES ($1, $2, $3, $4, $5)",
        [insuranceId, member.role, member.name, member.gender, member.dob]
      );
    }

    return insuranceResult.rows[0];
  } catch (err) {
    throw err;
  }
}


// Get all insurance data with members
export async function getAllInsurance() {
  try {
    const insuranceResult = await db_query("SELECT * FROM insurance_tb2 ORDER BY id DESC", []);
    const allInsurance = [];

    for (const ins of insuranceResult.rows) {
      const membersResult = await db_query("SELECT role, name, gender, dob FROM members_tb2 WHERE insurance_id = $1", [ins.id]);
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