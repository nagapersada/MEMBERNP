const supabaseUrl = 'https://hysjbwysizpczgcsqvuv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c2pid3lzaXpwY3pnY3NxdnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjA2MTYsImV4cCI6MjA3OTQ5NjYxNn0.sLSfXMn9htsinETKUJ5IAsZ2l774rfeaNNmB7mVQcR4';
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

let globalData=[], myTeamData=[], sortState={col:'joinDate',dir:'asc'};
let vipLists = {1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[]};
let achieverTxtContent = "";

document.addEventListener('DOMContentLoaded',async()=>{
    const a=window.location.pathname, b=sessionStorage.getItem('isLoggedIn');
    if(!b && !a.includes('index.html')){ window.location.href='index.html'; return; }
    if(b) await loadData();
    if(a.includes('index.html')) document.getElementById('loginButton').addEventListener('click', doLogin);
    else if(a.includes('dashboard.html')) renderDashboard();
    else if(a.includes('list.html')){ prepareMyTeamData(); initList(); }
    else if(a.includes('network.html')){ prepareMyTeamData(); initNetwork(); }
});

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
    const v2 = tm.filter(m => m.uid !== uid && checkVipS(m.uid) >= 2).length;
    const v1 = tm.filter(m => m.uid !== uid && checkVipS(m.uid) >= 1).length;
    const tiers = [{l:9,m:3501,rv:2},{l:8,m:1601,rv:2},{l:7,m:901,rv:2},{l:6,m:501,rv:2},{l:5,m:351,rv:2},{l:4,m:201,rv:2},{l:3,m:101,rv:2},{l:2,m:31,rv:2}];
    for(const t of tiers){ if(tot >= t.m){ let cv = (t.l >= 3) ? v2 : v1; if(cv >= t.rv) return t.l; } }
    return (dir >= 5) ? 1 : 0;
}

function checkVipS(uid){
    const dir = globalData.filter(b => b.upline === uid).length;
    const tot = [globalData.find(m => m.uid === uid), ...getDownlinesRecursive(uid)].length;
    if(tot >= 31) return 2; if(dir >= 5) return 1; return 0;
}

function countVipStats(a){
    let b = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0}, alertS = {};
    vipLists = {1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[],9:[]};
    const now = new Date(), msD = 24*60*60*1000;
    a.forEach(m => {
        let c = getRankLevel(m.uid);
        if(c >= 1 && c <= 9){ 
            b[c]++; vipLists[c].push(m);
            const jd = new Date(m.joinDate);
            if((now-jd) < msD || jd.toDateString() === now.toDateString()) alertS[c] = true;
        }
    });
    for(let i=1; i<=9; i++){
        const el = document.getElementById(`cVIP${i}`);
        if(el){ el.innerText = b[i]; if(alertS[i]) el.parentElement.classList.add('new-alert'); else el.parentElement.classList.remove('new-alert'); }
    }
}

