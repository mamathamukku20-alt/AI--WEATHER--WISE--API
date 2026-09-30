const codes = {
  0:["Clear sky","☀️"],1:["Mostly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Cloudy","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],
  51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],
  61:["Light rain","🌧️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
  71:["Light snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],
  80:["Rain showers","🌦️"],81:["Moderate showers","🌧️"],82:["Violent showers","⛈️"],
  95:["Thunderstorm","⛈️"],96:["Thunderstorm with hail","⛈️"],99:["Severe thunderstorm with hail","⛈️"]
};
const info = c => codes[c] || ["Unknown", "🌡️"];
const $ = id => document.getElementById(id);

$("btn").addEventListener("click", search);
$("city").addEventListener("keydown", e => { if (e.key === "Enter") search(); });

async function search() {
  const name = $("city").value.trim();
  if (!name) { $("msg").textContent = "Please enter a city name"; return; }
  $("msg").textContent = "⏳ Loading...";
  $("result").classList.add("hidden");
  try {
    const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en`).then(r => r.json());
    if (!g.results) { $("msg").textContent = "❌ City not found. Try again."; return; }
    const { latitude, longitude, name: cn, country } = g.results[0];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`
      + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const w = await fetch(url).then(r => r.json());
    show(cn, country, w);
    $("msg").textContent = "";
  } catch (e) {
    $("msg").textContent = "❌ Something went wrong. Check your internet.";
  }
}

function show(city, country, w) {
  const c = w.current, [d, ic] = info(c.weather_code);
  $("place").textContent = `📍 ${city}, ${country}`;
  $("icon").textContent = ic;
  $("temp").textContent = Math.round(c.temperature_2m) + "°C";
  $("desc").textContent = d;
  $("hum").textContent = c.relative_humidity_2m + "%";
  $("wind").textContent = c.wind_speed_10m + " km/h";
  $("feel").textContent = Math.round(c.apparent_temperature) + "°C";
  $("time").textContent = c.time.split("T")[1];
  $("advice").textContent = advice(c);

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  $("forecast").innerHTML = w.daily.time.map((t, i) => {
    const dn = days[new Date(t).getDay()];
    return `<div class="day"><span>${dn} (${t.slice(5)})</span><span>${info(w.daily.weather_code[i])[1]}</span>`
      + `<span>${Math.round(w.daily.temperature_2m_max[i])}° / ${Math.round(w.daily.temperature_2m_min[i])}°</span></div>`;
  }).join("");
  $("result").classList.remove("hidden");
}

function advice(c) {
  const t = c.temperature_2m, code = c.weather_code, tips = [];
  if ([51,53,55,61,63,65,80,81,82].includes(code)) tips.push("Carry an umbrella or raincoat ☔");
  if ([95,96,99].includes(code)) tips.push("Thunderstorm alert, stay safe indoors ⚡");
  if (t >= 38) tips.push("Very hot. Drink plenty of water 🥵");
  else if (t >= 32) tips.push("Hot weather. Wear light cotton clothes 👕");
  else if (t <= 15) tips.push("Cold weather. Wear a sweater 🧥");
  else tips.push("Weather is comfortable 😊");
  if (c.wind_speed_10m > 30) tips.push("Strong winds 🌬️");
  if (c.relative_humidity_2m > 80) tips.push("High humidity, may feel muggy 💧");
  return tips.join(" • ");
}