import crypto from "crypto";
import { payuClient, PAYU_ENV } from "./payu.instance.js";
import { updateInsuranceStatusByTxnId } from "../insuranceApi/insuranceModel.js";

/** Build hash string with 15 empty UDFs */
function buildHash({ key, salt, txnid, amount, productinfo, firstname, email, udf5 = "" }) {
  const parts = [
    key, txnid, amount, productinfo, firstname, email,
    "", "", "", "",      // udf1..udf4 empty
    udf5,                // udf5 value
    "", "", "", "", "",  // udf6..udf10 empty
    salt
  ];
  return crypto.createHash("sha512").update(parts.join("|")).digest("hex");
}

/** Map PayU payload -> only columns that exist in qatar_insurance_transactions (NO EXTRAS) */
function toDbTransactionDetails(src = {}) {
  return {
    payment_mode: src.payment_mode || src.mode || null,
    bank_ref_num: src.bank_ref_num || src.bankrefno || null,
    pg_transaction_id: src.pg_transaction_id || src.mihpayid || null,
    addedon: src.addedon || null,
    error_message: src.error_message || src.error_Message || src.error || null,
    field9: src.field9 || null,
    mihpayid: src.mihpayid || null,
    net_amount_debit: src.net_amount_debit || null,
    payment_source: src.payment_source || null,
    pg_type: src.pg_type || src.PG_TYPE || null,
    bankcode: src.bankcode || null,
    hash_value: src.hash_value || src.hash || null,
    error_code: src.error_code || src.error || null,
    phone: src.phone || null,
  };
}

/** Normalize PayU status to your model's allowed set */
function normalizeStatus(status, unmappedstatus) {
  const s = String(status || "").toLowerCase();
  const u = String(unmappedstatus || "").toLowerCase();

  if (s === "success" || u === "captured") return "SUCCESS";
  if (s === "pending" || s === "awaited" || s === "auth") return "PENDING";
  return "FAILED";
}

/** Update qatar_insurance_transactions using your model (no extra fields) */
async function storeTransactionDetails(transactionData) {
  const txnid = transactionData.txnid;
  const status = normalizeStatus(transactionData.status, transactionData.unmappedstatus);
  const details = toDbTransactionDetails(transactionData);


  // Update by transaction id; only allowed columns are set in the model
  const updated = await updateInsuranceStatusByTxnId(txnid, status, details);
  return updated;
}

export async function redirectPage(req, res) {
  const txnid = req.params.id;

  const loadingHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Processing Payment</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .container {
          text-align: center;
          max-width: 400px;
          width: 90%;
          padding: 40px 20px;
        }
        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid #f3f3f3;
          border-top: 6px solid #FFCB08;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 30px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .title {
          font-size: 28px;
          color: #333;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .message {
          font-size: 18px;
          color: #666;
          margin-bottom: 30px;
          line-height: 1.5;
        }
        .progress-container {
          width: 100%;
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #FFCB08, #FFD700);
          width: 0%;
          animation: progress 2000ms ease-in-out;
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .dots {
          display: inline-block;
        }
        .dots::after {
          content: '';
          animation: dots 2s infinite;
        }
        @keyframes dots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <div class="title">Payment Processing</div>
        <div class="message">
          Verifying your transaction<span class="dots"></span><br>
          Please wait a moment
        </div>
        <div class="progress-container">
          <div class="progress-bar"></div>
        </div>
      </div>
      
      <script>
        console.log('Redirect page loaded for txnid: ${txnid}');
        
        // Immediately start the verification process
        setTimeout(function() {
          console.log('Redirecting to verification...');
          window.location.href = '/api/payu/verify/${txnid}';
        }, 2000);
        
        // Prevent back navigation
        history.pushState(null, null, location.href);
        window.onpopstate = function () {
          history.go(1);
        };
      </script>
    </body>
    </html>
  `;

  res.send(loadingHTML);
}


export async function initiatePayment(req, res) {
  try {
    const { PAYU_KEY, PAYU_SALT } = PAYU_ENV;
    const { txnid, amount, productinfo, firstname, email, phone, udf5 } = req.body || {};

    if (!PAYU_KEY || !PAYU_SALT) return res.status(400).json({ error: "Missing PAYU_KEY or PAYU_SALT" });
    if (!txnid || !amount || !productinfo || !firstname || !email || !phone)
      return res.status(400).json({ error: "Missing required fields" });

    const callbackBase = `${req.protocol}s://${req.get("host")}/api/payu/verify/${encodeURIComponent(txnid)}`;

    const payload = {
      isAmountFilledByCustomer: false,
      txnid,
      amount,
      currency: "QAR",
      productinfo,
      firstname,
      email,
      phone,
      udf5,
      surl: callbackBase,
      furl: callbackBase,
      hash: buildHash({ key: PAYU_KEY, salt: PAYU_SALT, txnid, amount, productinfo, firstname, email, udf5 }),
      drop_category: "CASH,NEFTRTGS,UPI,BNPL"
    };

    const response = await payuClient.paymentInitiate(payload);
    return res.send(response);
  } catch (err) {
    console.error("[PayU] initiatePayment error:", err);
    return res.status(500).json({ error: "initiate_payment_failed" });
  }
}

