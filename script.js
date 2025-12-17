const supabaseUrl = 'https://hysjbwysizpczgcsqvuv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c2pid3lzaXpwY3pnY3NxdnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjA2MTYsImV4cCI6MjA3OTQ5NjYxNn0.sLSfXMn9htsinETKUJ5IAsZ2l774rfeaNNmB7mVQcR4';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

let globalData=[], myTeamData=[], sortState={col:'joinDate',dir:'asc'};
let vipLists = {1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[]};
let achieverTxtContent = "";

// INITIALIZATION
document.addEventListener('DOMContentLoaded',async()=>{
    const a=window.location.pathname, b=sessionStorage.getItem('isLoggedIn');
    if(!b && !a.includes('index.html')){ window.location.href='index.html'; return; }
    if(b) await loadData();
    if(a.includes('index.html')) document.getElementById('loginButton').addEventListener('click', doLogin);
    else if(a.includes('dashboard.html')) renderDashboard();
    else if(a.includes('list.html')){ prepareMyTeamData(); initList(); }
    else if(a.includes('network.html')){ prepareMyTeamData(); initNetwork(); }
});

// CORE FUNCTIONS
async function loadData(){
    try {
        const {data:a, error:b} = await db.from('members').select('*');
        if(b) throw b;
        globalData = a.map(a => ({
            uid: String(a.UID||a.uid).trim(),
            name: (a.Nama||a.nama||a.name||'-').trim(),
            upline: a.Upline||a.upline ? String(a.Upline||a.upline).trim() : "",
            joinDate: new Date(a.TanggalBergabung||a.tanggalbergabung||a.joinDate)
        }));
    } catch(a){ console.error(a); }
}

async function doLogin(){
    const a = document.getElementById('loginUid').value.trim(), b = document.getElementById('loginButton'), c = document.getElementById('error');
    if(!a) { c.innerText="Masukkan UID"; return; }
    b.innerText="...", b.disabled=!0; await loadData();
    const d = globalData.find(x => x.uid === a);
    if(d) {
        sessionStorage.setItem('isLoggedIn','true'); sessionStorage.setItem('userUid',d.uid);
        window.location.href='dashboard.html';
    } else { c.innerText="UID Tidak Terdaftar"; b.innerText="MASUK"; b.disabled=!1; }
}

function prepareMyTeamData(){
    const a = sessionStorage.getItem('userUid'), b = globalData.find(b => b.uid === a);
    if(b){ myTeamData = [b, ...getDownlinesRecursive(a)]; }
}

function getDownlinesRecursive(a){
    let b = []; const c = globalData.filter(b => b.upline === a);
    c.forEach(a => { b.push(a); b = b.concat(getDownlinesRecursive(a.uid)); }); return b;
}

function getRankLevel(uid){
    const tm = [globalData.find(m => m.uid === uid), ...getDownlinesRecursive(uid)];
    const tot = tm.length, dir = globalData.filter(b => b.upline === uid).length;
    // Mencari VIP di bawahnya secara rekursif tapi efisien
    const v2 = tm.filter(m => m.uid !== uid && checkVipDirect(m.uid) >= 2).length;
    const v1 = tm.filter(m => m.uid !== uid && checkVipDirect(m.uid) >= 1).length;
    const tiers = [{l:9,m:3501,rv:2},{l:8,m:1601,rv:2},{l:7,m:901,rv:2},{l:6,m:501,rv:2},{l:5,m:351,rv:2},{l:4,m:201,rv:2},{l:3,m:101,rv:2},{l:2,m:31,rv:2}];
    for(const t of tiers){ if(tot >= t.m){ let cv = (t.l >= 3) ? v2 : v1; if(cv >= t.rv) return t.l; } }
    return (dir >= 5) ? 1 : 0;
}

function checkVipDirect(uid){
    const dir = globalData.filter(b => b.upline === uid).length;
    const tot = [globalData.find(m => m.uid === uid), ...getDownlinesRecursive(uid)].length;
    if(tot >= 31) return 2; if(dir >= 5) return 1; return 0;
}

