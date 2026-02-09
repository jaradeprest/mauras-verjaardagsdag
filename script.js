const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxF9izNf-dwZIRybD2_6KFShmAbT_6niKwkvnQVtWPLVkkMq4yxcob2fjCQwy0bFEv0mQ/exec";

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
  const loader = document.getElementById("tijdslotLoader");

  if (!select) return;

  // Loader aan
  if (loader) loader.classList.add("loading");

  select.disabled = true;
  select.innerHTML = `
    <option value="">Tijdsloten aan het laden...</option>
  `;

  try {
    const res = await fetch(SCRIPT_URL);
    if (!res.ok) throw new Error("Kon tijdsloten niet laden");

    const json = await res.json();
    const slots = Array.isArray(json.slots) ? json.slots : [];

    // Reset dropdown
    select.innerHTML = `<option value="">Kies een tijd</option>`;

    for (const s of slots) {
      const tijdslot = String(s.tijdslot || "").trim();
      const beschikbaar = Number(s.beschikbaar);
      const eten = String(s.eten || "").trim();

      if (!tijdslot) continue;

      const opt = document.createElement("option");
      opt.value = tijdslot;

      const etenTekst = eten ? ` · ${eten}` : "";

      if (!Number.isFinite(beschikbaar) || beschikbaar <= 0) {
        opt.textContent = `${tijdslot}${etenTekst} (vol)`;
        opt.disabled = true;
      } else {
        opt.textContent = `${tijdslot}${etenTekst} (nog ${beschikbaar} vrij)`;
      }

      select.appendChild(opt);
    }

  } catch (err) {
    console.error("Tijdsloten laden faalde:", err);

    select.innerHTML = `
      <option value="">⚠️ Tijdsloten laden mislukt</option>
    `;
  } finally {
    // Loader uit
    if (loader) loader.classList.remove("loading");
    select.disabled = false;
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
      body: JSON.stringify(data)
    });
  
    const result = await response.json();
  
    if (result.status === "vol") {
      showError("❌ Dit tijdslot is al vol. Kies een ander moment.");
      await loadTijdsloten();
      return;
    }
  
    if (result.status !== "ok") {
      showError("❌ Er ging iets mis. Probeer opnieuw.");
      return;
    }
  
    showSuccess("✅ Reservering succesvol opgeslagen!");
    form.reset();
    await loadTijdsloten();
  
  } catch (error) {
    console.error("Fetch error:", error);
    showError("❌ Er ging iets mis bij het verzenden. Probeer opnieuw.");
  } finally {
    setLoading(false);
  }
});
