// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-dOcgvW58ydm0yu33bdBmkGLx1rZG_gI",
  authDomain: "personal-all-tool-s.firebaseapp.com",
  projectId: "personal-all-tool-s",
  storageBucket: "personal-all-tool-s.firebasestorage.app",
  messagingSenderId: "649061375402",
  appId: "1:649061375402:web:00d15d42f68ea5d98bdfd3",
  measurementId: "G-LGM1M06FD8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
auth.onAuthStateChanged(user => {
    if (user) { document.querySelector('.main-content').classList.remove('hidden'); } 
    else { window.location.href = 'login.html'; }
});

const API_KEY = "AIzaSyAVPL6usy4q-MSGyV8ezyITdxJ9o9wAfz8";

const themeToggle = document.getElementById("themeToggle");
const sunIcon = document.getElementById("sunIcon");
const moonIcon = document.getElementById("moonIcon");
const logoutBtn = document.getElementById('logoutBtn');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
  localStorage.setItem('theme', theme);
}
themeToggle.addEventListener('click', () => {
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
});
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
logoutBtn.addEventListener('click', () => { auth.signOut().then(() => { window.location.href = 'login.html'; }); });

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const statusEl = document.getElementById("status");
const placeholder = document.getElementById("placeholder");
const previewImg = document.getElementById("previewImg");
const rawOutput = document.getElementById("rawOutput");
const generateQrBtn = document.getElementById("generateQrBtn");
const fields = {
  aqama: document.getElementById("aqama"),
  fullname: document.getElementById("fullname"),
  fullname_ar: document.getElementById("fullname_ar"),
  dob_en: document.getElementById("dob_en"),
  dob_hijri: document.getElementById("dob_hijri"),
  nationality_ar: document.getElementById("nationality_ar"),
  qrdata: document.getElementById("qrdata"),
  qrDownload: document.getElementById("qrDownload"),
  qrPlaceholder: document.getElementById("qrPlaceholder")
};

document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const t = btn.getAttribute("data-target");
    copyText((fields[t] && fields[t].value) || "");
  });
});

document.getElementById("copyAll").addEventListener("click", () => {
  const combined = `
Aqama: ${fields.aqama.value}
Name: ${fields.fullname.value}
Name (Arabic): ${fields.fullname_ar.value}
DOB (Gregorian): ${fields.dob_en.value}
DOB (Hijri): ${fields.dob_hijri.value}
Nationality (Arabic): ${fields.nationality_ar.value}
QR: ${fields.qrdata.value}
  `.trim();
  copyText(combined);
});

document.getElementById("retryBtn").addEventListener("click", async () => {
  if (!previewImg.src || previewImg.src === window.location.href) return alert("Please upload or paste an image first.");
  await processDataUrl(previewImg.src);
});

generateQrBtn.addEventListener('click', () => {
    let userInput = fields.qrdata.value.trim();
    if (!userInput) { alert("Please enter data in the QR Data field first."); return; }
    if (!userInput.toUpperCase().endsWith(';BAHAWALPUR;')) { userInput += ';BAHAWALPUR;'; }
    fields.qrdata.value = userInput;
    status("Generating QR Code...", "processing");
    const qrImgData = generateFixedSizeQRCode(userInput);
    if (qrImgData) {
        fields.qrDownload.href = qrImgData;
        fields.qrDownload.classList.remove("hidden");
        fields.qrPlaceholder.textContent = "QR ready for download!";
        status("QR Code Generated.", "done");
    } else {
        status("Failed to generate QR Code.", "error");
    }
});

browseBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async (ev) => { if (ev.target.files?.[0]) await handleFile(ev.target.files[0]); });
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add('dragover') });
dropZone.addEventListener("dragleave", e => { dropZone.classList.remove('dragover') });
dropZone.addEventListener("drop", async (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files?.[0]) await handleFile(e.dataTransfer.files[0]); });
dropZone.addEventListener("click", (e) => { if (e.target === dropZone || e.target.parentElement === placeholder) { fileInput.click(); } });
window.addEventListener("paste", async (e) => { const items = e.clipboardData?.items || []; for (const it of items) { if (it.type?.startsWith("image/")) { const blob = it.getAsFile(); if (blob) await handleFile(blob); return; } } });

async function handleFile(file) {
  try {
    status("Preparing image...", "processing");
    resetFields();
    const dataUrl = await fileToDataUrl(file);
    previewImg.src = dataUrl;
    previewImg.classList.remove("hidden");
    placeholder.classList.add("hidden");
    await processDataUrl(dataUrl);
  } catch (err) {
    console.error(err);
    status("Failed to read file.", "error");
    alert("Could not read the image file. Try another image.");
  }
}

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.toString());
    r.onerror = e => rej(e);
    r.readAsDataURL(file);
  });
}

function status(txt, state = 'idle') {
  statusEl.textContent = txt;
  statusEl.className = `status ${state}`;
}

async function copyText(text) {
  if (!text) return;
  try { await navigator.clipboard.writeText(text); } 
  catch (e) {
    const t = document.createElement("textarea");
    t.value = text; document.body.appendChild(t);
    t.select(); document.execCommand('copy'); document.body.removeChild(t);
  }
}

