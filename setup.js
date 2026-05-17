const setupForm = document.getElementById("setupForm");
const statusBox = document.getElementById("setupStatus");
const params = new URLSearchParams(window.location.search);
const requestId = params.get("request");
const token = params.get("token");

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

async function checkRequest(){
  if(!requestId){
    showStatus("ลิงก์ไม่ถูกต้อง กรุณากลับไปหน้าชำระเงิน", "error");
    setupForm.style.display = "none";
    return;
  }

  const { data, error } = await supabaseClient
    .from("payment_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if(error || !data){
    showStatus("ไม่พบรายการชำระเงินนี้", "error");
    setupForm.style.display = "none";
    return;
  }

  if(data.status !== "approved"){
    showStatus("รายการนี้ยังไม่ได้รับการอนุมัติ", "error");
    setupForm.style.display = "none";
    return;
  }

  if(data.user_id){
    showStatus("ลิงก์นี้ถูกใช้ตั้งรหัสผ่านแล้ว กรุณาไปหน้า Login", "error");
    setupForm.style.display = "none";
    return;
  }

  if(data.setup_token && token && data.setup_token !== token){
    showStatus("Token ไม่ถูกต้อง", "error");
    setupForm.style.display = "none";
  }
}

setupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;

  if(password !== confirm){
    showStatus("รหัสผ่านไม่ตรงกัน", "error");
    return;
  }

  const btn = setupForm.querySelector("button");
  btn.disabled = true;
  btn.textContent = "กำลังบันทึก...";

  try{
    const deviceId = getDeviceId();

    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .insert({
        password,
        device_id: deviceId,
        is_active: true
      })
      .select()
      .single();

    if(userError) throw userError;

    const { error: requestError } = await supabaseClient
      .from("payment_requests")
      .update({ user_id: user.id })
      .eq("id", requestId);

    if(requestError) throw requestError;

    localStorage.setItem("mmp_user_id", user.id);
    localStorage.setItem("mmp_logged_in", "true");

    showStatus("ตั้งรหัสผ่านสำเร็จ กำลังไปหน้า Login...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  }catch(error){
    console.error(error);
    showStatus("บันทึกรหัสผ่านไม่สำเร็จ: " + error.message, "error");
    btn.disabled = false;
    btn.textContent = "บันทึกรหัสผ่าน";
  }
});

checkRequest();
