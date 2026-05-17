const SUPABASE_URL = "https://vhsuviklxwnwykdvlxye.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_nXhFmA58ykc3U9kuwOqq4w_ruf99dAh";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
const state = {
  salary: 30000,
  fixed: 9000,
  other: 3500,
  dailyLife: 9000
};

const fields = [
  { key: "salary", label: "เงินเดือน", max: 200000 },
  { key: "fixed", label: "รายจ่ายประจำต่อเดือน เช่น ค่าห้อง/หนี้สิน", max: 100000 },
  { key: "other", label: "รายจ่ายอื่นๆ เช่น โทรศัพท์/เดินทาง", max: 50000 },
  { key: "dailyLife", label: "รายจ่ายชีวิตประจำวัน", max: 100000 }
];

const baht = n => new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0
}).format(Number.isFinite(n) ? n : 0);

const num = id => Number(document.getElementById(id)?.value || 0);
const daysInMonth = () => new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();

function saveState(){
  localStorage.setItem("moneyPlannerState", JSON.stringify(state));
}

function loadState(){
  const saved = localStorage.getItem("moneyPlannerState");
  if(saved) Object.assign(state, JSON.parse(saved));
}

function makeMonthlyInputs(){
  const wrap = document.getElementById("monthlyInputs");
  wrap.innerHTML = fields.map(f => `
    <div class="money-control">
      <div class="money-head">
        <label>${f.label}</label>
        <input type="number" id="${f.key}Input" value="${state[f.key]}" min="0">
      </div>
      <input type="range" id="${f.key}Range" value="${state[f.key]}" min="0" max="${f.max}" step="500">
    </div>
  `).join("");

  fields.forEach(f => {
    const input = document.getElementById(`${f.key}Input`);
    const range = document.getElementById(`${f.key}Range`);
    const update = value => {
      state[f.key] = Math.max(0, Number(value || 0));
      input.value = state[f.key];
      range.value = Math.min(state[f.key], f.max);
      saveState();
      calculateAll();
    };
    input.addEventListener("input", e => update(e.target.value));
    range.addEventListener("input", e => update(e.target.value));
  });
}

function baseCalc(){
  const totalExpense = state.fixed + state.other + state.dailyLife;
  const monthlyLeft = state.salary - totalExpense;
  const dailyQuota = monthlyLeft / daysInMonth();
  return { totalExpense, monthlyLeft, dailyQuota };
}

function updateTopSummary(){
  const { totalExpense, monthlyLeft, dailyQuota } = baseCalc();
  document.getElementById("netBalance").textContent = baht(monthlyLeft);
  document.getElementById("dailyQuotaTop").textContent = `โควต้าต่อวัน ${baht(dailyQuota)}`;
  document.getElementById("totalExpense").textContent = baht(totalExpense);
  document.getElementById("monthlyLeft").textContent = baht(monthlyLeft);
  document.getElementById("dailyQuota").textContent = baht(dailyQuota);
}

function calculateDebt(){
  const debt = num("debtTotal");
  const annualRate = num("debtRate") / 100;
  const monthlyRate = annualRate / 12;
  const pay = num("debtPay");
  const targetYears = num("debtTargetYears");
  const { monthlyLeft } = baseCalc();

  let months = 0, balance = debt;
  if(pay <= debt * monthlyRate && annualRate > 0){
    document.getElementById("debtResult").innerHTML = `
      <span class="bad">ยอดจ่ายต่อเดือนยังไม่พอปิดดอกเบี้ย</span><br>
      ควรจ่ายมากกว่า ${baht(debt * monthlyRate)} ต่อเดือน
    `;
    return;
  }

  while(balance > 0 && months < 1200){
    balance = balance * (1 + monthlyRate) - pay;
    months++;
  }

  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  const dailyForDebt = pay / daysInMonth();

  const targetMonths = Math.max(1, targetYears * 12);
  let requiredPay = debt / targetMonths;
  if(monthlyRate > 0){
    requiredPay = debt * monthlyRate / (1 - Math.pow(1 + monthlyRate, -targetMonths));
  }

  const status = monthlyLeft >= pay ? "good" : "bad";
  const gap = monthlyLeft - pay;

  document.getElementById("debtResult").innerHTML = `
    ถ้าจ่ายเดือนละ <b>${baht(pay)}</b> จะหมดหนี้ในประมาณ <b>${years} ปี ${remainMonths} เดือน</b><br>
    ต้องกันเงินไว้ใช้หนี้วันละ <b>${baht(dailyForDebt)}</b><br>
    ถ้าอยากจบภายใน <b>${targetYears} ปี</b> ควรจ่ายเดือนละประมาณ <b>${baht(requiredPay)}</b><br>
    หลังเทียบกับเงินเหลือจากข้อ 1: <span class="${status}">${gap >= 0 ? "ยังพอเหลือ " + baht(gap) : "ขาดอีก " + baht(Math.abs(gap))}</span>
  `;
}

