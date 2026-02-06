const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNQbUeobwc1kRRhUko58xionMkyYelvjvQzlenrvqt7IjWh3GaEi9fa_bMbEQpQdiw-A/exec";

const form = document.getElementById("reserveringForm");
const melding = document.getElementById("melding");
const submitBtn = document.getElementById("submitBtn");
const BUILD_DATE = new Date().toLocaleString("nl-BE");

document.getElementById("buildInfo").textContent =
  `Build ${BUILD_DATE}`;

function setLoading(isLoading, text = "Verzenden...") {
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = text;
  } else {
    submitBtn.disabled = false;
    submitBtn.textContent =
      submitBtn.dataset.originalText || "Wij komen eraan!";
  }
}

async function loadTijdsloten() {
  const select = document.getElementById("tijdslot");
  select.innerHTML = `<option value="">Kies een tijd</option>`;

  try {
    const res = await fetch(SCRIPT_URL); // doGet
    const json = await res.json();

    for (const s of json.slots) {
      const opt = document.createElement("option");
      opt.value = s.tijdslot;

      if (s.beschikbaar <= 0) {
        opt.textContent = `${s.tijdslot} (vol)`;
        opt.disabled = true;
      } else {
        opt.textContent = `${s.tijdslot} (nog ${s.beschikbaar} vrij)`;
      }

      select.appendChild(opt);
    }
  } catch (err) {
    console.error("Tijdsloten laden faalde:", err);
    // fallback: laat de bestaande opties staan of toon melding
  }
}

document.addEventListener("DOMContentLoaded", loadTijdsloten);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  setLoading(true);
  
  melding.textContent = "";
  melding.className = "melding";

  const tijdslot = document.getElementById("tijdslot").value;
  const naam = document.getElementById("naam").value.trim();
  const email = document.getElementById("email").value.trim();
  const volwassenen = Number(document.getElementById("volwassenen").value);
  const kinderen = Number(document.getElementById("kinderen").value);

  const totaal = volwassenen + kinderen;

  if (!tijdslot || !naam || !email) {
  showError("Vul alle verplichte velden in.");
  setLoading(false);
  return;
}

if (totaal < 1) {
  showError("Minstens 1 persoon is verplicht.");
  setLoading(false);
  return;
}

if (totaal > 10) {
  showError("Maximaal 10 personen per reservering.");
  setLoading(false);
  return;
}

  const data = {
    //datum,
    tijdslot,
    naam,
    email,
    volwassenen,
    kinderen,
    totaal
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });
  
    if (!response.ok) {
      throw new Error("Netwerkfout");
    }
  
    const result = await response.json();
  
    if (result.status === "vol") {
      showError("❌ Dit tijdslot is al vol. Kies een ander moment.");
      return;
    }
  
    showSuccess("✅ Reservering succesvol opgeslagen!");
    form.reset();
  
  } catch (error) {
    console.error("Fetch error:", error);
    showError("❌ Er ging iets mis bij het verzenden. Probeer opnieuw.");
  
  } finally {
    setLoading(false);
  }
});

function showError(text) {
  melding.textContent = text;
  melding.classList.add("error");
}

function showSuccess(text) {
  melding.textContent = text;
  melding.classList.add("success");
  await loadTijdsloten();

}