function resetFields() {
  Object.values(fields).forEach(f => { if (f?.tagName === "INPUT") f.value = ""; });
  fields.qrPlaceholder.textContent = "—";
  fields.qrDownload.classList.add("hidden");
  rawOutput.textContent = "";
  status("Idle", "idle");
}

function convertArabicDigitsToEnglish(str) {
    if (!str) return "";
    return str.replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
              .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

async function processDataUrl(dataUrl) {
  try {
    status("Decoding QR locally...", "processing");
    const qrText = await tryDecodeQR(dataUrl);
    if (qrText) { fields.qrdata.value = qrText; fields.qrPlaceholder.textContent = "QR detected"; } 
    else { fields.qrPlaceholder.textContent = "No QR detected"; }

    if (!API_KEY || API_KEY.includes("YAHAN")) { status("API key missing", "error"); return; }

    status("Calling Google AI...", "processing");
    const jsonResult = await callGeminiForOCR(dataUrl);
    rawOutput.textContent = JSON.stringify(jsonResult, null, 2);

    fields.aqama.value = jsonResult.aqama_number || "";
    fields.fullname.value = (jsonResult.full_name_capital || "").toUpperCase();
    fields.fullname_ar.value = jsonResult.full_name_arabic || "";
    fields.dob_en.value = jsonResult.dob_english || "";
    fields.nationality_ar.value = jsonResult.nationality_arabic || "";

    const gregorianDateRaw = jsonResult.dob_english || "";
    if (gregorianDateRaw) {
        const gregorianDateStr = convertArabicDigitsToEnglish(gregorianDateRaw).trim();
        let hijriDate = "Invalid Date";
        
        if (moment(gregorianDateStr, 'DD/MM/YYYY', true).isValid()) {
            hijriDate = moment(gregorianDateStr, 'DD/MM/YYYY').format('iYYYY/iMM/iDD');
        } else if (moment(gregorianDateStr, 'YYYY/MM/DD', true).isValid()) {
            hijriDate = moment(gregorianDateStr, 'YYYY/MM/DD').format('iYYYY/iMM/iDD');
        }
        fields.dob_hijri.value = hijriDate;
    } else {
        fields.dob_hijri.value = "";
    }

    if (jsonResult.qr_data && !fields.qrdata.value) { fields.qrdata.value = jsonResult.qr_data || ""; }
    status("Done", "done");
  } catch (err) {
    console.error(err);
    status("Error: " + err.message, "error");
    rawOutput.textContent = String(err);
  }
}

async function tryDecodeQR(dataUrl){
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);
    const imgData = ctx.getImageData(0,0,w,h);
    const code = jsQR(imgData.data, w, h);
    if(code?.data) return code.data;
  } catch (e) { console.warn("jsQR decode failed", e); }
  return null;
}

function generateFixedSizeQRCode(text) {
  try {
    const typeNumber = 0; 
    const errorCorrectionLevel = 'L';
    const qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(text);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const finalSize = 105;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = moduleCount;
    tempCanvas.height = moduleCount;
    const tempCtx = tempCanvas.getContext('2d');
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        tempCtx.fillStyle = qr.isDark(row, col) ? '#000000' : '#ffffff';
        tempCtx.fillRect(col, row, 1, 1);
      }
    }
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = finalSize;
    finalCanvas.height = finalSize;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.drawImage(tempCanvas, 0, 0, moduleCount, moduleCount, 0, 0, finalSize, finalSize);
    return finalCanvas.toDataURL('image/png');
  } catch (e) {
    console.warn("QR generation error", e);
    return null;
  }
}

async function callGeminiForOCR(dataUrl){
  const base64 = dataUrl.split(",")[1];
  const promptText = `You are an expert OCR system. Extract information from the provided ID card image and return ONLY a valid JSON object.

FIELDS TO EXTRACT:
1. "aqama_number": The ID number (digits only).
2. "full_name_capital": The name in English, in ALL CAPS.
3. "full_name_arabic": The name in Arabic script.
4. "dob_english": The Gregorian date of birth in DD/MM/YYYY format.
5. "nationality_arabic": The nationality in Arabic script (e.g., "باكستان").
6. "qr_data": Any data found inside a QR code.

EXAMPLE JSON OUTPUT:
{
  "aqama_number": "2568702043",
  "full_name_capital": "SHER ALAM MUHAMMAD RAZIQ",
  "full_name_arabic": "شير علام محمد رازيك",
  "dob_english": "01/01/1982",
  "nationality_arabic": "باكستان",
  "qr_data": ""
}

RULES:
- If a field is not found, its value must be an empty string "".
- Your entire response must be ONLY the JSON object, with no extra text, explanations, or markdown formatting.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: "image/png", data: base64 } }] }],
    generationConfig: { temperature: 0.0, maxOutputTokens: 1024 }
  };
  const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!resp.ok) { const text = await resp.text(); throw new Error(`API error ${resp.status}: ${text}`); }
  const data = await resp.json();
  const rawText = extractTextFromGeminiResponse(data);
  try {
    return JSON.parse(rawText);
  } catch (e) {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); }
      catch (ex) { throw new Error("Failed to parse JSON from model output."); }
    }
    throw new Error("Model output did not contain valid JSON.");
  }
}

function extractTextFromGeminiResponse(response){
  try {
    return response.candidates[0].content.parts[0].text;
  } catch (e) {
    console.warn("extractTextFromGeminiResponse failed", e);
    return JSON.stringify(response);
  }

}
