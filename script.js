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

function prepareMyTeamData(){
    const a = sessionStorage.getItem('userUid'), b = globalData.find(b => b.uid === a);
    if(b){ const c = getDownlinesRecursive(a); myTeamData = [b, ...c]; }
}

function getDownlinesRecursive(a){
    let b = []; const c = globalData.filter(b => b.upline === a);
    return c.forEach(a => { b.push(a); b = b.concat(getDownlinesRecursive(a.uid)); }), b;
}

function getRankLevel(a){
    const tm = [globalData.find(m => m.uid === a), ...getDownlinesRecursive(a)];
    const tot = tm.length, dir = globalData.filter(b => b.upline === a).length;
    const v2 = tm.filter(m => m.uid !== a && getRankLevel(m.uid) >= 2).length;
    const v1 = tm.filter(m => m.uid !== a && getRankLevel(m.uid) >= 1).length;
    const tiers = [{l:9,m:3501,rv:2,rl:2},{l:8,m:1601,rv:2,rl:2},{l:7,m:901,rv:2,rl:2},{l:6,m:501,rv:2,rl:2},{l:5,m:351,rv:2,rl:2},{l:4,m:201,rv:2,rl:2},{l:3,m:101,rv:2,rl:2},{l:2,m:31,rv:2,rl:1}];
    for(const t of tiers){ if(tot >= t.m){ let cv = (t.l >= 3) ? v2 : v1; if(cv >= t.rv) return t.l; } }
    return (dir >= 5) ? 1 : 0;
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
    body.innerHTML = '';
    const now = new Date(), msDay = 24*60*60*1000;
    let sorted = [...vipLists[level]].sort((a,b) => new Date(b.joinDate) - new Date(a.joinDate));
    sorted.forEach(m => {
        const jd = new Date(m.joinDate), isNew = (now-jd) < msDay || jd.toDateString() === now.toDateString();
        body.innerHTML += `<div class="v-item ${isNew ? 'new-name-alert' : ''}" style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid #222;">
            <span style="color:#fff;">${m.name} ${isNew ? '🆕' : ''}</span>
            <span style="color:var(--gold); font-family:monospace; font-weight:bold;">${m.uid}</span>
        </div>`;
    });
    document.getElementById('vipModal').style.display = 'flex';
}

/* --- PERBAIKAN TAMPILAN PERAIH 50% (ELEGAN & PROFESIONAL) --- */
function openAchieverModal() {
    const modal = document.getElementById('achieverModal'), body = document.getElementById('achieverBody'), title = document.getElementById('achieverTitle'), btnDl = document.getElementById('btnDlAchiever');
    modal.style.display = 'flex'; body.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Menghitung Performa...</div>';
    
    setTimeout(() => {
        const now = new Date(), d = now.getDate(), m = now.getMonth(), y = now.getFullYear();
        let startP, endP, cutoff, plabel = "";
        if(d <= 15){ 
            let pm = m-1, py = y; if(pm<0){pm=11;py--;} 
            startP=new Date(py,pm,16); endP=new Date(py,pm+1,0,23,59,59); cutoff=new Date(py,pm,16); plabel=`PERIODE 2 (${getMonthName(pm)} ${py})`; 
        } else { 
            startP=new Date(y,m,1); endP=new Date(y,m,15,23,59,59); cutoff=new Date(y,m,1); plabel=`PERIODE 1 (${getMonthName(m)} ${y})`; 
        }
        
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
        if(achs.length === 0) body.innerHTML = '<div style="padding:30px; text-align:center; color:#444;">Tidak ada data peraih.</div>';
        else {
            btnDl.style.display = 'block'; let h = '';
            achs.forEach((a, i) => {
                h += `
                <div class="achiever-card">
                    <div class="achiever-header">
                        <div>
                            <span class="achiever-name">${i+1}. ${a.name}</span>
                            <br><span class="achiever-rank-tag">VIP ${a.rank}</span>
                        </div>
                        <span class="achiever-uid">${a.uid}</span>
                    </div>
                    <div class="achiever-stats-grid">
                        <div class="achiever-stat-box">
                            <span class="stat-lbl">Target</span>
                            <span class="stat-num num-target">${a.target}</span>
                        </div>
                        <div class="achiever-stat-box" style="border-color: #D4AF37;">
                            <span class="stat-lbl" style="color:#D4AF37;">Capaian</span>
                            <span class="stat-num num-actual">${a.actual}</span>
                        </div>
                    </div>
                </div>`;
                achieverTxtContent += `${i+1}. ${a.name} (${a.uid}) | Target: ${a.target} | Capai: ${a.actual}\n`;
            });
            body.innerHTML = h;
        }
    }, 150);
}

// FUNGSI STANDAR LAINNYA
function closeVipModal(){ document.getElementById('vipModal').style.display = 'none'; }
function closeAchieverModal(){ document.getElementById('achieverModal').style.display = 'none'; }
function downloadAchieverData(){ const b = new Blob([achieverTxtContent], {type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'peraih_50.txt'; a.click(); }
function getMonthName(a){ return ["JAN","FEB","MAR","APR","MEI","JUN","JUL","AGU","SEP","OKT","NOV","DES"][a]; }
function doLogin(){ /* kode login asli */ }
function logout(){ sessionStorage.clear(); window.location.href='index.html'; }
function renderChart(){ /* kode chart asli */ }
function calculateMyRank(){ /* kode rank asli */ }
function initList(){ /* kode list asli */ }
function initNetwork(){ /* kode network asli */ }