function calculateSaving(){
  const monthly = num("saveMonthly");
  const yearly = num("saveYearly");
  const { monthlyLeft } = baseCalc();

  const monthlyStatus = monthlyLeft >= monthly ? "good" : "bad";
  const yearlyPerMonth = yearly / 12;
  const yearlyStatus = monthlyLeft >= yearlyPerMonth ? "good" : "bad";

  document.getElementById("savingResult").innerHTML = `
    เป้าเก็บเดือนละ <b>${baht(monthly)}</b>: 
    <span class="${monthlyStatus}">${monthlyLeft >= monthly ? "ทำได้" : "ยังขาด " + baht(monthly - monthlyLeft)}</span><br>
    เป้าเก็บปีละ <b>${baht(yearly)}</b> ต้องเก็บเดือนละ <b>${baht(yearlyPerMonth)}</b>: 
    <span class="${yearlyStatus}">${monthlyLeft >= yearlyPerMonth ? "ทำได้" : "ยังขาด " + baht(yearlyPerMonth - monthlyLeft)}</span>
  `;
}

function calculateSpending(){
  const spend = num("todaySpend");
  const { dailyQuota } = baseCalc();
  const diff = dailyQuota - spend;
  const nextQuota = dailyQuota + diff / Math.max(1, daysInMonth() - new Date().getDate());

  document.getElementById("spendingResult").innerHTML = `
    วันนี้ใช้ไป <b>${baht(spend)}</b> จากโควต้า <b>${baht(dailyQuota)}</b><br>
    ผลลัพธ์วันนี้: <span class="${diff >= 0 ? "good" : "bad"}">${diff >= 0 ? "+" : "-"}${baht(Math.abs(diff))}</span><br>
    โควต้าที่แนะนำสำหรับวันถัดไปประมาณ <b>${baht(Math.max(0, nextQuota))}</b>
  `;
}

function calculateSlip(){
  const spend = num("slipAmount");
  const { dailyQuota } = baseCalc();
  const diff = dailyQuota - spend;
  const daysLeft = Math.max(1, daysInMonth() - new Date().getDate());
  const adjusted = dailyQuota + diff / daysLeft;

  document.getElementById("slipResult").innerHTML = `
    ยอดใช้จ่ายจากสลิปวันนี้ <b>${baht(spend)}</b><br>
    โควต้าวันนี้คือ <b>${baht(dailyQuota)}</b><br>
    วันนี้ <span class="${diff >= 0 ? "good" : "bad"}">${diff >= 0 ? "เหลือ " + baht(diff) : "เกิน " + baht(Math.abs(diff))}</span><br>
    วันต่อไปควรใช้ไม่เกินประมาณ <b>${baht(Math.max(0, adjusted))}</b> เพื่อไม่กระทบเงินเก็บ/ใช้หนี้
  `;
}

