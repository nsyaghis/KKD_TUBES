/**
 * ============================================================
 *  SMART ORDER TRACKER - JAVASCRIPT
 *  Tugas RPA - n8n & AI Integration
 * ============================================================
 *
 *  KONFIGURASI:
 *  Ganti nilai N8N_WEBHOOK_URL dengan URL webhook dari n8n kamu.
 *  Aktifkan workflow di n8n sebelum testing.
 * ============================================================
 */

// ============================================================
//  KONFIGURASI - GANTI DENGAN URL WEBHOOK N8N KAMU
// ============================================================
const CONFIG = {
  N8N_WEBHOOK_URL: "https://nsyaghis.app.n8n.cloud/webhook-test/order",
  // Contoh: "https://yourname.app.n8n.cloud/webhook/order-masuk"
  // Untuk n8n lokal: "http://localhost:5678/webhook/order-masuk"
};

// ============================================================
//  STATE MANAGEMENTe
// ============================================================
let currentStep = 1;
let lastOrderId = "";

// ============================================================
//  MULTI-STEP FORM
// ============================================================

/**
 * Pindah ke step berikutnya setelah validasi
 * @param {number} targetStep - Step tujuan
 */
function nextStep(targetStep) {
  if (!validateStep(currentStep)) return;

  // Update indicator
  const currentIndicator = document.getElementById(`step-indicator-${currentStep}`);
  currentIndicator.classList.remove("active");
  currentIndicator.classList.add("completed");

  // Update progress line
  const lines = document.querySelectorAll(".progress-line");
  if (targetStep > 1) lines[targetStep - 2].classList.add("done");

  // Show/hide steps
  document.getElementById(`step-${currentStep}`).classList.add("hidden");
  document.getElementById(`step-${targetStep}`).classList.remove("hidden");

  // Activate next indicator
  document.getElementById(`step-indicator-${targetStep}`).classList.add("active");

  currentStep = targetStep;

  // Jika menuju step konfirmasi, render summary
  if (targetStep === 3) renderSummary();

  // Scroll ke atas form
  document.getElementById("order-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Kembali ke step sebelumnya
 * @param {number} targetStep
 */
function prevStep(targetStep) {
  document.getElementById(`step-indicator-${currentStep}`).classList.remove("active");

  const lines = document.querySelectorAll(".progress-line");
  if (currentStep > 1) lines[currentStep - 2].classList.remove("done");

  const prevIndicator = document.getElementById(`step-indicator-${targetStep}`);
  prevIndicator.classList.remove("completed");
  prevIndicator.classList.add("active");

  document.getElementById(`step-${currentStep}`).classList.add("hidden");
  document.getElementById(`step-${targetStep}`).classList.remove("hidden");

  currentStep = targetStep;
  document.getElementById("order-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
//  VALIDASI FORM
// ============================================================

/**
 * Validasi setiap step
 * @param {number} step
 * @returns {boolean}
 */
function validateStep(step) {
  let isValid = true;

  if (step === 1) {
    isValid &= validateField("nama",     val => val.trim().length >= 3,     "Nama minimal 3 karakter.");
    isValid &= validateField("email",    val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Format email tidak valid.");
    isValid &= validateField("telepon",  val => /^08[0-9]{8,12}$/.test(val),  "Nomor telepon tidak valid (contoh: 08123456789).");
  }

  if (step === 2) {
    isValid &= validateField("produk",  val => val !== "",  "Silakan pilih produk.");
    isValid &= validateField("jumlah",  val => Number(val) >= 1, "Jumlah harus minimal 1.");
    isValid &= validateField("alamat",  val => val.trim().length >= 10, "Alamat terlalu pendek (minimal 10 karakter).");
  }

  if (step === 3) {
    const agreed = document.getElementById("agreement").checked;
    if (!agreed) {
      document.getElementById("agreement-error").textContent = "Kamu harus menyetujui syarat dan ketentuan.";
      isValid = false;
    } else {
      document.getElementById("agreement-error").textContent = "";
    }
  }

  return Boolean(isValid);
}

/**
 * Validasi satu field
 * @param {string} fieldId
 * @param {Function} testFn
 * @param {string} errorMsg
 * @returns {boolean}
 */
function validateField(fieldId, testFn, errorMsg) {
  const field   = document.getElementById(fieldId);
  const errSpan = document.getElementById(`${fieldId}-error`);
  const wrapper = field.closest(".input-wrapper");

  if (!testFn(field.value)) {
    errSpan.textContent = errorMsg;
    wrapper.classList.add("has-error");
    field.focus();
    return false;
  }

  errSpan.textContent = "";
  wrapper.classList.remove("has-error");
  return true;
}

// Hapus error saat user mulai mengetik
document.querySelectorAll("input, select, textarea").forEach(el => {
  el.addEventListener("input", () => {
    const errSpan = document.getElementById(`${el.id}-error`);
    if (errSpan) errSpan.textContent = "";
    el.closest(".input-wrapper")?.classList.remove("has-error");
  });
});

// ============================================================
//  QUANTITY CONTROL
// ============================================================
function changeQty(delta) {
  const input = document.getElementById("jumlah");
  const current = parseInt(input.value) || 1;
  const newVal = Math.min(99, Math.max(1, current + delta));
  input.value = newVal;
}

// ============================================================
//  RENDER SUMMARY (STEP 3)
// ============================================================
function renderSummary() {
  const fields = [
    { label: "Nama",     id: "nama"     },
    { label: "Email",    id: "email"    },
    { label: "Telepon",  id: "telepon"  },
    { label: "Produk",   id: "produk"   },
    { label: "Jumlah",   id: "jumlah", suffix: " unit" },
    { label: "Catatan",  id: "catatan"  },
    { label: "Alamat",   id: "alamat"   },
  ];

  const summaryEl = document.getElementById("order-summary");
  summaryEl.innerHTML = "";

  fields.forEach(f => {
    const val = document.getElementById(f.id)?.value?.trim();
    if (!val) return;

    const label = document.createElement("span");
    label.className = "summary-label";
    label.textContent = f.label;

    const value = document.createElement("span");
    value.className = "summary-value";
    value.textContent = val + (f.suffix || "");

    summaryEl.appendChild(label);
    summaryEl.appendChild(value);
  });
}

// ============================================================
//  SUBMIT FORM → KIRIM KE N8N WEBHOOK
// ============================================================
document.getElementById("orderForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!validateStep(3)) return;

  const submitBtn = document.getElementById("submitBtn");
  const btnText   = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");

  // Loading state
  submitBtn.disabled = true;
  btnText.classList.add("hidden");
  btnLoader.classList.remove("hidden");

  // Buat Order ID unik
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const orderId = `ORD-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  // Kumpulkan data form
  const orderData = {
    order_id:  orderId,
    timestamp: now.toISOString(),
    nama:      document.getElementById("nama").value.trim(),
    email:     document.getElementById("email").value.trim(),
    telepon:   document.getElementById("telepon").value.trim(),
    produk:    document.getElementById("produk").value,
    jumlah:    document.getElementById("jumlah").value,
    catatan:   document.getElementById("catatan").value.trim(),
    alamat:    document.getElementById("alamat").value.trim(),
    status:    "Order Masuk",
  };

  try {
    const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`Server mengembalikan status ${response.status}`);
    }

    // Sukses
    lastOrderId = orderId;
    showSuccessModal(orderId);
    resetForm();

  } catch (err) {
    console.error("Error kirim order:", err);
    showErrorModal(
      err.message.includes("Failed to fetch")
        ? "Tidak dapat terhubung ke server. Pastikan n8n berjalan dan webhook URL sudah benar."
        : err.message
    );
  } finally {
    submitBtn.disabled = false;
    btnText.classList.remove("hidden");
    btnLoader.classList.add("hidden");
  }
});

// ============================================================
//  CEK STATUS ORDER
// ============================================================

/**
 * Konfigurasi timeline status
 */
const STATUS_TIMELINE = [
  { key: "Order Masuk", icon: "📥", desc: "Order diterima oleh sistem" },
  { key: "Diproses",    icon: "⚙️", desc: "Pesanan sedang dikemas" },
  { key: "Dikirim",     icon: "🚚", desc: "Pesanan dalam perjalanan" },
  { key: "Selesai",     icon: "✅", desc: "Pesanan telah diterima" },
];

const STATUS_CLASS_MAP = {
  "Order Masuk": "status-order-masuk",
  "Diproses":    "status-diproses",
  "Dikirim":     "status-dikirim",
  "Selesai":     "status-selesai",
};

function checkStatus() {
  const orderId = document.getElementById("orderIdInput").value.trim();
  const resultEl = document.getElementById("status-result");

  if (!orderId) {
    resultEl.innerHTML = `<p style="color:var(--danger);font-size:.9rem;">⚠️ Masukkan Order ID terlebih dahulu.</p>`;
    resultEl.classList.remove("hidden");
    return;
  }

  if (!orderId.startsWith("ORD-")) {
    resultEl.innerHTML = `<p style="color:var(--danger);font-size:.9rem;">⚠️ Format Order ID tidak valid. Contoh: ORD-20240601143022</p>`;
    resultEl.classList.remove("hidden");
    return;
  }

  // Demo: simulasikan status berdasarkan Order ID
  const demoStatus = getDemoStatus(orderId);

  resultEl.innerHTML = renderStatusResult(orderId, demoStatus);
  resultEl.classList.remove("hidden");
}

/**
 * Demo: tentukan status berdasarkan karakter terakhir Order ID
 * Di produksi, ganti dengan fetch ke n8n/Google Sheets API
 */
function getDemoStatus(orderId) {
  const lastChar = orderId.slice(-1);
  const statusMap = { "0": "Selesai", "1": "Dikirim", "2": "Diproses", "3": "Order Masuk" };
  const num = parseInt(lastChar);
  if (!isNaN(num) && num <= 3) return statusMap[String(num)] || "Order Masuk";
  if (!isNaN(num) && num <= 6) return "Diproses";
  return "Dikirim";
}

function renderStatusResult(orderId, currentStatus) {
  const activeIndex = STATUS_TIMELINE.findIndex(s => s.key === currentStatus);
  const badgeClass  = STATUS_CLASS_MAP[currentStatus] || "status-order-masuk";

  const timelineHTML = STATUS_TIMELINE.map((step, i) => {
    let dotClass = "";
    if (i < activeIndex)  dotClass = "done";
    if (i === activeIndex) dotClass = "active";

    return `
      <div class="timeline-item">
        <div class="timeline-dot ${dotClass}">${dotClass === "done" ? "✓" : step.icon}</div>
        <div class="timeline-content">
          <strong>${step.key}</strong>
          <span>${step.desc}</span>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div style="margin-bottom:.75rem;">
      <span style="font-size:.82rem;color:var(--text-muted);">Order ID:</span>
      <strong style="font-family:monospace;font-size:.9rem;margin-left:.4rem;">${orderId}</strong>
    </div>
    <div style="margin-bottom:1.25rem;">
      <span style="font-size:.82rem;color:var(--text-muted);">Status saat ini:</span>
      <span class="status-badge ${badgeClass}" style="margin-left:.5rem;">${currentStatus}</span>
    </div>
    <div class="timeline">${timelineHTML}</div>
    <p style="font-size:.78rem;color:var(--text-muted);margin-top:1rem;">
      * Status demo. Di produksi, status diambil dari Google Sheets via n8n API.
    </p>
  `;
}

// ============================================================
//  MODAL HELPERS
// ============================================================
function showSuccessModal(orderId) {
  document.getElementById("modalOrderId").textContent = orderId;
  document.getElementById("successModal").classList.remove("hidden");
}

function showErrorModal(msg) {
  document.getElementById("errorMessage").textContent = msg;
  document.getElementById("errorModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("successModal").classList.add("hidden");
}

function closeErrorModal() {
  document.getElementById("errorModal").classList.add("hidden");
}

// Tutup modal jika klik di luar
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", function (e) {
    if (e.target === this) this.classList.add("hidden");
  });
});

// Tutup modal dengan Escape
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.add("hidden"));
  }
});

// ============================================================
//  RESET FORM SETELAH SUBMIT
// ============================================================
function resetForm() {
  document.getElementById("orderForm").reset();

  // Kembali ke step 1
  document.getElementById(`step-${currentStep}`).classList.add("hidden");
  document.getElementById("step-1").classList.remove("hidden");

  document.querySelectorAll(".progress-step").forEach((el, i) => {
    el.classList.remove("active", "completed");
    if (i === 0) el.classList.add("active");
  });

  document.querySelectorAll(".progress-line").forEach(l => l.classList.remove("done"));

  currentStep = 1;
}

// ============================================================
//  ENTER KEY di Status Input
// ============================================================
document.getElementById("orderIdInput").addEventListener("keydown", e => {
  if (e.key === "Enter") checkStatus();
});

// ============================================================
//  LOG KONFIGURASI (untuk debugging saat presentasi)
// ============================================================
console.log("%c Smart Order Tracker 🚀", "font-size:16px;font-weight:bold;color:#4f46e5;");
console.log("%c Webhook URL:", "color:#6b7280;", CONFIG.N8N_WEBHOOK_URL);
console.log("%c Ganti N8N_WEBHOOK_URL di script.js dengan URL webhook dari n8n kamu.", "color:#f59e0b;");
