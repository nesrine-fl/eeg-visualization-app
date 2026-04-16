var MAX_POINTS = 80;
var SAMPLE_INTERVAL = 50;
var SESSION_INTERVAL = 60000;
var SIGNAL_RANGE = 120;
var MODE_LABELS = {
    simple: 'Simple',
    moyen: 'Moyen',
    'compliqué': 'Compliqué'
};

var lastExplanation = "";

var state = {
    currentMode: 'simple',
    tick: 0,
    sessionStart: null,
    sessionIntervalId: null,
    chartIntervalId: null,
    ctx: null,
    alphaData: Array(MAX_POINTS).fill(0),
    betaData: Array(MAX_POINTS).fill(0),
    gammaData: Array(MAX_POINTS).fill(0)
};

var dom = {};

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    cacheElements();
    initCanvas();
    updateMetrics();
    startChartLoop();
    applyMode('simple');

    setTimeout(function () {
        var loader = document.getElementById('loadingScreen');
        if (loader) loader.style.display = 'none';
    }, 1200);
}

function cacheElements() {
    dom.canvas = document.getElementById('eegChart');
    dom.profileForm = document.getElementById('profileForm');
    dom.profileInfo = document.getElementById('profileInfo');
    dom.channelList = document.getElementById('channelList');
    dom.bandPower = document.getElementById('bandPowerPanel');
    dom.eventsPanel = document.querySelector('.events-panel');
    dom.eventLog = document.getElementById('eventLog');
    dom.sessionTime = document.getElementById('sessionTime');
    dom.neuralMap = document.getElementById('neuralMap');
}

function initCanvas() {
    if (!dom.canvas) return;
    state.ctx = dom.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (!dom.canvas || !state.ctx) return;

    var rect = dom.canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var width = Math.max(320, Math.floor(rect.width || 320));
    var height = Math.max(260, Math.floor(rect.height || 260));

    dom.canvas.width = width * dpr;
    dom.canvas.height = height * dpr;
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawEEG();
}

function startChartLoop() {
    if (state.chartIntervalId) clearInterval(state.chartIntervalId);
    state.chartIntervalId = setInterval(updateChart, SAMPLE_INTERVAL);
}

function wave(freq, amp, t) {
    return amp * Math.sin((2 * Math.PI * freq * t) / 1000) + (Math.random() - 0.5) * amp * 0.2;
}

function updateChart() {
    var t = state.tick * SAMPLE_INTERVAL;

    var a = wave(10, 50, t);
    var b = wave(20, 35, t);
    var g = wave(40, 20, t);

    state.alphaData.push(a);
    state.betaData.push(b);
    state.gammaData.push(g);

    detectSpike(a, "Alpha");
    detectSpike(b, "Beta");
    detectSpike(g, "Gamma");

    if (state.tick % 12 === 0) {
        updateExplanation(a, b, g);
    }

    state.alphaData.shift();
    state.betaData.shift();
    state.gammaData.shift();

    state.tick += 1;

    if (state.tick % 10 === 0) updateMetrics();
    drawEEG();
}

function drawEEG() {
    if (!state.ctx || !dom.canvas) return;

    var width = dom.canvas.clientWidth || 320;
    var height = dom.canvas.clientHeight || 260;

    state.ctx.clearRect(0, 0, width, height);
    drawGrid(width, height);

    var visibleBands = getVisibleBands();

    if (visibleBands.indexOf('alpha') !== -1) drawSignal(state.alphaData, '#00e5ff', width, height, 2);
    if (visibleBands.indexOf('beta') !== -1) drawSignal(state.betaData, '#ff1744', width, height, 2);
    if (visibleBands.indexOf('gamma') !== -1) drawSignal(state.gammaData, '#ffc400', width, height, 2);
}