export async function verifyPayment(req, res) {
  const txnid = req.params.id;

 // Create an intermediate loading page to prevent white screen
        const createLoadingPage = (redirectUrl, delay = 2000) => {
            return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Processing Payment</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
              width: 90%;
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 5px solid #f3f3f3;
              border-top: 5px solid #FFCB08;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .title {
              font-size: 24px;
              color: #333;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .message {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
            }
            .progress-bar {
              width: 100%;
              height: 4px;
              background: #f0f0f0;
              border-radius: 2px;
              overflow: hidden;
              margin-bottom: 20px;
            }
            .progress-fill {
              height: 100%;
              background: #FFCB08;
              width: 0%;
              animation: progress ${delay}ms ease-in-out;
            }
            @keyframes progress {
              0% { width: 0%; }
              100% { width: 100%; }
            }
            .redirect-info {
              font-size: 14px;
              color: #888;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <div class="title">Processing Payment</div>
            <div class="message">Please wait while we verify your transaction...</div>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <div class="redirect-info">You will be redirected automatically</div>
          </div>
          
          <script>
            // Redirect after the specified delay
            setTimeout(function() {
              window.location.href = '${redirectUrl}';
            }, ${delay});
            
            // Prevent user from going back during processing
            history.pushState(null, null, location.href);
            window.onpopstate = function () {
              history.go(1);
            };
          </script>
        </body>
        </html>
      `;
}

  try {
    // 1) POST callback from PayU
    if (req.method === "POST" && req.body) {
      const body = req.body;

      // Update DB (only allowed columns)
      try {
        await storeTransactionDetails({ ...body, txnid, source: "post_callback" });
      } catch (dbError) {
        console.error("Failed to update insurance from POST callback:", dbError);
      }

      const isCancelled =
        String(body.unmappedstatus || "").toLowerCase() === "usercancelled" ||
        /cancel/i.test(String(body.error_Message || "")) ||
        /cancel/i.test(String(body.field9 || ""));

      if (String(body.status || "").toLowerCase() === "success") {
        const successUrl = `https://expats.flashaid.in/PaymentSuccessfulScreen?txnid=${encodeURIComponent(txnid)}`;
        return res.send(createLoadingPage(successUrl, 2000));
      } else if (isCancelled) {
        const cancelUrl = `https://expats.flashaid.in/PayUPayments`;
        return res.send(createLoadingPage(cancelUrl, 2000));
      } else {
        const failureUrl = `https://expats.flashaid.in/PaymentFailedScreen?status=${encodeURIComponent(body.status)}`;
        return res.send(createLoadingPage(failureUrl, 2000));
      }
    }

    // 2) GET fallback: verify via PayU API
    const data = await payuClient.verifyPayment(txnid);
    console.log("=== PayU API Verification Data ===");

    const statusObj = data?.transaction_details?.[txnid];
    if (!statusObj) {
      const failureUrl = `https://expats.flashaid.in/PaymentFailedScreen?status=not_found`;
      return res.send(createLoadingPage(failureUrl, 2000));
    }

    // Update DB from verification response (only allowed columns)
    try {
      await storeTransactionDetails({
        ...statusObj,
        txnid,
        source: "api_verification",
        api_response: data
      });
    } catch (dbError) {
      console.error("Failed to update insurance from API verification:", dbError);
    }

    if (String(statusObj.status || "").toLowerCase() === "success") {
      const successUrl = `https://expats.flashaid.in/PaymentSuccessfulScreen?txnid=${encodeURIComponent(txnid)}`;
      return res.send(createLoadingPage(successUrl, 2000));
    }

    const failureUrl = `https://expats.flashaid.in/PaymentFailedScreen?status=${encodeURIComponent(statusObj.status)}`;
    return res.send(createLoadingPage(failureUrl, 2000));

  } catch (err) {
    console.error("[PayU] verifyPayment error:", err);

    // Best effort: mark as FAILED (within allowed statuses)
    try {
      await storeTransactionDetails({
        txnid,
        status: "failed",
        error_message: err.message,
        source: "verification_error",
        created_at: new Date()
      });
    } catch (dbError) {
      console.error("Failed to store error transaction:", dbError);
    }

    const errorUrl = `https://expats.flashaid.in/PaymentFailedScreen?status=verification_failed`;
    return res.send(createLoadingPage(errorUrl, 2000));
  }
}
