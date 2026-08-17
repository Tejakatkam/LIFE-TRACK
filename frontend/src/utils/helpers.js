export function calcBMR(w, h, age, gender) {
  const b = 10 * w + 6.25 * h - 5 * age;
  return gender === "male" ? b + 5 : b - 161;
}
export function calcTDEE(bmr) {
  return Math.round(bmr * 1.375);
}
export function calcBMI(w, h) {
  const hm = h / 100;
  return (w / (hm * hm)).toFixed(1);
}
export function bmiCat(b) {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Normal";
  if (b < 30) return "Overweight";
  return "Obese";
}
export function stepsBurned(s) {
  return Math.round(s * 0.04);
}
export function todayKey() {
  return new Date().toISOString().split("T")[0];
}
export function dateOffset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
export function fmtDate(k) {
  if (k === todayKey()) return "Today";
  if (k === dateOffset(-1)) return "Yesterday";
  const d = new Date(k + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function getWeekDates() {
  const t = new Date();
  const day = t.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(t);
  mon.setDate(t.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}
export function currentDayName() {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];
}
export function fmt12(t) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ap}`;
}
