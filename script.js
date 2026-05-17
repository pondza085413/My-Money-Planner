const income = document.getElementById("income");
const need = document.getElementById("need");
const want = document.getElementById("want");
const goal = document.getElementById("goal");

const incomeText = document.getElementById("incomeText");
const needText = document.getElementById("needText");
const wantText = document.getElementById("wantText");
const goalText = document.getElementById("goalText");

const saveMonthEl = document.getElementById("saveMonth");
const saveYearEl = document.getElementById("saveYear");
const reachGoalEl = document.getElementById("reachGoal");

function calculate() {
  const inc = Number(income.value);
  const nd = Number(need.value);
  const wt = Number(want.value);
  const gl = Number(goal.value);

  incomeText.textContent = inc.toLocaleString();
  needText.textContent = nd.toLocaleString();
  wantText.textContent = wt.toLocaleString();
  goalText.textContent = gl.toLocaleString();

  const saveMonth = inc - (nd + wt);
  const saveYear = saveMonth * 12;

  saveMonthEl.textContent = saveMonth.toLocaleString();
  saveYearEl.textContent = saveYear.toLocaleString();

  const monthsNeeded = Math.ceil(gl / saveMonth);
  reachGoalEl.textContent = monthsNeeded;

  updateChart(saveMonth);
}

let chart;
function updateChart(saveMonth) {
  const data = Array.from({ length: 12 }, (_, i) => saveMonth * (i + 1));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
      datasets: [{
        label: "เงินสะสม",
        data: data,
        backgroundColor: "#4CAF50"
      }]
    }
  });
}

income.oninput = calculate;
need.oninput = calculate;
want.oninput = calculate;
goal.oninput = calculate;

calculate();
