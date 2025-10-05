const API_KEY = "K88675151488957"; 

const fields = {
  aqama: document.getElementById("aqama"),
  fullname: document.getElementById("fullname"),
  fullname_ar: document.getElementById("fullname_ar"),
  dob_en: document.getElementById("dob_en"),
  nationality_ar: document.getElementById("nationality_ar"),
  nationality_en: document.getElementById("nationality_en"),
  dob_hijri: document.getElementById("dob_hijri"),
  address: document.getElementById("address")
};

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const statusEl = document.getElementById("status");
const placeholder = document.getElementById("placeholder");
const previewImg = document.getElementById("previewImg");
const rawOutput = document.getElementById("rawOutput");
const generateAddressBtn = document.getElementById("generateAddressBtn");

fields.dob_en.addEventListener('input', (e) => { autoFormatDate(e.target); updateHijriDate(); });
fields.fullname.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase(); });
fields.nationality_en.addEventListener('input', (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    const sentenceCaseValue = value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";
    e.target.value = sentenceCaseValue;
    const arabicValue = reverseNationalityMap[sentenceCaseValue];
    if (arabicValue) fields.nationality_ar.value = arabicValue;
});
fields.nationality_ar.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^\u0600-\u06FF\s]/g, '');
    const englishValue = nationalityMap[e.target.value];
    if (englishValue) fields.nationality_en.value = englishValue;
});
fields.fullname_ar.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^\u0600-\u06FF\s]/g, ''); });
fields.aqama.addEventListener('input', (e) => {
    let userInput = e.target.value.replace(/\D/g, '');
    if (userInput.startsWith('2')) userInput = userInput.substring(1);
    const limitedInput = userInput.slice(0, 10); 
    e.target.value = '2' + limitedInput;
});
fields.dob_hijri.addEventListener('input', (e) => { autoFormatDate(e.target, true); });
generateAddressBtn.addEventListener('click', generateRandomAddress);

browseBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); });
dropZone.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove('dragover'));
dropZone.addEventListener("drop", (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); });
dropZone.addEventListener("click", (e) => { if (e.target === dropZone || e.target.parentElement === placeholder) fileInput.click(); });
window.addEventListener("paste", (e) => { const items = e.clipboardData?.items || []; for (const it of items) { if (it.type?.startsWith("image/")) { const blob = it.getAsFile(); if (blob) handleFile(blob); return; } } });

