// Inventory dataset for the xatspace page
// Edit item names, labels, and notes here to update the displayed sale list.
// Cada grupo abaixo representa uma seção da lista de vendas.
const inventoryData = [
  {
    // Nome da seção exibida na página
    category: "Short names for sale",
    // Texto descritivo para essa seção
    description: "Names available to purchase directly.",
    items: [
      // Cada item representa uma oferta única
      { label: "softie", note: "short name" },
      { label: "Skip", note: "short name" }
    ]
  },
  {
    category: "IDs for sale",
    description: "Available xat IDs and special listings.",
    items: [
      { label: "M digit", note: "182M" },
      { label: "5 digits", note: "68922" },
      { label: "6 digits - NEVER REGISTERED BEFORE", note: "277772" },
      { label: "9 and 10 digits", note: "" }
    ]
  }
];

const getItemCard = (item) => {
  // If this is the 9/10-digits row, render a button in place of the note
  if (item.label && item.label.toLowerCase().includes('9 and 10')) {
    return `
      <li>
        <span>${item.label}</span>
        <button id="open-digits-btn-inventory" class="link-pill" type="button">Check 9 & 10 digits</button>
      </li>
    `;
  }

  return `
    <li>
      <span>${item.label}</span>
      <em>${item.note}</em>
    </li>
  `;
};

const renderInventory = () => {
  const container = document.getElementById("inventory-list");
  if (!container) return;

  container.innerHTML = inventoryData
    .map((group) => {
      const itemsMarkup = group.items.map(getItemCard).join("\n");
      return `
        <section class="inventory-group">
          <strong>${group.category}</strong>
          <p>${group.description}</p>
          <ul class="inventory-list">
            ${itemsMarkup}
          </ul>
        </section>
      `;
    })
    .join("\n");

  // bind the new inventory button (if present)
  const invBtn = document.getElementById('open-digits-btn-inventory');
  if (invBtn) invBtn.addEventListener('click', openDigitsModal);
};

window.addEventListener("DOMContentLoaded", renderInventory);

// --- Digits modal: show 9- and 10-digit ID lists (loads from text files if available) ---
// Default fallback data (used if fetch fails or files are missing)
const digitsData = {
  9: [ '123456789', '987654321', '112233445', '344107857', '277772999' ],
  10: [
    '1012102031','1012102036','1012321031','1012321032','1011101491','1011011513',
    '1011104424','1011432002','1012323032','1012323044','1021105021','1021321244',
    '1044100540','1044122024','1050101081','1058101003','1058101051','1058102200',
    '1058102201','1066100505','1066105009','1066108006','1070101003','1070101009',
    '1070102009','1070102022','1070107766','1070211100','1070211121','1070210770',
    '1070211004','1070211003','1091100077','1091101311','1100010354','1100011056',
    '1100211007','1100211008','1100211044','1100211045','1100211053','1100211221',
    '1100323023','1477460606','1490900919','1490900929'
  ]
};

// Attempt to load file-based lists: `digits-9.txt` and `digits-10.txt` (one ID per line)
async function loadDigitsFromFiles() {
  const tryLoad = async (path) => {
    try {
      const res = await fetch(path, {cache: 'no-store'});
      if (!res.ok) throw new Error('no file');
      const txt = await res.text();
      return txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    } catch (e) {
      return null;
    }
  };

  const nine = await tryLoad('digits-9.txt');
  const ten = await tryLoad('digits-10.txt');

  // validate and normalize loaded lists: keep only numeric entries
  if (Array.isArray(nine)) {
    const valid9 = nine.map(s => s.replace(/\s+/g,'')).filter(s => /^\d{9}$/.test(s));
    if (valid9.length > 0) {
      digitsData[9] = valid9;
    } else {
      // If no strict 9-digit entries found, try looser numeric filter
      const fallback9 = nine.map(s => s.replace(/\s+/g,''))
                           .filter(s => /^\d+$/.test(s));
      if (fallback9.length > 0) digitsData[9] = fallback9;
    }
  }

  if (Array.isArray(ten)) {
    const valid10 = ten.map(s => s.replace(/\s+/g,'')).filter(s => /^\d{10}$/.test(s));
    if (valid10.length > 0) {
      digitsData[10] = valid10;
    } else {
      const fallback10 = ten.map(s => s.replace(/\s+/g,''))
                            .filter(s => /^\d+$/.test(s));
      if (fallback10.length > 0) digitsData[10] = fallback10;
    }
  }
}

const digitsState = {
  mode: 9,
  filter: ''
};

const openDigitsModal = () => {
  const modal = document.getElementById('digits-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  updateDigitsStatus();
  renderDigitsList();
};

const closeDigitsModal = () => {
  const modal = document.getElementById('digits-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
};

const setDigitMode = (mode) => {
  digitsState.mode = Number(mode);
  renderDigitsList();
};

const renderDigitsList = () => {
  const listEl = document.getElementById('digits-list');
  if (!listEl) return;
  const arr = digitsData[digitsState.mode] || [];
  const filtered = digitsState.filter
    ? arr.filter((id) => id.includes(digitsState.filter))
    : arr;

  if (filtered.length === 0) {
    listEl.innerHTML = '<li><em style="color:var(--muted)">No IDs found. Add them in script.js &uarr; digitsData.</em></li>';
    return;
  }

  listEl.innerHTML = filtered.map(id => `<li><span>${id}</span><small style="color:var(--muted)"> ${id.length} digits</small></li>`).join('\n');
};

document.addEventListener('DOMContentLoaded', () => {
  // load files (if available) so the modal reads the external lists
  loadDigitsFromFiles().then(() => {
    // update status and refresh list
    updateDigitsStatus();
    renderDigitsList();
  });
  const openBtn = document.getElementById('open-digits-btn');
  const closeBtn = document.getElementById('digits-close');
  const filterInput = document.getElementById('digits-filter');
  const radios = document.getElementsByName('digit-mode');

  if (openBtn) openBtn.addEventListener('click', openDigitsModal);
  if (closeBtn) closeBtn.addEventListener('click', closeDigitsModal);
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      digitsState.filter = e.target.value.trim();
      renderDigitsList();
    });
  }

  radios.forEach && radios.forEach(r => r.addEventListener('change', (e) => setDigitMode(e.target.value)));
  // initial status
  updateDigitsStatus();
});

function updateDigitsStatus() {
  const statusEl = document.getElementById('digits-status');
  if (!statusEl) return;
  const n9 = Array.isArray(digitsData[9]) ? digitsData[9].length : 0;
  const n10 = Array.isArray(digitsData[10]) ? digitsData[10].length : 0;
  statusEl.textContent = `Loaded: 9-digit: ${n9} · 10-digit: ${n10}`;
}
