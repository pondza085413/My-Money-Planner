// ใส่ค่าจาก Supabase ของคุณตรงนี้
// Project Settings → Data API → API URL
// Project Settings → API Keys → Publishable key

const SUPABASE_URL = "ใส่ API URL ของคุณ";
const SUPABASE_ANON_KEY = "ใส่ Publishable key ของคุณ";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const APP_PRICE = 99;
const APP_NAME = "My Money Planner";
