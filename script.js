let mode = "patient";

// CHANGER DE MODE
function setMode(selectedMode) {
  mode = selectedMode;
  alert("Mode sélectionné : " + mode);
}

// ANALYSE
function analyze() {

  let age = document.getElementById("age").value;

  let result = "";
  let brain = "";

  // validation âge
  if (age < 1 || age > 100) {
    result = "❌ Âge invalide";
  }

  else {
    
    // logique simple symptômes fake
    let diabete = document.getElementById("diabete").checked;
    let hypertension = document.getElementById("hypertension").checked;
    let cancer = document.getElementById("cancer").checked;

    if (mode === "patient") {
      result = "⚠ Analyse terminée (Patient)";
    }

    else if (mode === "student") {
      result = "📚 Analyse pédagogique terminée";
    }

    else if (mode === "doctor") {
      result = "🧠 Analyse complète avec données médicales";
    }

    // simulation cerveau
    if (diabete || hypertension) {
      brain = "🧠 Zone: système général affecté";
    }

    if (cancer) {
      brain = "🧠 Zone critique détectée";
    }
  }

  document.getElementById("result").innerText = result + "\n" + brain;
}