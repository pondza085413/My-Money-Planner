const loginForm = document.getElementById("loginForm");
const statusBox = document.getElementById("loginStatus");

function showStatus(message, type = "info"){
  statusBox.className = `status-box ${type}`;
  statusBox.innerHTML = message;
}

function getDeviceId(){
  let id = localStorage.getItem("mmp_device_id");
  if(!id){
    id = crypto.randomUUID();
    localStorage.setItem("mmp_device_id", id);
  }
  return id;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const deviceId = getDeviceId();

  const btn = loginForm.querySelector("button");
  btn.disabled = true;
  btn.textContent = "กำลังตรวจสอบ...";

  try{
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("password", password)
      .eq("is_active", true)
      .single();

    if(error || !data){
      showStatus("รหัสผ่านไม่ถูกต้อง หรือบัญชีถูกปิดใช้งาน", "error");
      btn.disabled = false;
      btn.textContent = "เข้าใช้งาน";
      return;
    }

    if(data.device_id && data.device_id !== deviceId){
      showStatus("รหัสผ่านนี้ถูกล็อกไว้กับอุปกรณ์อื่นแล้ว", "error");
      btn.disabled = false;
      btn.textContent = "เข้าใช้งาน";
      return;
    }

    if(!data.device_id){
      await supabaseClient
        .from("users")
        .update({ device_id: deviceId })
        .eq("id", data.id);
    }

    localStorage.setItem("mmp_user_id", data.id);
    localStorage.setItem("mmp_logged_in", "true");

    window.location.href = "index.html";
  }catch(error){
    console.error(error);
    showStatus("เกิดข้อผิดพลาดในการเข้าสู่ระบบ", "error");
    btn.disabled = false;
    btn.textContent = "เข้าใช้งาน";
  }
});
