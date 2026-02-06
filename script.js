const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfOezinrRwPkS4pRk31IV6xdnGH3w_P_ggDR1ZTNaR-gtSk6M9oaMxxqPavK3JigpGsA/exec"; 

const form = document.getElementById("reserveringForm");
const melding = document.getElementById("melding");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  melding.textContent = "";
  melding.className = "melding";

  const datum = document.getElementById("datum").value;
  const tijdslot = document.getElementById("tijdslot").value;
  const naam = document.getElementById("naam").value.trim();
  const email = document.getElementById("email").value.trim();
  const volwassenen = Number(document.getElementById("volwassenen").value);
  const kinderen = Number(document.getElementById("kinderen").value);

  const totaal = volwassenen + kinderen;

  // Validatie
  if (!datum || !tijdslot || !naam || !email) {
    showError("Vul alle verplichte velden in.");
    return;
  }

  if (totaal < 1) {
    showError("Minstens 1 persoon is verplicht.");
    return;
  }

  if (totaal > 10) {
    showError("Maximaal 10 personen per reservering.");
    return;
  }

  // ✅ DATA HIER AANMAKEN (niet erboven!)
  const data = {
    datum,
    tijdslot,
    naam,
    email,
    volwassenen,
    kinderen,
    totaal
  };

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // nodig voor GitHub Pages + Apps Script
      body: JSON.stringify(data)
    });

    showSuccess("✅ Reservering succesvol opgeslagen!");
    form.reset();

  } catch (error) {
    console.error(error);
    showError("❌ Er ging iets mis. Probeer het later opnieuw.");
  }
});

function showError(text) {
  melding.textContent = text;
  melding.classList.add("error");
}

function showSuccess(text) {
  melding.textContent = text;
  melding.classList.add("success");
}