window.openVipModal = function(level){
    const body = document.getElementById('modalBody');
    document.getElementById('modalTitle').innerText = `DAFTAR V.I.P ${level}`;
    body.innerHTML = ''; const now = new Date(), msD = 24*60*60*1000;
    let sorted = [...vipLists[level]].sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate));
    sorted.forEach(m => {
        const jd = new Date(m.joinDate), isN = (now-jd) < msD || jd.toDateString() === now.toDateString();
        body.innerHTML += `<div class="v-item ${isN ? 'new-name-alert' : ''}" style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #222;">
            <span style="color:#fff; font-weight:bold;">${m.name} ${isN ? '🆕' : ''}</span>
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
        let sP, eP, cut, plabel = "";
        if(d <= 15){ let pm = m-1, py = y; if(pm<0){pm=11;py--;} sP=new Date(py,pm,16); eP=new Date(py,pm+1,0,23,59,59); cut=new Date(py,pm,16); plabel=`PERIODE 2 (${getMonthName(pm)} ${py})`; }
        else { sP=new Date(y,m,1); eP=new Date(y,m,15,23,59,59); cut=new Date(y,m,1); plabel=`PERIODE 1 (${getMonthName(m)} ${y})`; }
        title.innerText = `PERAIH 50% - ${plabel}`; achieverTxtContent = `🏆 DAFTAR PERAIH 50%\n📅 ${plabel}\n\n`;
        let achs = []; const myUid = sessionStorage.getItem('userUid');
        myTeamData.forEach(mem => {
            if(mem.joinDate >= cut) return;
            const dls = getDownlinesRecursive(mem.uid), base = dls.filter(dl => dl.joinDate < cut).length + 1;
            const grow = dls.filter(dl => dl.joinDate >= sP && dl.joinDate <= eP).length;
            const target = Math.floor(base/2), rank = getRankLevel(mem.uid);
            if(grow >= target && target > 0 && rank >= 1) achs.push({name: (mem.uid===myUid?mem.name+" (ANDA)":mem.name), uid: mem.uid, target, actual: grow, rank});
        });
        achs.sort((a,b) => b.actual - a.actual);
        if(achs.length === 0) body.innerHTML = '<div class="v-empty">Belum ada data.</div>';
        else {
            btnDl.style.display = 'block'; let h = '';
            achs.forEach((a, i) => {
                h += `<div class="achiever-card"><div class="ach-top"><div><div class="ach-name">${i+1}. ${a.name}</div><span class="ach-rank-badge">VIP ${a.rank}</span></div><span class="ach-uid">${a.uid}</span></div><div class="ach-stats"><div class="ach-box"><span class="ach-label">Target</span><div class="ach-val" style="color:#fff;">${a.target}</div></div><div class="ach-box" style="border-color:var(--gold);"><span class="ach-label" style="color:var(--gold);">Capaian</span><div class="ach-val" style="color:var(--gold);">${a.actual}</div></div></div></div>`;
                achieverTxtContent += `${i+1}. ${a.name} (${a.uid}) | T: ${a.target} | C: ${a.actual}\n`;
            });
            body.innerHTML = h;
        }
    }, 200);
}

function renderDashboard(){
    const a = sessionStorage.getItem('userUid'); if(!globalData.length) return;
    const b = globalData.find(x => x.uid === a); if(!b) return;
    document.getElementById('mName').innerText = b.name; document.getElementById('mUid').innerText = b.uid;
    const c = globalData.find(x => x.uid === b.upline); document.getElementById('mRefUid').innerText = c ? c.uid : '-';
    const d = getDownlinesRecursive(a), e = 1 + d.length;
    document.getElementById('totalMembers').innerText = e;
    myTeamData = [b, ...d]; countVipStats(myTeamData);
    const h=new Date, i=h.getDate(), j=h.getMonth(), k=h.getFullYear();
    let l, m, n, o=!1;
    if(i <= 15){ l = new Date(k, j, 1); m = new Date(k, j, 0, 23, 59, 59); n = `PERIODE 1 (${getMonthName(j)})`; }
    else { l = new Date(k, j, 16); m = new Date(k, j, 15, 23, 59, 59); n = `PERIODE 2 (${getMonthName(j)})`; o=!0; }
    document.getElementById('currentPeriodLabel').innerText = n;
    const p = myTeamData.filter(x => x.joinDate <= m).length, q = myTeamData.filter(x => x.joinDate >= l).length, r = Math.ceil(p/2);
    document.getElementById('prevPeriodCount').innerText = p; document.getElementById('targetCount').innerText = r;
    document.getElementById('newMemberCount').innerText = q; document.getElementById('gapCount').innerText = Math.max(0, r-q);
    const ctx = document.getElementById('growthChart').getContext('2d');
    const p1C = myTeamData.filter(x => x.joinDate >= new Date(k, j, 1) && x.joinDate <= new Date(k, j, 15, 23, 59, 59)).length;
    const p2C = myTeamData.filter(x => x.joinDate >= new Date(k, j, 16) && x.joinDate <= new Date(k, j+1, 0)).length;
    if(window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, { type: 'bar', data: { labels: ['P1', 'P2'], datasets: [{ data: [p1C, p2C], backgroundColor: [o?'#333':'#D4AF37', o?'#D4AF37':'#333'], borderColor: '#D4AF37', borderWidth: 1 }] }, options: { responsive: !0, maintainAspectRatio: !1, scales: { y: { beginAtZero: !0, grid: { color: '#333' }, ticks: { display: !1 } }, x: { grid: { display: !1 }, ticks: { color: '#888', fontSize: 9 } } }, plugins: { legend: { display: !1 } } } });
}

function initNetwork(){
    const a = sessionStorage.getItem('userUid'), b = go.GraphObject.make;
    const c = b(go.Diagram, "networkDiagram", { padding: new go.Margin(150), scrollMode: go.Diagram.InfiniteScroll, layout: b(go.TreeLayout, { angle: 0, layerSpacing: 60, nodeSpacing: 10 }), initialContentAlignment: go.Spot.Center, "undoManager.isEnabled": true });
    c.nodeTemplate = b(go.Node, "Horizontal", { selectionObjectName: "PANEL" }, b(go.Panel, "Auto", { name: "PANEL" }, b(go.Shape, "RoundedRectangle", { fill: "#000", strokeWidth: 1 }, new go.Binding("stroke", "strokeColor")), b(go.TextBlock, { margin: 6, stroke: "#fff", font: "11px sans-serif" }, new go.Binding("text", "label"))), b("TreeExpanderButton", { width: 14, height: 14, "ButtonBorder.stroke": "#D4AF37" }));
    c.linkTemplate = b(go.Link, { routing: go.Link.Orthogonal, corner: 5 }, b(go.Shape, { stroke: "white" }));
    const d = myTeamData.map(x => ({ key: x.uid, label: `${x.uid} / ${x.name}`, strokeColor: getRankLevel(x.uid) >= 1 ? "#ffd700" : "#ffffff" }));
    const e = myTeamData.filter(x => x.upline && x.upline !== "").map(x => ({ from: x.upline, to: x.uid }));
    c.model = new go.GraphLinksModel(d, e);
    const f = c.findNodeForKey(a); if(f) { c.centerRect(f.actualBounds); f.isSelected = !0; }
    window.downloadNetworkImage = function() { const img = c.makeImage({ scale: 2, background: "#000" }); const l = document.createElement("a"); l.href = img.src; l.download = "jaringan.png"; l.click(); }
}

function initList(){
    const body = document.getElementById('membersTableBody'); let h = ''; 
    let sorted = [...myTeamData].sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate));
    sorted.forEach((m, i) => { h += `<tr><td class="col-no">${i+1}</td><td class="col-name">${m.name}</td><td class="col-uid" style="color:var(--gold); font-weight:bold;">${m.uid}</td><td class="col-ref">${m.upline||'-'}</td><td class="col-date">${m.joinDate.toLocaleDateString()}</td></tr>`; });
    body.innerHTML = h;
}

function closeVipModal(){ document.getElementById('vipModal').style.display = 'none'; }
function closeAchieverModal(){ document.getElementById('achieverModal').style.display = 'none'; }
function downloadAchieverData(){ const b = new Blob([achieverTxtContent], {type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'peraih_50.txt'; a.click(); }
function getMonthName(a){ return ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"][a]; }
function logout(){ sessionStorage.clear(); window.location.href='index.html'; }