function countVipStats(a){
    let b = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0}, alertStatus = {};
    vipLists = {1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[]};
    const now = new Date(), msDay = 24*60*60*1000;
    a.forEach(m => {
        let c = getRankLevel(m.uid);
        if(c >= 1 && c <= 9){ 
            b[c]++; vipLists[c].push(m);
            const jd = new Date(m.joinDate);
            if((now-jd) < msDay || jd.toDateString() === now.toDateString()) alertStatus[c] = true;
        }
    });
    for(let i=1; i<=9; i++){
        const el = document.getElementById(`cVIP${i}`);
        if(el){ 
            el.innerText = b[i]; 
            if(alertStatus[i]) el.parentElement.classList.add('new-alert');
            else el.parentElement.classList.remove('new-alert');
        }
    }
}

window.openVipModal = function(level){
    const body = document.getElementById('modalBody');
    document.getElementById('modalTitle').innerText = `DAFTAR V.I.P ${level}`;
    body.innerHTML = ''; const now = new Date(), msDay = 24*60*60*1000;
    let sorted = [...vipLists[level]].sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate));
    sorted.forEach(m => {
        const jd = new Date(m.joinDate), isNew = (now-jd) < msDay || jd.toDateString() === now.toDateString();
        body.innerHTML += `<div class="v-item ${isNew ? 'new-name-alert' : ''}" style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #222;">
            <span style="color:#fff; font-weight:bold;">${m.name} ${isNew ? '🆕' : ''}</span>
            <span style="color:var(--gold); font-family:monospace; font-weight:bold;">${m.uid}</span>
        </div>`;
    });
    document.getElementById('vipModal').style.display = 'flex';
}

function openAchieverModal() {
    const modal = document.getElementById('achieverModal'), body = document.getElementById('achieverBody'), title = document.getElementById('achieverTitle'), btnDl = document.getElementById('btnDlAchiever');
    modal.style.display = 'flex'; body.innerHTML = '<div class="v-empty">Menghitung...</div>';
    setTimeout(() => {
        const now = new Date(), d = now.getDate(), m = now.getMonth(), y = now.getFullYear();
        let startP, endP, cutoff, plabel = "";
        if(d <= 15){ 
            let pm = m-1, py = y; if(pm<0){pm=11;py--;} 
            startP=new Date(py,pm,16); endP=new Date(py,pm+1,0,23,59,59); cutoff=new Date(py,pm,16); plabel=`PERIODE 2 (${getMonthName(pm)} ${py})`; 
        } else { startP=new Date(y,m,1); endP=new Date(y,m,15,23,59,59); cutoff=new Date(y,m,1); plabel=`PERIODE 1 (${getMonthName(m)} ${y})`; }
        title.innerText = `PERAIH 50% - ${plabel}`;
        achieverTxtContent = `🏆 DAFTAR PERAIH GROWTH 50%\n📅 ${plabel}\n\n`;
        let achs = []; const myUid = sessionStorage.getItem('userUid');
        myTeamData.forEach(mem => {
            if(mem.joinDate >= cutoff) return;
            const dls = getDownlinesRecursive(mem.uid), base = dls.filter(dl => dl.joinDate < cutoff).length + 1;
            const grow = dls.filter(dl => dl.joinDate >= startP && dl.joinDate <= endP).length;
            const target = Math.floor(base/2), rank = getRankLevel(mem.uid);
            if(grow >= target && target > 0 && rank >= 1) achs.push({name: (mem.uid===myUid?mem.name+" (ANDA)":mem.name), uid: mem.uid, target, actual: grow, rank});
        });
        achs.sort((a,b) => b.actual - a.actual);
        if(achs.length === 0) body.innerHTML = '<div class="v-empty">Belum ada data.</div>';
        else {
            btnDl.style.display = 'block'; let h = '';
            achs.forEach((a, i) => {
                h += `
                <div class="achiever-card">
                    <div class="ach-top">
                        <div><div class="ach-name">${i+1}. ${a.name}</div><span class="ach-rank-badge">VIP ${a.rank}</span></div>
                        <span class="ach-uid">${a.uid}</span>
                    </div>
                    <div class="ach-stats">
                        <div class="ach-box"><span class="ach-label">Target</span><div class="ach-val" style="color:#fff;">${a.target}</div></div>
                        <div class="ach-box" style="border-color:var(--gold);"><span class="ach-label" style="color:var(--gold);">Capaian</span><div class="ach-val" style="color:var(--gold);">${a.actual}</div></div>
                    </div>
                </div>`;
                achieverTxtContent += `${i+1}. ${a.name} (${a.uid}) | T: ${a.target} | C: ${a.actual}\n`;
            });
            body.innerHTML = h;
        }
    }, 200);
}

