const CURRENT_USER_ID = localStorage.getItem("mmp_user_id");
const IS_LOGGED_IN = localStorage.getItem("mmp_logged_in") === "true";

async function checkUserStillActive(){
  if(!IS_LOGGED_IN || !CURRENT_USER_ID){
    window.location.href = "payment.html";
    return;
  }

  const { data, error } = await supabaseClient
    .from("users")
    .select("id,is_active")
    .eq("id", CURRENT_USER_ID)
    .eq("is_active", true)
    .maybeSingle();

  if(error || !data){
    localStorage.removeItem("mmp_logged_in");
    localStorage.removeItem("mmp_user_id");
    alert("บัญชีนี้ถูกปิดใช้งานหรือถูกลบแล้ว");
    window.location.href = "login.html";
  }
}

checkUserStillActive();

async function saveFinanceData(dataJson){
  if(!CURRENT_USER_ID) return;

  await supabaseClient
    .from("user_finance_data")
    .upsert({
      user_id: CURRENT_USER_ID,
      data_json: dataJson,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "user_id"
    });
}

async function loadFinanceData(){
  if(!CURRENT_USER_ID) return null;

  const { data, error } = await supabaseClient
    .from("user_finance_data")
    .select("*")
    .eq("user_id", CURRENT_USER_ID)
    .maybeSingle();

  if(error){
    console.warn("Load finance data error:", error.message);
    return null;
  }

  return data?.data_json || null;
}

function logout(){
  localStorage.removeItem("mmp_logged_in");
  localStorage.removeItem("mmp_user_id");
  window.location.href = "login.html";
}
