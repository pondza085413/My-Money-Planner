const list = document.getElementById("requestsList");

async function loadStats(){
  const { count: users } = await supabaseClient
    .from("users")
    .select("*", { count: "exact", head: true });

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

  if(error){
    list.innerHTML = `<div class="status-box error">โหลดข้อมูลไม่สำเร็จ: ${error.message}</div>`;
    return;
  }

  if(!data.length){
    list.innerHTML = `<div class="empty">ยังไม่มีรายการชำระเงิน</div>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <article class="request-card">
      <div>
        <h3>${item.customer_name || "-"}</h3>
        <p>LINE ID: <b>${item.line_id || "-"}</b></p>
        <p>ยอด: <b>${Number(item.amount || 0).toLocaleString("th-TH")} บาท</b></p>
        <p>สถานะ: <span class="pill ${item.status}">${item.status}</span></p>
        <p class="small">${item.created_at ? new Date(item.created_at).toLocaleString("th-TH") : ""}</p>
      </div>
      <div class="admin-actions">
        ${item.slip_url ? `<a class="secondary-btn" href="${item.slip_url}" target="_blank">ดูสลิป</a>` : ""}
        ${item.status === "pending" ? `
          <button class="primary-btn" onclick="approvePayment('${item.id}')">อนุมัติ</button>
          <button class="danger-btn" onclick="rejectPayment('${item.id}')">ไม่อนุมัติ</button>
        ` : ""}
      </div>
    </article>
  `).join("");
}

async function approvePayment(id){
  const { error } = await supabaseClient
    .from("payment_requests")
    .update({ status: "approved" })
    .eq("id", id);

  if(error){
    alert("อนุมัติไม่สำเร็จ: " + error.message);
    return;
  }

  await refreshAll();
}

async function rejectPayment(id){
  const { error } = await supabaseClient
    .from("payment_requests")
    .update({ status: "rejected" })
    .eq("id", id);

  if(error){
    alert("ไม่อนุมัติไม่สำเร็จ: " + error.message);
    return;
  }

  await refreshAll();
}

async function refreshAll(){
  await loadStats();
  await loadRequests();
}

document.getElementById("refreshBtn").addEventListener("click", refreshAll);
refreshAll();