// DASHBOARD RENDER & CHART
function renderDashboard(){
    const a = sessionStorage.getItem('userUid'); if(!globalData.length) return;
    const b = globalData.find(x => x.uid === a); if(!b) return;
    document.getElementById('mName').innerText = b.name; document.getElementById('mUid').innerText = b.uid;
    const c = globalData.find(x => x.uid === b.upline); document.getElementById('mRefUid').innerText = c ? c.uid : '-';
    const d = getDownlinesRecursive(a), e = 1 + d.length;
    document.getElementById('totalMembers').innerText = e;
    myTeamData = [b, ...d];
    countVipStats(myTeamData);
    
    const h=new Date, i=h.getDate(), j=h.getMonth(), k=h.getFullYear();
    let l, m, n, o=!1;
    if(i <= 15){ l = new Date(k, j, 1); m = new Date(k, j, 0, 23, 59, 59); n = `PERIODE 1 (${getMonthName(j)})`; }
    else { l = new Date(k, j, 16); m = new Date(k, j, 15, 23, 59, 59); n = `PERIODE 2 (${getMonthName(j)})`; o=!0; }
    document.getElementById('currentPeriodLabel').innerText = n;
    const p = myTeamData.filter(x => x.joinDate <= m).length, q = myTeamData.filter(x => x.joinDate >= l).length, r = Math.ceil(p/2);
    document.getElementById('prevPeriodCount').innerText = p; document.getElementById('targetCount').innerText = r;
    document.getElementById('newMemberCount').innerText = q; document.getElementById('gapCount').innerText = Math.max(0, r-q);
    
    // Render Chart
    const ctx = document.getElementById('growthChart').getContext('2d');
    const p1End = new Date(k, j, 15, 23, 59, 59), p2Start = new Date(k, j, 16);
    const p1Count = myTeamData.filter(x => x.joinDate >= new Date(k, j, 1) && x.joinDate <= p1End).length;
    const p2Count = myTeamData.filter(x => x.joinDate >= p2Start && x.joinDate <= new Date(k, j+1, 0)).length;
    if(window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'bar', data: { labels: ['P1', 'P2'], datasets: [{ data: [p1Count, p2Count], backgroundColor: [o?'#333':'#D4AF37', o?'#D4AF37':'#333'], borderColor: '#D4AF37', borderWidth: 1 }] },
        options: { responsive: !0, maintainAspectRatio: !1, scales: { y: { beginAtZero: !0, grid: { color: '#333' }, ticks: { display: !1 } }, x: { grid: { display: !1 }, ticks: { color: '#888', fontSize: 9 } } }, plugins: { legend: { display: !1 } } }
    });
}

function initList(){
    const body = document.getElementById('membersTableBody');
    let h = ''; 
    let sorted = [...myTeamData].sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate));
    sorted.forEach((m, i) => {
        h += `<tr><td class="col-no">${i+1}</td><td class="col-name">${m.name}</td><td class="col-uid">${m.uid}</td><td class="col-ref">${m.upline||'-'}</td><td class="col-date">${m.joinDate.toLocaleDateString()}</td></tr>`;
    });
    body.innerHTML = h;
}

function initNetwork(){ /* GoJS Logic Here */ }
function closeVipModal(){ document.getElementById('vipModal').style.display = 'none'; }
function closeAchieverModal(){ document.getElementById('achieverModal').style.display = 'none'; }
function downloadAchieverData(){ const b = new Blob([achieverTxtContent], {type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'peraih_50.txt'; a.click(); }
function getMonthName(a){ return ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"][a]; }
function logout(){ sessionStorage.clear(); window.location.href='index.html'; }
