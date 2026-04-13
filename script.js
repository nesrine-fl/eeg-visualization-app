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
function loadEEGData() {
    const data = {
      channels: ["Fp1", "F3", "C3"],
      duration: 120,
      events: [
        { type: "spike", channel: "F3", time: 14.2 }
      ]
    };
  
    document.getElementById("result").innerText =
      "EEG DATA LOADED:\n" + JSON.stringify(data, null, 2);
  
    console.log(data);
  }
  function uploadFile() {
    const file = document.getElementById("fileInput").files[0];
  
    if (!file) {
      alert("Choisis un fichier !");
      return;
    }
  
    console.log("File selected:", file.name);
  
    document.getElementById("result").innerText =
      "Fichier sélectionné : " + file.name;
  }
  function drawChart() {
    const ctx = document.getElementById("eegChart").getContext("2d");
  
    const labels = Array.from({ length: 50 }, (_, i) => i);
  
    const dataValues = labels.map(i => {
      return Math.sin(i / 5) * 50 + 50;
    });
  
    const spikes = [10, 25, 40];
  
    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "EEG Signal",
          data: dataValues,
          borderWidth: 2,
          borderColor: "blue",
          pointBackgroundColor: labels.map(i =>
            spikes.includes(i) ? "red" : "blue"
          ),
          pointRadius: labels.map(i =>
            spikes.includes(i) ? 6 : 2
          ),
          fill: false
        }]
      }
    });
    if (spikes.length > 0) {
      document.getElementById("result").innerText =
        "⚠ Possible abnormal activity detected (spikes found)";
    }
    console.log("Spikes at:", spikes);
  }
  function setMode(mode) {
    console.log("Mode selected:", mode);
  
    const result = document.getElementById("result");
  
    result.innerText = "Current mode: " + mode;
  
    const chart = document.getElementById("eegChart");
    const upload = document.getElementById("fileInput");
  
    // Patient = simple view
    if (mode === "patient") {
      chart.style.display = "none";
      upload.style.display = "block";
    }
  
    // Student = normal view
    if (mode === "student") {
      chart.style.display = "block";
      upload.style.display = "block";
    }
  
    // Doctor = full view
    if (mode === "doctor") {
      chart.style.display = "block";
      upload.style.display = "block";
    }
  }