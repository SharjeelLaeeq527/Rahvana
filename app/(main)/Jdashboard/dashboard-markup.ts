/* Static shell of the Rahvana dashboard (v71). The engine fills the empty containers. */
export const DASHBOARD_HTML = `<div class="frame" id="fr"><div class="board" id="bd" data-al="banner" data-tr="ticket">
  <section class="card banner">
    <span class="num" id="bn" data-oc="openAlerts()">0</span>
    <div class="bt"><h2 id="bt">All clear</h2><p id="bt-sub">Nothing stopping you now</p></div>
    <div id="bch"></div>
  </section>

  <div class="main">
    <section class="hero">
      <svg class="halo" viewBox="0 0 520 520"><circle cx="260" cy="260" r="258" fill="none" stroke="#14263a12"/></svg>
      <div class="nx" id="nx-bar"><b>next up</b><span id="nx-sub">18 Nov, 9:30 AM · <i id="nxd">22</i> days to interview</span></div>
      <h1 id="hero-title">Prepare for<br><em>interview</em></h1>
      <div class="bs"><button class="btn p g1" id="hero-primary-btn">Start interview prep <span>→</span></button><button class="btn" id="hero-secondary-btn">Interview day guide</button></div>
      <div class="bkc" id="bkc"></div>
      <div class="jl" id="jl" tabindex="0" aria-label="Your journey. Hover steps, click to zoom, arrow keys to move."><svg id="js2"></svg><div class="jt" id="jt"></div></div>
      <svg class="rt" id="rt" viewBox="0 0 500 432"></svg>
      <div class="th" id="th"></div>
    <div class="lyw"><button type="button" class="lyd" id="lyd" hidden>Done</button><button type="button" class="lyb" id="lyb" aria-label="Customise dashboard" aria-expanded="false" title="Customise"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="6" height="6" rx="1.6"/><rect x="11" y="3" width="6" height="4" rx="1.6"/><rect x="11" y="9" width="6" height="8" rx="1.6"/><rect x="3" y="11" width="6" height="6" rx="1.6"/></svg></button><div class="lop" id="lop"><div hidden><div class="eb">Alerts</div><div class="seg" id="s1"><button data-v="banner" class="on">Banner</button><button data-v="panel">Panel</button></div><div class="eb">Tracking</div><div class="seg" id="s2"><button data-v="ticket" class="on">Ticket</button><button data-v="planner">Planner</button></div><div class="eb">Roadmap</div><div class="seg wr" id="s3"><button data-v="line" class="on">Line</button><button data-v="none">None</button><button data-v="wave">Road</button><button data-v="terrain">Terrain</button><button data-v="ribbon">Glass</button></div></div><div class="eb">Show on dashboard</div><div class="lys" id="lys"></div><div class="lyr"><button type="button" id="arb">Arrange</button><button type="button" id="rsb">Reset</button></div></div></div></section>

    <div class="rc">
      <div class="srow" id="srow">
      <section class="card sg" id="sg-card" data-oc="openCaseStrength()" style="cursor:pointer" title="Click to view full Case Health analysis">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px"><div class="eb">Case health & strength</div><span style="font-size:11px;color:var(--t1);font-weight:600">Analysis ›</span></div>
          <div class="sc"><b id="cs-score">66</b><span>out of 100</span><span class="chipx" id="cs-badge" style="margin-left:auto;background:var(--tint);color:var(--t1)">Good</span></div>
          <div class="mt" id="cs-bars"><div><i style="width:100%;background:#e9a3b2"></i></div><div><i style="width:100%;background:#f2c9a0"></i></div><div><i style="width:64%;background:var(--t2)"></i></div><div><i style="width:0"></i></div></div>
          <div class="zl" id="cs-zones"><span>Critical</span><span>Needs attention</span><span class="on">Good</span><span>Excellent</span></div></div>
        <div class="sb" id="sb"></div>
      </section>
      <section class="card qn" id="qn" aria-label="Quick notes">
        <button type="button" class="qn-tab" id="qn-tab" aria-label="Open notes" aria-expanded="false"><span class="qn-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#0d7377" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4.5h10.5L19 8v11.5H5z"/><path d="M8.5 11h7M8.5 14.5h4"/></svg><em id="qn-cnt" hidden></em></span><span class="qn-vt">Notes</span><span class="qn-plus"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>
        <div class="qn-body" id="qn-body"><div class="qn-h"><span class="eb">Notes</span><span class="qn-n" id="qn-n"></span><span style="flex:1"></span><button type="button" class="qn-fold" id="qn-fold" aria-label="Collapse notes" title="Collapse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button></div>
          <div class="qn-in" id="qn-form"><input id="qn-inp" maxlength="200" placeholder="Take a note…" aria-label="Take a note" autocomplete="off"><button type="button" id="qn-send" aria-label="Save note"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V6M6 11l6-6 6 6"/></svg></button></div>
          <div class="qn-rows" id="qn-rows"></div><button type="button" class="qn-more" id="qn-more"></button></div>
      </section>
      </div>

      <div class="mid">
        <section class="card" style="overflow:hidden">
          <div class="tkc" style="height:100%"><div class="tk" id="tk">
            <div class="dt-h" id="tkh"></div>
            <div class="dt-d" id="tkd"></div>
            <div class="dt-ms" id="rl"></div>
            <div class="tknow" id="tkw"></div>
            <div class="dt-f"><div class="dt-r"><span class="ol" id="receipt-label">Received</span><code id="receipt-code">MSC2690123456</code><button class="cp" id="cp">copy</button></div><div class="dt-a"><div class="sw"><input type="checkbox" id="ac" checked><label for="ac" style="display:flex;align-items:center;gap:9px;cursor:pointer"><span class="tg2"></span><span id="al">Auto-check on</span></label></div><span class="mu" id="receipt-updated-label">checked 2h ago</span></div></div>
          </div></div>
          <div class="pl" id="pl"></div>
        </section>
        <div class="rcol">
          <section class="card cl" id="cl"></section>
          <section class="tile" id="tile"></section>
        </div>
      </div>

      <section class="card tb">
        <a class="fd" id="tb-tools" style="background:#e4f3f1"><div class="r1"></div><b>Tools</b><span class="ar">→</span></a>
        <a class="fd" id="tb-guides" style="background:#e6eefa"><div class="r1"></div><b>Guides</b><span class="ar">→</span></a>
        <a class="fd" id="tb-services" style="background:#eee8f6"><div class="r1"></div><b>Services</b><span class="ar">→</span></a>
        <nav class="qa" id="qa"></nav>

      </section>
    </div>
  </div>

  
</div></div>
<div class="sc2" data-oc="closeD()"></div>
<aside class="dr" id="dr"><button class="x" data-oc="closeD()">×</button><div id="drc"></div></aside>`;
