const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwaf9cNDEbXhnI9J1tn6hNqGf8kZs2XjFMfU9sSwlpWM7u3S7MwvDmyZ5RwtsJi6BSCyA/exec";

const form = document.getElementById("reserveringForm");
const melding = document.getElementById("melding");
const response = await fetch(SCRIPT_URL, {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify(data)
});


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
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error("Request mislukt");

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
