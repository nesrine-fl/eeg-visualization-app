const MAX_POINTS = 80;
const SAMPLE_INTERVAL = 50;
const SESSION_INTERVAL = 60000;
const SIGNAL_RANGE = 120;
const MODE_LABELS = {
    patient: 'Patient',
    etudiant: 'Étudiant',
    docteur: 'Docteur'
};

const state = {
    currentMode: 'patient',
    tick: 0,
    sessionStart: null,
    sessionIntervalId: null,
    chartIntervalId: null,
    ctx: null,
    alphaData: Array(MAX_POINTS).fill(0),
    betaData: Array(MAX_POINTS).fill(0),
    gammaData: Array(MAX_POINTS).fill(0)
};

const dom = {};

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    cacheElements();
    initCanvas();
    updateMetrics();
    startChartLoop();
    applyMode('patient');
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
    return amp * Math.sin((2 * Math.PI * freq * t) / 1000) + (Math.random() - 0.5) * amp * 0.4;
}

function updateChart() {
    var t = state.tick * SAMPLE_INTERVAL;

    state.alphaData.push(wave(10, 50, t));
    state.betaData.push(wave(20, 35, t));
    state.gammaData.push(wave(40, 20, t));

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
    if (state.currentMode === 'etudiant') return ['alpha', 'beta'];
    if (state.currentMode === 'docteur') return ['alpha', 'beta', 'gamma'];
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

    document.getElementById('bpAlpha').textContent = 35 + Math.floor(Math.random() * 20) + '%';
    document.getElementById('bpBeta').textContent = 20 + Math.floor(Math.random() * 20) + '%';
    document.getElementById('bpGamma').textContent = 15 + Math.floor(Math.random() * 20) + '%';
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

    document.querySelectorAll('.mode-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (dom.channelList) {
        dom.channelList.style.display = mode === 'patient' ? 'none' : 'flex';
    }

    if (dom.bandPower) {
        dom.bandPower.style.display = mode === 'docteur' ? 'block' : 'none';
    }

    if (dom.eventsPanel) {
        dom.eventsPanel.style.display = mode === 'patient' ? 'none' : 'block';
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

window.submitProfile = submitProfile;
window.editProfile = editProfile;
window.applyMode = applyMode;
window.handleUpload = handleUpload;