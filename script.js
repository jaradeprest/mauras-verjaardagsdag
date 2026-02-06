const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzNQbUeobwc1kRRhUko58xionMkyYelvjvQzlenrvqt7IjWh3GaEi9fa_bMbEQpQdiw-A/exec";

const form = document.getElementById("reserveringForm");
const melding = document.getElementById("melding");
const submitBtn = document.getElementById("submitBtn");

// Build info (veilig als element ontbreekt)
const BUILD_DATE = new Date().toLocaleString("nl-BE");
const buildEl = document.getElementById("buildInfo");
if (buildEl) buildEl.textContent = `Build ${BUILD_DATE}`;

// Loading state knop
function setLoading(isLoading, text = "Verzenden...") {
  if (!submitBtn) return;

  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = text;
  } else {
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.dataset.originalText || "Wij komen eraan!";
  }
}

// Meldingen
function showError(text) {
  melding.textContent = text;
  melding.className = "melding error";
}

function showSuccess(text) {
  melding.textContent = text;
  melding.className = "melding success";
}

// Tijdsloten + beschikbaarheid ophalen en dropdown vullen
async function loadTijdsloten() {
  const select = document.getElementById("tijdslot");
  const select = document.getElementById("eten");

  if (!select) return;

  select.innerHTML = `<option value="">Kies een tijd</option>`;

  try {
    const res = await fetch(SCRIPT_URL); // doGet
    if (!res.ok) throw new Error("Kon tijdsloten niet laden");

    const json = await res.json();
    const slots = Array.isArray(json.slots) ? json.slots : [];

    for (const s of slots) {
      const tijdslot = String(s.tijdslot || "").trim();
      const beschikbaar = Number(s.beschikbaar);

      if (!tijdslot) continue;

      const opt = document.createElement("option");
      opt.value = tijdslot;

      if (!Number.isFinite(beschikbaar) || beschikbaar <= 0) {
        opt.textContent = `${tijdslot} (vol)`;
        opt.disabled = true;
      } else {
        opt.textContent = `${tijdslot} = ${eten} (nog ${beschikbaar} vrij)`;
      }

      select.appendChild(opt);
    }
  } catch (err) {
    console.error("Tijdsloten laden faalde:", err);
    // fallback: laat enkel "Kies een tijd"
  }
}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadTijdsloten();
});

// Submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Reset melding
  melding.textContent = "";
  melding.className = "melding";

  setLoading(true);

  // Waarden ophalen
  const tijdslot = document.getElementById("tijdslot").value;
  const naam = document.getElementById("naam").value.trim();
  const email = document.getElementById("email").value.trim();
  const volwassenen = Number(document.getElementById("volwassenen").value);
  const kinderen = Number(document.getElementById("kinderen").value);
  const totaal = volwassenen + kinderen;

  // Validatie
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Netwerkfout: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === "vol") {
      showError("❌ Dit tijdslot is al vol. Kies een ander moment.");
      await loadTijdsloten(); // refresh dropdown
      return;
    }

    if (result.status !== "ok") {
      showError("❌ Er ging iets mis. Probeer opnieuw.");
      return;
    }

    showSuccess("✅ Reservering succesvol opgeslagen!");
    form.reset();
    await loadTijdsloten(); // refresh dropdown na succes

  } catch (error) {
    console.error("Fetch error:", error);
    showError("❌ Er ging iets mis bij het verzenden. Probeer opnieuw.");
  } finally {
    setLoading(false);
  }
});
