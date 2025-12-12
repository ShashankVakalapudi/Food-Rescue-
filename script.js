// script.js 

function safeScrollTo(id){
  const el = document.getElementById(id);
  if(!el){ console.warn('safeScrollTo: element not found ->', id); return; }
  el.scrollIntoView({ behavior: 'smooth' });
}

const LS_DON = 'fr_comm_don_v1';
const LS_REQ = 'fr_comm_req_v1';

function uid(){ return 'id_' + Math.random().toString(36).slice(2,9); }
function load(key){ try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){ return []; } }
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

const donateBtn = document.getElementById('donateBtn');
const seedBtn = document.getElementById('seedBtn');
const exportCSVBtn = document.getElementById('exportCSV');
const donationsList = document.getElementById('donationsList');
const requestsList = document.getElementById('requestsList');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');

function escapeHtml(s){ if(!s && s!==0) return ''; return String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

function getDonations(){ return load(LS_DON); }
function setDonations(v){ save(LS_DON, v); }
function getRequests(){ return load(LS_REQ); }
function setRequests(v){ save(LS_REQ, v); }

function renderDonations(){
  const q = (searchInput && searchInput.value || '').toLowerCase();
  const t = (filterType && filterType.value) || 'all';
  const data = getDonations().filter(d => {
    const matchType = (t === 'all') || (d.type === t);
    const matchQ = (d.name + ' ' + d.location + ' ' + d.donor).toLowerCase().includes(q);
    return matchType && matchQ;
  });

  donationsList.innerHTML = '';
  if(!data.length){
    donationsList.innerHTML = '<div class="muted-text">No donations available.</div>';
    return;
  }

  data.forEach(d => {
    const el = document.createElement('div');
    el.className = 'donation';
    el.innerHTML = `
      <div>
        <div style="font-weight:700; font-size:1.1em;">${escapeHtml(d.name)}</div>
        <div class="muted-text">${escapeHtml(d.donor)} · ${escapeHtml(d.location)}</div>
        <div style="font-size:0.9em; margin-top:4px;">${d.notes ? escapeHtml(d.notes) : ''}</div>
      </div>
      <div style="text-align:right; display:flex; flex-direction:column; justify-content:space-between;">
        <div><span class="pill">${escapeHtml(d.type)}</span></div>
        <div style="margin-top:8px; display:flex; gap:8px;">
          ${d.status === 'claimed' ? '<span class="muted-text">Claimed</span>' : `<button class="cta-btn small" onclick="claimDonation('${d.id}')">Claim</button>`}
          <button class="text-btn" onclick="removeDonation('${d.id}')" style="color:#a00;">Remove</button>
        </div>
      </div>
    `;
    donationsList.appendChild(el);
  });
}

function renderRequests(){
  const data = getRequests();
  requestsList.innerHTML = '';
  if(!data.length){ requestsList.innerHTML = '<div class="muted-text">No requests yet.</div>'; return; }
  data.forEach(r => {
    const el = document.createElement('div');
    el.className = 'donation';
    el.style.borderLeftColor = '#666'; 
    el.innerHTML = `
      <div>
        <div style="font-weight:700">${escapeHtml(r.name)}</div>
        <div class="muted-text">Needs: ${escapeHtml(r.need)}</div>
        <div class="muted-text">${escapeHtml(r.location)}</div>
      </div>
      <div style="display:flex; flex-direction:column; justify-content:flex-end; gap:5px;">
        <button class="cta-btn small" onclick="fulfillRequest('${r.id}')">Fulfill</button>
        <button class="text-btn" onclick="removeRequest('${r.id}')" style="color:#a00;">Remove</button>
      </div>
    `;
    requestsList.appendChild(el);
  });
}

// Add Donation
if(donateBtn){
  donateBtn.addEventListener('click', () => {
    const donor = (document.getElementById('donorName').value || 'Anonymous').trim();
    const contact = (document.getElementById('donorContact').value || '').trim();
    const name = (document.getElementById('itemName').value || '').trim();
    if(!name){ alert('Please enter item name'); return; }
    const type = document.getElementById('itemType').value;
    const qty = document.getElementById('quantity').value;
    const location = (document.getElementById('location').value || '').trim();
    const notes = (document.getElementById('notes').value || '').trim();

    const d = { id: uid(), donor, contact, name, type, quantity: qty, location, notes, status: 'available', created: Date.now() };
    const arr = getDonations(); arr.unshift(d); setDonations(arr);
    renderDonations();
    
    document.getElementById('itemName').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('notes').value = '';
    alert('Donation added.');
  });
}

// Add Request
const requestBtn = document.getElementById('requestBtn');
if(requestBtn){
  requestBtn.addEventListener('click', () => {
    const name = (document.getElementById('reqName').value || 'Anonymous').trim();
    const need = (document.getElementById('reqNeed').value || '').trim();
    const location = (document.getElementById('reqLocation').value || '').trim();
    if(!need){ alert('Please describe the need'); return; }
    const r = { id: uid(), name, need, location, created: Date.now() };
    const arr = getRequests(); arr.unshift(r); setRequests(arr);
    renderRequests();
    
    document.getElementById('reqName').value = '';
    document.getElementById('reqNeed').value = '';
    document.getElementById('reqLocation').value = '';
  });
}

if(seedBtn){
  seedBtn.addEventListener('click', () => {
    const sample = [
      { id: uid(), donor: 'Anand Caterers', contact: '+91 98xxxx', name: '20 cooked meals', type: 'meal', quantity: 20, location: 'Powai', notes: 'hot - veg', status: 'available', created: Date.now() },
      { id: uid(), donor: 'Green Market', contact: '', name: 'Crate of bananas', type: 'produce', quantity: 50, location: 'Mulund', notes: 'ripe', status: 'available', created: Date.now() }
    ];
    setDonations(sample);
    renderDonations();
    alert('Sample data loaded.');
  });
}

function claimDonation(id){
  const arr = getDonations(); const idx = arr.findIndex(x => x.id === id);
  if(idx === -1) return;
  arr[idx].status = 'claimed';
  setDonations(arr); renderDonations();
}

function removeDonation(id){
  if(!confirm('Remove this donation?')) return;
  setDonations(getDonations().filter(x => x.id !== id));
  renderDonations();
}

function fulfillRequest(id){
  removeRequest(id);
  alert('Request marked as fulfilled.');
}

function removeRequest(id){
  if(!confirm('Remove this request?')) return;
  setRequests(getRequests().filter(x => x.id !== id));
  renderRequests();
}

if(searchInput) searchInput.addEventListener('input', renderDonations);
if(filterType) filterType.addEventListener('change', renderDonations);

if(exportCSVBtn){
  exportCSVBtn.addEventListener('click', () => {
    const data = getDonations();
    const header = ['id','donor','contact','name','type','quantity','location','notes','status'];
    const rows = data.map(d => header.map(h => `"${(d[h]||'').toString().replace(/"/g,'""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'donations.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });
}

renderDonations(); renderRequests();