function calculateSurvive(){
  const cash = num("cashNow");
  const months = Math.max(1, num("surviveMonths"));
  const spendToday = num("surviveSpendToday");
  const totalDays = months * 30;
  const daily = cash / totalDays;
  const diff = daily - spendToday;
  const tomorrow = (cash - spendToday) / Math.max(1, totalDays - 1);

  document.getElementById("surviveResult").innerHTML = `
    ถ้ามีเงิน <b>${baht(cash)}</b> และต้องการอยู่รอด <b>${months} เดือน</b><br>
    ควรใช้ได้วันละประมาณ <b>${baht(daily)}</b><br>
    วันนี้ใช้ไป <b>${baht(spendToday)}</b>: 
    <span class="${diff >= 0 ? "good" : "bad"}">${diff >= 0 ? "เหลือโควต้า " + baht(diff) : "เกินโควต้า " + baht(Math.abs(diff))}</span><br>
    ตั้งแต่พรุ่งนี้ควรใช้ไม่เกินวันละ <b>${baht(Math.max(0, tomorrow))}</b>
  `;
}

function updateAdvice(){
  const { monthlyLeft, dailyQuota } = baseCalc();
  const ratio = state.salary ? ((state.fixed + state.other + state.dailyLife) / state.salary) * 100 : 0;

  const items = [
    {
      title: monthlyLeft >= 0 ? "สถานะเงินสดดี" : "รายจ่ายเกินรายรับ",
      text: monthlyLeft >= 0 ? `ตอนนี้เหลือเงิน ${baht(monthlyLeft)} ต่อเดือน นำไปแบ่งเป็นเงินเก็บหรือใช้หนี้ได้` : `ตอนนี้ติดลบ ${baht(Math.abs(monthlyLeft))} ต่อเดือน ควรลดรายจ่ายก่อนตั้งเป้าหมาย`
    },
    {
      title: "โควต้ารายวัน",
      text: `ใช้ได้ประมาณ ${baht(dailyQuota)} ต่อวัน หลังหักรายจ่ายหลักทั้งหมด`
    },
    {
      title: ratio > 80 ? "ควรลดรายจ่าย" : "แผนยังยืดหยุ่น",
      text: `รายจ่ายคิดเป็นประมาณ ${ratio.toFixed(0)}% ของรายรับ`
    }
  ];

  document.getElementById("adviceList").innerHTML = items.map(i => `
    <div class="advice"><strong>${i.title}</strong><span>${i.text}</span></div>
  `).join("");
}

function calculateAll(){
  updateTopSummary();
  calculateDebt();
  calculateSaving();
  calculateSpending();
  calculateSlip();
  calculateSurvive();
  updateAdvice();
}

function setupTabs(){
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });
}

function setupLiveInputs(){
  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", calculateAll);
  });
}

function extractLikelyAmount(text){
  const cleaned = text.replace(/,/g, "");
  const numbers = cleaned.match(/\d+(\.\d{1,2})?/g)?.map(Number).filter(n => n > 0) || [];
  if(!numbers.length) return 0;
  return Math.max(...numbers.filter(n => n < 10000000));
}

function setupSlip(){
  const input = document.getElementById("slipInput");
  const preview = document.getElementById("slipPreview");

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if(!file) return;
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  });

  document.getElementById("scanSlipBtn").addEventListener("click", async () => {
    const file = input.files?.[0];
    if(!file){
      alert("กรุณาเลือกรูปสลิปก่อน");
      return;
    }

    const btn = document.getElementById("scanSlipBtn");
    btn.textContent = "กำลังอ่านสลิป...";
    btn.disabled = true;

    try{
      const result = await Tesseract.recognize(file, "tha+eng");
      const text = result.data.text || "";
      document.getElementById("ocrText").value = text;
      document.getElementById("slipAmount").value = extractLikelyAmount(text);
      calculateAll();
    }catch(err){
      alert("อ่านสลิปไม่สำเร็จ ลองพิมพ์ยอดเงินเองได้");
    }finally{
      btn.textContent = "อ่านสลิป";
      btn.disabled = false;
    }
  });

  document.getElementById("ocrText").addEventListener("input", e => {
    const amount = extractLikelyAmount(e.target.value);
    if(amount) document.getElementById("slipAmount").value = amount;
    calculateAll();
  });
}

document.getElementById("resetBtn").addEventListener("click", () => {
  localStorage.removeItem("moneyPlannerState");
  location.reload();
});

loadState();
makeMonthlyInputs();
setupTabs();
setupLiveInputs();
setupSlip();
calculateAll();
