const adminPassword = "Pp666..";

const input = prompt("กรอกรหัสแอดมิน");

if (input !== adminPassword) {
  alert("ไม่มีสิทธิ์เข้าใช้งาน");
  window.location.href = "payment.html";
}

const list = document.getElementById("requestsList");

function escapeText(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadStats(){
  const { count: users } = await supabaseClient
    .from("payment_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: pending } = await supabaseClient
    .from("payment_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: approved } = await supabaseClient
    .from("payment_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  document.getElementById("totalUsers").textContent = users || 0;
  document.getElementById("pendingCount").textContent = pending || 0;
  document.getElementById("approvedCount").textContent = approved || 0;
}

async function loadRequests(){
  list.innerHTML = "กำลังโหลด...";

  const { data, error } = await supabaseClient
    .from("payment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("payment_requests data:", data);
  console.log("payment_requests error:", error);

  if(error){
    list.innerHTML = `<div class="status-box error">โหลดข้อมูลไม่สำเร็จ: ${error.message}</div>`;
    return;
  }

  if(!data || data.length === 0){
    list.innerHTML = `<div class="empty">ยังไม่มีรายการชำระเงิน</div>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <article class="request-card">
      <div>
        <h3>${item.customer_name || "-"}</h3>
        <p>LINE ID: <b>${item.line_id || "-"}</b></p>
        <p>ยอด: <b>${Number(item.amount || 0).toLocaleString("th-TH")} บาท</b></p>
        <p>สถานะ: <span class="pill ${item.status}">${item.status || "-"}</span></p>
        <p>Remark: <b>${item.remark || "-"}</b></p>
        <p class="small">${item.created_at ? new Date(item.created_at).toLocaleString("th-TH") : ""}</p>
      </div>

      <div class="admin-actions">
        ${item.slip_url ? `<a class="secondary-btn" href="${item.slip_url}" target="_blank">ดูสลิป</a>` : ""}

        <button class="secondary-btn" onclick="editRemark('${item.id}')">
          ใส่ Remark
        </button>

        ${item.status === "pending" ? `
          <button class="primary-btn" onclick="approvePayment('${item.id}')">อนุมัติ</button>
          <button class="danger-btn" onclick="rejectPayment('${item.id}')">ไม่อนุมัติ</button>
        ` : ""}

        ${item.status === "approved" ? `
          <button class="danger-btn" onclick="deleteRequest('${item.id}')">ปิดสิทธิ์</button>
        ` : ""}
      </div>
    </article>
  `).join("");
}

async function approvePayment(id) {
  const { error } = await supabaseClient
    .from("payment_requests")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) {
    alert("อนุมัติไม่สำเร็จ: " + error.message);
    return;
  }

  await refreshAll();
}

async function rejectPayment(id) {
  const { error } = await supabaseClient
    .from("payment_requests")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    alert("ไม่อนุมัติไม่สำเร็จ: " + error.message);
    return;
  }

  await refreshAll();
}

async function editRemark(id) {
  const { data, error: loadError } = await supabaseClient
    .from("payment_requests")
    .select("remark")
    .eq("id", id)
    .single();

  if (loadError) {
    alert("โหลด remark ไม่สำเร็จ: " + loadError.message);
    return;
  }

  const remark = prompt("ใส่หมายเหตุ / Remark", data?.remark || "");

  if (remark === null) return;

  const { error } = await supabaseClient
    .from("payment_requests")
    .update({ remark })
    .eq("id", id);

  if (error) {
    alert("บันทึก remark ไม่สำเร็จ: " + error.message);
    return;
  }

  await refreshAll();
}

async function deleteRequest(id) {
  const confirmDelete = confirm("ยืนยันปิดสิทธิ์ผู้ใช้งานนี้? ข้อมูลจะยังอยู่ในหน้าแอดมิน");

  if (!confirmDelete) return;

  const { data: request, error: loadError } = await supabaseClient
    .from("payment_requests")
    .select("user_id")
    .eq("id", id)
    .single();

  if (loadError) {
    alert("โหลดข้อมูลรายการไม่สำเร็จ: " + loadError.message);
    return;
  }

  if (request?.user_id) {
    const { error: userError } = await supabaseClient
      .from("users")
      .update({
        is_active: false,
        device_id: null
      })
      .eq("id", request.user_id);

    if (userError) {
      alert("ปิดสิทธิ์ user ไม่สำเร็จ: " + userError.message);
      return;
    }
  }

  const { error } = await supabaseClient
    .from("payment_requests")
    .update({ status: "disabled" })
    .eq("id", id);

  if (error) {
    alert("เปลี่ยนสถานะรายการไม่สำเร็จ: " + error.message);
    return;
  }

  alert("ปิดสิทธิ์ผู้ใช้งานแล้ว แต่ข้อมูลยังอยู่ในแอดมิน");

  await refreshAll();
}
