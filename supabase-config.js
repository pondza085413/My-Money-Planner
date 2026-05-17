// ใส่ค่าจาก Supabase ของคุณตรงนี้
// Project Settings → Data API → API URL
// Project Settings → API Keys → Publishable key

const SUPABASE_URL = "https://vhsuviklxwnwykdvlxye.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nXhFmA58ykc3U9kuwOqq4w_ruf99dAh";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const APP_PRICE = 99;
const APP_NAME = "My Money Planner";