document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-target");
    copyText(fields[targetId]?.value || "");
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
Nationality (English): ${fields.nationality_en.value}
Address: ${fields.address.value}
  `.trim();
  copyText(combined);
});

document.getElementById("retryBtn").addEventListener("click", async () => {
  if (!previewImg.src || previewImg.src === window.location.href) return alert("Please upload or paste an image first.");
  await processDataUrl(previewImg.src);
});

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
    status("Failed to read file.", "error");
    alert("Could not read the image file. Try another image.");
  }
}

async function processDataUrl(dataUrl) {
  try {
    status("Calling OCR API...", "processing");
    const parsedData = await callOcrSpaceAPI(dataUrl);
    
    fields.aqama.value = parsedData.aqama_number;
    fields.fullname.value = parsedData.full_name_capital;
    fields.fullname_ar.value = parsedData.full_name_arabic;
    fields.dob_en.value = parsedData.dob_english;
    fields.nationality_ar.value = parsedData.nationality_arabic;
    fields.nationality_en.value = parsedData.nationality_english;

    updateHijriDate();
    generateRandomAddress();

    status("Done. Please review and verify the fields.", "done");
  } catch (err) {
    status("Error: " + err.message, "error");
    rawOutput.textContent = String(err);
  }
}

async function callOcrSpaceAPI(dataUrl) {
  const formData = new FormData();
  formData.append('base64Image', dataUrl);
  formData.append('apikey', API_KEY);
  formData.append('language', 'ara');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  
  const resp = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    body: formData
  });

  if (!resp.ok) throw new Error(`OCR.space API error ${resp.status}`);
  const result = await resp.json();
  if (result.IsErroredOnProcessing || !result.ParsedResults?.[0]) {
    throw new Error(result.ErrorMessage?.join(', ') || 'Failed to parse image with OCR.space');
  }

  const rawText = result.ParsedResults[0].ParsedText;
  rawOutput.textContent = rawText; 
  return parseOcrText(rawText);
}

function convertArabicDigitsToEnglish(str) {
    if (!str) return "";
    return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
              .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
}

const nationalityMap = {
    'الهند': 'India',
    'باكستان': 'Pakistan',
    'بنجلاديش': 'Bangladesh',
    'مصر': 'Egypt',
    'السودان': 'Sudan'
};
const reverseNationalityMap = {};
for (const key in nationalityMap) {
    reverseNationalityMap[nationalityMap[key]] = key;
}

const addressTemplates = {
    Pakistan: [ "House #{house}, Street #{street}, Sector {sector}, {city}, Pakistan" ],
    India: [ "#{house}/#{street}, {area}, {city}, {state}, India" ],
    Bangladesh: [ "House #{house}, Road #{road}, Block {block}, {area}, Dhaka, Bangladesh" ],
    Default: [ "123 Example Street, Main City, Country" ]
};

const addressData = {
    Pakistan: { city: ["Karachi", "Lahore", "Islamabad"], sector: ["F-7", "G-10"], block: ["A", "B"] },
    India: { city: ["Mumbai", "Delhi"], state: ["Maharashtra", "Delhi"], area: ["Andheri", "Connaught Place"], street: ["10", "12"] },
    Bangladesh: { area: ["Gulshan", "Banani"], district: ["Dhaka", "Chittagong"], block: ["A", "B"], road: ["5", "7"] }
};

function getRandomElement(arr) {
    if (!arr || arr.length === 0) return ""; 
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomAddress() {
    const country = fields.nationality_en.value || "Default";
    const templates = addressTemplates[country] || addressTemplates.Default;
    const data = addressData[country] || {}; 
    
    let template = getRandomElement(templates);
    
    template = template.replace(/{city}/g, getRandomElement(data.city || ["Main City"]));
    template = template.replace(/{sector}/g, getRandomElement(data.sector || ["Sector X"]));
    template = template.replace(/{block}/g, getRandomElement(data.block || ["Block Z"]));
    template = template.replace(/{area}/g, getRandomElement(data.area || ["Central Area"]));
    template = template.replace(/{state}/g, getRandomElement(data.state || ["Main State"]));
    template = template.replace(/#{house}/g, Math.floor(Math.random() * 900) + 100);
    template = template.replace(/#{street}/g, Math.floor(Math.random() * 50) + 1);
    template = template.replace(/#{road}/g, Math.floor(Math.random() * 20) + 1);

    fields.address.value = template;
}

function parseOcrText(text) {
  const englishText = convertArabicDigitsToEnglish(text);
  const lines = englishText.split('\n').map(line => line.trim()).filter(line => line);
  
  const data = {
    aqama_number: "",
    full_name_capital: "",
    full_name_arabic: "",
    dob_english: "",
    nationality_arabic: "",
    nationality_english: ""
  };

  const nameEnRegExp = /^[A-Z\s]{8,}$/;
  const nameArRegExp = /^[\u0600-\u06FF\s]+$/;

  for (const key in nationalityMap) {
    if (englishText.includes(key)) {
        data.nationality_arabic = key;
        data.nationality_english = nationalityMap[key];
        break;
    }
  }

  lines.forEach(line => {
    if (line.includes('الهوية') || line.includes('الهويه')) {
      const match = line.match(/\b2\d{9,10}\b/);
      if (match) data.aqama_number = match[0];
    }
    else if (line.includes('الميلاد')) {
      let cleanedLine = line.replace(/[^\d\/\.-]/g, ''); 
      const match = cleanedLine.match(/(\d{1,4})[\/.-](\d{1,2})[\/.-](\d{1,4})/);
      if (match) {
        let part1 = match[1], part2 = match[2], part3 = match[3];
        let day, month, year;
        if (part1.length === 4) { [year, month, day] = [part1, part2, part3]; }
        else { [day, month, year] = [part1, part2, part3]; }
        if (year.length === 2) {
          year = (parseInt(year) > 30) ? '19' + year : '20' + year; 
        }
        data.dob_english = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
  });

  const foundEnglishNameLine = lines.find(line => nameEnRegExp.test(line));
  if (foundEnglishNameLine) {
    const nameParts = foundEnglishNameLine.split(' ').filter(p => p);
    data.full_name_capital = (nameParts.length > 1) ? nameParts.reverse().join(' ') : foundEnglishNameLine;
  }

  const potentialArNames = lines.filter(line => 
      line.length > 5 && nameArRegExp.test(line) && !line.includes(data.nationality_arabic)
  );
  if (potentialArNames.length > 0) {
      data.full_name_arabic = potentialArNames[0];
  }
  
  return data;
}

function updateHijriDate() {
    const gregorianDate = fields.dob_en.value;
    if (gregorianDate && moment(gregorianDate, 'DD/MM/YYYY', true).isValid()) {
        const hijriDate = moment(gregorianDate, 'DD/MM/YYYY').format('iYYYY/iMM/iDD');
        fields.dob_hijri.value = hijriDate;
    } else {
        fields.dob_hijri.value = "";
    }
}

function autoFormatDate(input, isHijri = false) {
    let value = input.value.replace(/\D/g, '');
    if (isHijri) { 
        if (value.length > 4) value = value.slice(0, 4) + '/' + value.slice(4);
        if (value.length > 7) value = value.slice(0, 7) + '/' + value.slice(7, 9);
    } else { 
        if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
        if (value.length > 5) value = value.slice(0, 5) + '/' + value.slice(5, 9);
    }
    input.value = value;
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
  catch (e) {  }
}

function resetFields() {
  const fieldsToReset = ['aqama', 'fullname', 'fullname_ar', 'dob_en', 'nationality_ar', 'nationality_en', 'dob_hijri', 'address'];
  fieldsToReset.forEach(id => {
      if (fields[id]) fields[id].value = "";
  });
  rawOutput.textContent = "";
  status("Idle", "idle");
}
