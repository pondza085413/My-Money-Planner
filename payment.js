const form = document.getElementById("paymentForm");
const statusBox = document.getElementById("statusBox");

function showStatus(message, type = "info"){
  statusBox.className = `status-box ${type}`;
  statusBox.innerHTML = message;
}

async function uploadSlip(file, requestId){
  const ext = file.name.split(".").pop() || "jpg";
  const path = `slips/${requestId}.${ext}`;

  const { error } = await supabaseClient.storage
    .from("payment-slips")
    .upload(path, file, { upsert: true });

  if(error) throw error;

  const { data } = supabaseClient.storage
    .from("payment-slips")
    .getPublicUrl(path);

  return data.publicUrl;
}

function listenForApproval(requestId){
  showStatus(`
    <strong>ส่งสลิปเรียบร้อยแล้ว</strong><br>
    กรุณารอแอดมินตรวจสอบ หากอนุมัติแล้ว หน้านี้จะพาไปตั้งรหัสผ่านอัตโนมัติ
  `, "info");

  supabaseClient
    .channel(`payment-request-${requestId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "payment_requests",
        filter: `id=eq.${requestId}`
      },
      payload => {
        if(payload.new.status === "approved"){
          const setupToken = payload.new.setup_token || requestId;
          window.location.href = `setup.html?request=${requestId}&token=${setupToken}`;
        }

        if(payload.new.status === "rejected"){
          showStatus("สลิปนี้ไม่ผ่านการตรวจสอบ กรุณาติดต่อแอดมินทาง LINE", "error");
        }

        if(payload.new.status === "disabled"){
          showStatus("รายการนี้ถูกปิดสิทธิ์ กรุณาติดต่อแอดมิน", "error");
        }
      }
    )
    .subscribe();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const customerName = document.getElementById("customerName").value.trim();
  const lineId = document.getElementById("lineId").value.trim();
  const slipFile = document.getElementById("slipFile").files[0];

  if(!customerName || !lineId || !slipFile){
    showStatus("กรุณากรอกข้อมูลให้ครบ", "error");
    return;
  }

  const submitBtn = form.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังส่งข้อมูล...";

  try{
    const requestId = crypto.randomUUID();
    const setupToken = crypto.randomUUID();

    showStatus("กำลังอัปโหลดสลิป...", "info");

    const slipUrl = await uploadSlip(slipFile, requestId);

    showStatus("กำลังบันทึกคำร้อง...", "info");

    const { error: insertError } = await supabaseClient
      .from("payment_requests")
      .insert({
        id: requestId,
        customer_name: customerName,
        line_id: lineId,
        amount: APP_PRICE,
        slip_url: slipUrl,
        status: "pending",
        setup_token: setupToken
      });

    if(insertError) throw insertError;

    localStorage.setItem("mmp_pending_request_id", requestId);
    listenForApproval(requestId);
  }catch(error){
    console.error(error);
    showStatus(`
      ส่งข้อมูลไม่สำเร็จ<br>
      รายละเอียด: ${error.message || error}
    `, "error");

    submitBtn.disabled = false;
    submitBtn.textContent = "ส่งสลิปและรออนุมัติ";
  }
});