function drawGrid(width, height) {
    var ctx = state.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;

    var i;
    for (i = 0; i <= 4; i++) {
        var y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    for (i = 0; i <= 6; i++) {
        var x = (width / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
 ctx.fillStyle = '#607d8b';
    ctx.font = '10px Segoe UI';
    ctx.textBaseline = 'middle';

    var vals = [120, 60, 0, -60, -120];
    for (i = 0; i < vals.length; i++) {
        ctx.fillText(String(vals[i]), 8, valueToY(vals[i], height));
    }

    ctx.restore();
}

function drawSignal(data, color, width, height, lineWidth) {
    var ctx = state.ctx;
    var stepX = width / (MAX_POINTS - 1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();

    for (var i = 0; i < data.length; i++) {
        var x = i * stepX;
        var y = valueToY(data[i], height);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.stroke();
    ctx.restore();
}

function valueToY(value, height) {
    return ((SIGNAL_RANGE - value) / (SIGNAL_RANGE * 2)) * height;
}

function getVisibleBands() {
    if (state.currentMode === 'simple') return ['alpha'];
    if (state.currentMode === 'moyen') return ['alpha', 'beta'];
    if (state.currentMode === 'compliqué') return ['alpha', 'beta', 'gamma'];
    return ['alpha'];
}

function updateMetrics() {
    var stress = 50 + Math.floor(Math.random() * 40);
    var cog = 30 + Math.floor(Math.random() * 40);
    var fat = 10 + Math.floor(Math.random() * 30);

    document.getElementById('stressVal').innerHTML = stress + '<span class="unit">%</span>';
    document.getElementById('stressBar').style.width = stress + '%';
    document.getElementById('cogVal').innerHTML = cog + '<span class="unit">%</span>';
    document.getElementById('cogBar').style.width = cog + '%';
    document.getElementById('fatVal').innerHTML = fat + '<span class="unit">%</span>';
    document.getElementById('fatBar').style.width = fat + '%';

    var bpA = document.getElementById('bpAlpha');
    var bpB = document.getElementById('bpBeta');
    var bpG = document.getElementById('bpGamma');
    if (bpA) bpA.textContent = (35 + Math.floor(Math.random() * 20)) + '%';
    if (bpB) bpB.textContent = (20 + Math.floor(Math.random() * 20)) + '%';
    if (bpG) bpG.textContent = (15 + Math.floor(Math.random() * 20)) + '%';
}

function submitProfile() {
    var nom = document.getElementById('inputNom').value.trim();
    var prenom = document.getElementById('inputPrenom').value.trim();
    var age = document.getElementById('inputAge').value.trim();
    var sexe = document.getElementById('inputSexe').value;

    if (!nom || !prenom || !age || !sexe) {
        alert('Veuillez remplir tous les champs !');
        return;
    }

    var id = 'NV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0');

    document.getElementById('displayName').textContent = prenom + ' ' + nom;
    document.getElementById('displayId').textContent = 'ID: ' + id;
    document.getElementById('displayAge').textContent = age + ' ans';
    document.getElementById('displaySexe').textContent = sexe;

    if (dom.profileForm) dom.profileForm.style.display = 'none';
    if (dom.profileInfo) dom.profileInfo.style.display = 'block';

    state.sessionStart = Date.now();
    if (state.sessionIntervalId) clearInterval(state.sessionIntervalId);
    updateSession();
    state.sessionIntervalId = setInterval(updateSession, SESSION_INTERVAL);

    addEvent('Profil enregistré — ' + prenom + ' ' + nom);
}

function editProfile() {
    if (dom.profileForm) dom.profileForm.style.display = 'block';
    if (dom.profileInfo) dom.profileInfo.style.display = 'none';
}

function updateSession() {
    if (!state.sessionStart) return;

    var mins = Math.floor((Date.now() - state.sessionStart) / 60000);
    var h = Math.floor(mins / 60);
    var m = mins % 60;

    if (dom.sessionTime) {
        dom.sessionTime.textContent = 'Active — ' + (h > 0 ? h + 'h ' : '') + m + 'm';
    }

    if (dom.neuralMap) {
        var map = Math.min(99.9, (mins / 120) * 97.3).toFixed(1);
        dom.neuralMap.textContent = map + '% Complete';
    }
}
function applyMode(mode) {
    state.currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (dom.channelList) {
        dom.channelList.style.display = mode === 'simple' ? 'none' : 'flex';
    }

    if (dom.bandPower) {
        dom.bandPower.style.display = mode === 'compliqué' ? 'block' : 'none';
    }

    if (dom.eventsPanel) {
        dom.eventsPanel.style.display = mode === 'simple' ? 'none' : 'block';
    }

    drawEEG();
    addEvent('Mode changé → ' + MODE_LABELS[mode]);
}

function addEvent(text) {
    if (!dom.eventLog) return;

    var now = new Date();
    var time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    var div = document.createElement('div');

    div.className = 'event';
    div.innerHTML = '<span class="event-time">' + time + '</span> ' + text;
    dom.eventLog.prepend(div);
}

function handleUpload(event) {
    var file = event.target.files[0];
    if (!file) return;

    addEvent('Fichier chargé: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)');
    alert('Fichier "' + file.name + '" chargé avec succès !\n(Simulation — traitement EDF non implémenté)');
}

function updateExplanation(a, b, g) {
    var text = "";

    if (a > b && a > g) {
        text = "🧘 Alpha dominant → État de relaxation";
    } else if (b > a && b > g) {
        text = "🧠 Beta dominant → Concentration et focus";
    } else {
        text = "⚡ Gamma dominant → Traitement cognitif élevé";
    }

    if (text !== lastExplanation) {
        var el = document.getElementById('eegExplanation');
        if (el) el.textContent = text;
        lastExplanation = text;
    }
}

function detectSpike(value, type) {
    if (value > 100) {
        triggerAlert(type + " spike detected!");
    }
}

function triggerAlert(message) {
    addEvent("⚠️ ALERT: " + message);

    var box = document.getElementById('alertBox');
    if (!box) return;
    box.textContent = "⚠️ " + message;
    box.classList.remove('hidden');

    setTimeout(function () {
        box.classList.add('hidden');
    }, 2000);
}

/* ==========================================
AI EEG ASSISTANT
   ========================================== */

function askAI(type) {
    var text = "";
    var videos = [];
    var mode = state.currentMode;

    if (type === 'alpha') {
        text = "🧘 ONDES ALPHA (8-13 Hz)\n\n";
        if (mode === 'simple') {
            text += "Les ondes Alpha apparaissent quand tu es calme et détendu.\n";
            text += "C'est comme quand tu fermes les yeux et tu respires profondément.\n";
            text += "Elles aident ton cerveau à se reposer.";
            videos = [
                "https://www.youtube.com/embed/5qap5aO4i9A",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/WPni755-Krg"
            ];
        } else if (mode === 'moyen') {
            text += "Les ondes Alpha (8-13 Hz) sont produites dans le cortex occipital.\n";
            text += "Elles indiquent un état de repos éveillé et de relaxation.\n";
            text += "Elles diminuent lors de l'ouverture des yeux ou de la concentration.";
            videos = [
                "https://www.youtube.com/embed/5qap5aO4i9A",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/1ZYbU82GVz4"
            ];
        } else {
            text += "Les ondes Alpha (8-13 Hz) sont générées par le thalamus et le cortex occipital.\n";
            text += "Amplitude typique : 20-60 µV. Bloquées par l'ouverture des yeux (réaction de Berger).\n";
            text += "Leur asymétrie peut indiquer une pathologie corticale focale.\n";
text += "Utilisées en neurofeedback pour traiter l'anxiété et améliorer la méditation.";
            videos = [
                "https://www.youtube.com/embed/5qap5aO4i9A",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/1ZYbU82GVz4"
            ];
        }
    }

    else if (type === 'beta') {
        text = "🧠 ONDES BETA (13-30 Hz)\n\n";
        if (mode === 'simple') {
            text += "Les ondes Beta apparaissent quand tu réfléchis ou tu te concentres.\n";
            text += "C'est comme quand tu résous un problème de maths.\n";
            text += "Trop de Beta = stress !";
            videos = [
                "https://www.youtube.com/embed/2OEL4P1Rz04",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/M0U9FAJs1bk"
            ];
        } else if (mode === 'moyen') {
            text += "Les ondes Beta (13-30 Hz) sont associées à l'activité mentale active.\n";
            text += "On distingue Low Beta (13-15 Hz, pensée calme) et High Beta (18-30 Hz, anxiété).\n";
            text += "Elles sont dominantes dans le cortex frontal et pariétal.";
            videos = [
                "https://www.youtube.com/embed/2OEL4P1Rz04",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/M0U9FAJs1bk"
            ];
        } else {
            text += "Les ondes Beta (13-30 Hz) se divisent en β1 (12-15 Hz), β2 (15-22 Hz), β3 (22-30 Hz).\n";
            text += "Amplitude : 5-30 µV. Sources principales : cortex frontal, moteur et pariétal.\n";
            text += "L'excès de High Beta est corrélé au trouble anxieux généralisé (TAG).\n";
            text += "Les médicaments GABAergiques (benzodiazépines) augmentent l'activité Beta.";
            videos = [
                "https://www.youtube.com/embed/2OEL4P1Rz04",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/M0U9FAJs1bk"
            ];
        }
    }

    else if (type === 'gamma') {
        text = "⚡ ONDES GAMMA (30+ Hz)\n\n";
        if (mode === 'simple') {
            text += "Les ondes Gamma sont les plus rapides du cerveau.\n";
            text += "Elles apparaissent quand tu es très concentré ou que tu apprends quelque chose de nouveau.\n";
            text += "C'est le mode \"super cerveau\" !";
            videos = [
                "https://www.youtube.com/embed/5qap5aO4i9A",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/WPni755-Krg"
            ];
        } else if (mode === 'moyen') {
            text += "Les ondes Gamma (30-100 Hz) sont liées au traitement cognitif de haut niveau.\n";
            text += "Elles jouent un rôle dans la mémoire de travail, l'attention et la perception.\n";
            text += "Les moines bouddhistes en méditation montrent des niveaux Gamma élevés.";
            videos = [
                "https://www.youtube.com/embed/5qap5aO4i9A",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/1ZYbU82GVz4"
            ];
        } else {
            text += "Les ondes Gamma (30-100+ Hz) impliquent la liaison corticale (binding problem).\n";
            text += "Amplitude : 2-10 µV. Générées par les interneurones inhibiteurs à parvalbumine.\n";
            text += "La réduction des Gamma est observée dans la schizophrénie et Alzheimer.\n";
            text += "La stimulation tACS à 40 Hz montre des résultats prometteurs en recherche clinique.";
            videos = [
                "https://www.youtube.com/embed/5qap5aO4i9A",
                "https://www.youtube.com/embed/lTRiuFIWV54",
                "https://www.youtube.com/embed/1ZYbU82GVz4"
            ];
        }
    }

    // Display text
    var aiTextEl = document.getElementById('ai-text');
    if (aiTextEl) aiTextEl.textContent = text;
 // Display videos
    var videosEl = document.getElementById('videos');
    if (videosEl) {
        var html = '';
        for (var i = 0; i < videos.length; i++) {
            html += '<iframe src="' + videos[i] + '" frameborder="0" allowfullscreen></iframe>';
        }
        videosEl.innerHTML = html;
    }

    addEvent('AI Assistant → Explication ' + type.toUpperCase() + ' (' + MODE_LABELS[mode] + ')');
}

// Expose functions to HTML onclick
window.submitProfile = submitProfile;
window.editProfile = editProfile;
window.applyMode = applyMode;
window.handleUpload = handleUpload;
window.askAI = askAI;