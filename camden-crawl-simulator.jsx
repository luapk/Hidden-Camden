import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   CAMDEN CRAWL — core loop simulator
   Walk → geofence unlock → story → bank reward → paywall → redeem
   Design: pub-dark ink, gig-ticket paper, Camden red, brass.
   Signature element: the tear-off pint stub with live countdown.
   ============================================================ */

const STOPS = [
  {
    id: "we",
    n: "01",
    name: "The World's End & The Underworld",
    sub: "The witch's corner",
    walk: 60,
    runtime: "2:00",
    free: true,
    reward: { label: "House pint", window: "12:00–17:00 daily", sponsor: "Guinness · funded serve" },
    excerpt:
      "Before the bands, before the market, there was a cottage on this corner and a woman called Jinny Bingham. The locals called her Mother Damnable, and they gave her a wide berth. Partly manners. Mostly because the men in her life kept dying...",
  },
  {
    id: "eb",
    n: "02",
    name: "Electric Ballroom",
    sub: "The boxer's ballroom",
    walk: 140,
    runtime: "2:15",
    free: true,
    reward: { label: "Club-night drink voucher", window: "Thu–Sat after 19:00", sponsor: "Venue partner" },
    excerpt:
      "Then the war came, and the Luftwaffe bombed the terrace next door. Most people saw tragedy. Bill Fuller saw site clearance. He bought the rubble, knocked through, and built a two-thousand-capacity ballroom where Irish London came to dance...",
  },
  {
    id: "jc",
    n: "03",
    name: "Jazz Café",
    sub: "The small room for giants",
    walk: 260,
    runtime: "1:45",
    free: false,
    reward: { label: "Tanqueray & tonic", window: "19:00–20:00 doors hour", sponsor: "Tanqueray · funded serve" },
    excerpt:
      "Take the artists who fill arenas, and put them in a room where the back row is closer than the front row anywhere else. In 1995 a young singer from Virginia called D'Angelo taped a run of nights here, and that recording got passed around like contraband...",
  },
  {
    id: "dc",
    n: "04",
    name: "The Dublin Castle",
    sub: "The lie about jazz",
    walk: 290,
    runtime: "2:20",
    free: false,
    hasGig: true,
    reward: { label: "Pint of Guinness", window: "12:00–18:00 daily", sponsor: "Guinness · funded serve" },
    excerpt:
      "January 1979. Seven young men walk in and tell the landlord they're a jazz band. Alo thinks: jazz, lovely, respectable. Friday night comes, and a wall of skinheads turns up at his door. The band was Madness. The crowd was great...",
  },
  {
    id: "gm",
    n: "05",
    name: "The Good Mixer",
    sub: "Britpop's living room",
    walk: 210,
    runtime: "2:00",
    free: false,
    reward: { label: "Pint + free rack of pool", window: "Mon–Thu 12:00–17:00", sponsor: "Venue partner" },
    excerpt:
      "For about five years in the 1990s, this little boozer was the centre of the British music industry, and the pool table behind that window was the most influential piece of furniture in the country...",
  },
  {
    id: "ha",
    n: "06",
    name: "The Hawley Arms",
    sub: "The hiding place",
    walk: 330,
    runtime: "2:15",
    free: false,
    reward: { label: "House pint", window: "Mon–Thu 12:00–17:00", sponsor: "Venue partner" },
    excerpt:
      "She didn't come here to be seen. She came here to disappear. And when even sitting at the bar got complicated, she did the most Amy thing imaginable: she got up, walked round, and started serving...",
  },
  {
    id: "dw",
    n: "07",
    name: "Dingwalls",
    sub: "The night punk went overground",
    walk: 180,
    runtime: "2:15",
    free: false,
    finale: true,
    reward: { label: "Terrace pint + enamel pin", window: "Before 18:00 daily", sponsor: "Completion reward" },
    excerpt:
      "The queue outside Dingwalls on 5 July 1976 was the most important guest list ever assembled: the Sex Pistols. The Clash. The Damned. Chrissie Hynde. All unknown, all broke, all here, sitting on the bonnets of parked cars like a gang in a western...",
  },
];

const GEOFENCE = 40; // metres
const PAYWALL_AT = 120; // link audio cuts here on the walk to stop 3

const css = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Courier+Prime:wght@400;700&display=swap');

.cc-root{min-height:100vh;background:#0d0b09;display:flex;align-items:center;justify-content:center;padding:24px 12px;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;}
.cc-stage{width:100%;max-width:420px;}
.cc-phone{background:#161210;border-radius:34px;border:1px solid #2c241e;box-shadow:0 30px 80px rgba(0,0,0,.7);overflow:hidden;position:relative;height:760px;display:flex;flex-direction:column;}
.cc-demo{color:#5d534a;font-family:'Courier Prime',monospace;font-size:11px;text-align:center;margin-top:10px;letter-spacing:.08em;}

.cc-head{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 12px;border-bottom:1px solid #2c241e;}
.cc-brand{font-family:'Anton',sans-serif;font-size:18px;letter-spacing:.06em;color:#EFE7D6;}
.cc-brand em{font-style:normal;color:#D8432F;}
.cc-wallet-btn{background:none;border:1px solid #3a312a;color:#C9933C;font-family:'Courier Prime',monospace;font-size:12px;padding:6px 10px;border-radius:4px;cursor:pointer;}
.cc-wallet-btn:focus-visible{outline:2px solid #C9933C;outline-offset:2px;}

.cc-body{flex:1;overflow-y:auto;padding:16px 18px 90px;}

/* setlist */
.cc-tourtitle{font-family:'Anton',sans-serif;color:#EFE7D6;font-size:26px;line-height:1.05;text-transform:uppercase;margin:6px 0 2px;}
.cc-toursub{color:#8A8077;font-size:13px;margin-bottom:16px;}
.cc-stop{display:flex;gap:12px;padding:13px 0;border-bottom:1px dashed #2c241e;align-items:center;}
.cc-stop-n{font-family:'Anton',sans-serif;font-size:20px;width:34px;flex-shrink:0;text-align:center;}
.cc-stop-n.lock{color:#4a403a;} .cc-stop-n.open{color:#D8432F;} .cc-stop-n.next{color:#C9933C;}
.cc-stop-info{flex:1;min-width:0;}
.cc-stop-name{font-size:14px;font-weight:600;color:#EFE7D6;}
.cc-stop-name.lockt{color:#6b6157;}
.cc-stop-meta{font-family:'Courier Prime',monospace;font-size:11px;color:#8A8077;margin-top:2px;}
.cc-tag{font-family:'Courier Prime',monospace;font-size:10px;padding:2px 6px;border-radius:3px;flex-shrink:0;}
.cc-tag.done{background:#21301f;color:#9CCB8E;}
.cc-tag.free{background:#2c241e;color:#C9933C;}
.cc-tag.paid{background:#2c241e;color:#6b6157;}

/* footer walk bar */
.cc-foot{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(22,18,16,0),#161210 30%);padding:22px 18px 20px;}
.cc-dist{font-family:'Courier Prime',monospace;color:#C9933C;font-size:12px;text-align:center;margin-bottom:8px;letter-spacing:.05em;}
.cc-walk{width:100%;background:#D8432F;color:#F6EEDF;border:none;border-radius:8px;font-family:'Anton',sans-serif;font-size:18px;letter-spacing:.08em;padding:14px;cursor:pointer;text-transform:uppercase;}
.cc-walk:disabled{background:#3a312a;color:#6b6157;cursor:default;}
.cc-walk:focus-visible{outline:2px solid #EFE7D6;outline-offset:2px;}

/* unlock takeover */
.cc-unlock{position:absolute;inset:0;background:#D8432F;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;animation:ccflash .25s ease-out;z-index:30;}
@keyframes ccflash{0%{background:#F6EEDF;}100%{background:#D8432F;}}
.cc-unlock-eyebrow{font-family:'Courier Prime',monospace;color:#F6EEDF;font-size:12px;letter-spacing:.3em;margin-bottom:14px;}
.cc-unlock-name{font-family:'Anton',sans-serif;color:#161210;font-size:42px;line-height:.98;text-transform:uppercase;}
@media (prefers-reduced-motion: reduce){.cc-unlock{animation:none;}}

/* story */
.cc-eyebrow{font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.25em;color:#D8432F;margin:8px 0 6px;}
.cc-story-name{font-family:'Anton',sans-serif;font-size:32px;line-height:1;color:#EFE7D6;text-transform:uppercase;margin-bottom:4px;}
.cc-story-sub{color:#8A8077;font-size:13px;margin-bottom:18px;}
.cc-audio{border:1px solid #3a312a;border-radius:8px;padding:14px;margin-bottom:18px;}
.cc-audio-row{display:flex;justify-content:space-between;font-family:'Courier Prime',monospace;font-size:11px;color:#8A8077;margin-bottom:8px;}
.cc-bar{height:4px;background:#2c241e;border-radius:2px;overflow:hidden;}
.cc-bar i{display:block;height:100%;background:#C9933C;border-radius:2px;transition:width .25s linear;}
.cc-transcript{color:#cfc4b2;font-size:14px;line-height:1.65;}
.cc-banked{margin-top:18px;border:1px solid #C9933C;background:#1d1813;border-radius:8px;padding:14px;}
.cc-banked-h{font-family:'Courier Prime',monospace;color:#C9933C;font-size:11px;letter-spacing:.2em;margin-bottom:4px;}
.cc-banked-t{color:#EFE7D6;font-weight:600;font-size:15px;}
.cc-banked-w{font-family:'Courier Prime',monospace;color:#8A8077;font-size:11px;margin-top:3px;}
.cc-gig{margin-top:10px;display:flex;align-items:center;justify-content:space-between;border:1px dashed #3a312a;border-radius:8px;padding:10px 12px;}
.cc-gig span{color:#cfc4b2;font-size:12.5px;}
.cc-gig button{background:#2c241e;border:none;color:#C9933C;font-family:'Courier Prime',monospace;font-size:12px;padding:7px 10px;border-radius:4px;cursor:pointer;}
.cc-cta{width:100%;margin-top:18px;background:#EFE7D6;color:#161210;border:none;border-radius:8px;font-family:'Anton',sans-serif;font-size:16px;letter-spacing:.06em;padding:13px;cursor:pointer;text-transform:uppercase;}

/* paywall */
.cc-pay{position:absolute;inset:0;background:#161210;z-index:25;display:flex;flex-direction:column;justify-content:center;padding:30px;text-align:left;}
.cc-pay-cut{font-family:'Courier Prime',monospace;color:#8A8077;font-size:12px;margin-bottom:18px;}
.cc-pay-line{font-family:'Anton',sans-serif;color:#EFE7D6;font-size:34px;line-height:1.04;text-transform:uppercase;}
.cc-pay-line em{font-style:normal;color:#D8432F;}
.cc-pay-sub{color:#8A8077;font-size:14px;line-height:1.6;margin:16px 0 26px;}
.cc-pay-btn{background:#D8432F;color:#F6EEDF;border:none;border-radius:8px;font-family:'Anton',sans-serif;font-size:18px;padding:15px;letter-spacing:.06em;cursor:pointer;text-transform:uppercase;}
.cc-pay-skip{background:none;border:none;color:#6b6157;font-size:12px;margin-top:14px;cursor:pointer;text-decoration:underline;}

/* wallet & ticket — the paper world */
.cc-stub{background:#F0E6D2;border-radius:6px;padding:14px 16px;margin-bottom:12px;color:#161210;position:relative;cursor:pointer;border:none;width:100%;text-align:left;box-shadow:0 4px 14px rgba(0,0,0,.45);}
.cc-stub:before{content:"";position:absolute;left:-7px;top:50%;width:14px;height:14px;border-radius:50%;background:#161210;transform:translateY(-50%);}
.cc-stub:after{content:"";position:absolute;right:-7px;top:50%;width:14px;height:14px;border-radius:50%;background:#161210;transform:translateY(-50%);}
.cc-stub-h{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.25em;color:#a3431f;margin-bottom:3px;}
.cc-stub-t{font-family:'Anton',sans-serif;font-size:18px;text-transform:uppercase;line-height:1.05;}
.cc-stub-w{font-family:'Courier Prime',monospace;font-size:11px;color:#6b5c44;margin-top:4px;}
.cc-stub.dead{opacity:.45;cursor:default;}
.cc-ticket{background:#F0E6D2;border-radius:8px;padding:22px 20px;color:#161210;position:relative;box-shadow:0 10px 30px rgba(0,0,0,.55);}
.cc-ticket-perf{border-top:2px dashed #b9a883;margin:16px -20px;}
.cc-code{font-family:'Courier Prime',monospace;font-weight:700;font-size:44px;letter-spacing:.18em;text-align:center;margin:6px 0 2px;}
.cc-countbar{height:8px;background:#d8c9a8;border-radius:4px;overflow:hidden;margin:14px 0 6px;}
.cc-countbar i{display:block;height:100%;background:#D8432F;}
.cc-count-l{font-family:'Courier Prime',monospace;font-size:11px;color:#6b5c44;text-align:center;}
.cc-tear{width:100%;background:#161210;color:#F0E6D2;border:none;border-radius:6px;font-family:'Anton',sans-serif;font-size:15px;letter-spacing:.08em;padding:13px;cursor:pointer;text-transform:uppercase;margin-top:14px;}
.cc-back{background:none;border:none;color:#8A8077;font-size:13px;cursor:pointer;padding:0;margin-bottom:14px;}
.cc-redeemed{font-family:'Anton',sans-serif;color:#21301f;background:#9CCB8E;display:inline-block;padding:6px 14px;border-radius:4px;font-size:16px;text-transform:uppercase;letter-spacing:.06em;transform:rotate(-4deg);}
.cc-finale{border:1px solid #C9933C;border-radius:8px;padding:18px;margin-top:16px;text-align:center;}
.cc-finale h3{font-family:'Anton',sans-serif;color:#C9933C;font-size:22px;text-transform:uppercase;margin:0 0 6px;}
.cc-finale p{color:#cfc4b2;font-size:13px;line-height:1.6;margin:0;}
`;

function makeCode() {
  const a = "ACDEFHJKMNPRTWXY";
  let c = "";
  for (let i = 0; i < 4; i++) c += a[Math.floor(Math.random() * a.length)];
  return c;
}

export default function CamdenCrawl() {
  const [screen, setScreen] = useState("tour"); // tour | story | wallet | redeem
  const [idx, setIdx] = useState(0); // next stop to unlock
  const [dist, setDist] = useState(STOPS[0].walk);
  const [walking, setWalking] = useState(false);
  const [unlocking, setUnlocking] = useState(null); // stop during takeover
  const [active, setActive] = useState(null); // stop in story view
  const [audioPct, setAudioPct] = useState(0);
  const [banked, setBanked] = useState([]);
  const [redeemed, setRedeemed] = useState([]);
  const [purchased, setPurchased] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [gigAdded, setGigAdded] = useState(false);
  const [ticket, setTicket] = useState(null); // {stop, code, secs}
  const walkRef = useRef(null);
  const audioRef = useRef(null);
  const tickRef = useRef(null);

  const stopWalking = useCallback(() => {
    if (walkRef.current) clearInterval(walkRef.current);
    walkRef.current = null;
    setWalking(false);
  }, []);

  // walking simulation
  useEffect(() => {
    if (!walking) return;
    walkRef.current = setInterval(() => {
      setDist((d) => {
        const nd = Math.max(0, d - 14);
        // paywall interrupt on the walk to stop 3
        if (idx === 2 && !purchased && nd <= PAYWALL_AT) {
          stopWalking();
          setPaywall(true);
          return nd;
        }
        if (nd <= GEOFENCE) {
          stopWalking();
          const s = STOPS[idx];
          setUnlocking(s);
          setTimeout(() => {
            setUnlocking(null);
            setActive(s);
            setAudioPct(0);
            setScreen("story");
          }, 1300);
          return nd;
        }
        return nd;
      });
    }, 200);
    return () => walkRef.current && clearInterval(walkRef.current);
  }, [walking, idx, purchased, stopWalking]);

  // demo audio playback (compressed)
  useEffect(() => {
    if (screen !== "story" || !active) return;
    setAudioPct(0);
    audioRef.current = setInterval(() => {
      setAudioPct((p) => {
        if (p >= 100) {
          clearInterval(audioRef.current);
          return 100;
        }
        return p + 1.6;
      });
    }, 110);
    return () => audioRef.current && clearInterval(audioRef.current);
  }, [screen, active]);

  // bank on completion
  useEffect(() => {
    if (audioPct >= 100 && active && !banked.includes(active.id)) {
      setBanked((b) => [...b, active.id]);
    }
  }, [audioPct, active, banked]);

  // redeem countdown
  useEffect(() => {
    if (!ticket || ticket.secs <= 0) return;
    tickRef.current = setTimeout(() => setTicket((t) => (t ? { ...t, secs: t.secs - 1 } : t)), 1000);
    return () => clearTimeout(tickRef.current);
  }, [ticket]);

  const continueWalk = () => {
    const done = active;
    setActive(null);
    setScreen("tour");
    const nextIdx = STOPS.indexOf(done) + 1;
    setIdx(nextIdx);
    if (nextIdx < STOPS.length) setDist(STOPS[nextIdx].walk);
  };

  const startRedeem = (stop) => {
    setTicket({ stop, code: makeCode(), secs: 60, torn: false });
    setScreen("redeem");
  };

  const reset = () => {
    stopWalking();
    setScreen("tour"); setIdx(0); setDist(STOPS[0].walk); setUnlocking(null);
    setActive(null); setAudioPct(0); setBanked([]); setRedeemed([]);
    setPurchased(false); setPaywall(false); setGigAdded(false); setTicket(null);
  };

  const allDone = idx >= STOPS.length;
  const nextStop = STOPS[idx];
  const unlockedCount = banked.length;

  return (
    <div className="cc-root">
      <style>{css}</style>
      <div className="cc-stage">
        <div className="cc-phone">
          {/* header */}
          <div className="cc-head">
            <div className="cc-brand">CAMDEN <em>CRAWL</em></div>
            <button className="cc-wallet-btn" onClick={() => setScreen(screen === "wallet" ? "tour" : "wallet")}>
              {screen === "wallet" ? "BACK TO TOUR" : `WALLET · ${unlockedCount - redeemed.length}`}
            </button>
          </div>

          {/* body */}
          <div className="cc-body">
            {screen === "tour" && (
              <>
                <div className="cc-eyebrow">ONE HOUR · SEVEN ROOMS</div>
                <div className="cc-tourtitle">The Hour That Made British Music</div>
                <div className="cc-toursub">Stories stay locked until your feet unlock them.</div>
                {STOPS.map((s, i) => {
                  const done = banked.includes(s.id);
                  const isNext = i === idx;
                  return (
                    <div className="cc-stop" key={s.id}>
                      <div className={"cc-stop-n " + (done ? "open" : isNext ? "next" : "lock")}>
                        {done ? s.n : isNext ? s.n : "▮"}
                      </div>
                      <div className="cc-stop-info">
                        <div className={"cc-stop-name" + (done || isNext ? "" : " lockt")}>
                          {done || isNext ? s.name : "Locked until you arrive"}
                        </div>
                        <div className="cc-stop-meta">
                          {done ? `${s.sub} · played` : isNext ? `${s.runtime} story · ${s.reward.label}` : `Stop ${s.n}`}
                        </div>
                      </div>
                      <span className={"cc-tag " + (done ? "done" : s.free ? "free" : "paid")}>
                        {done ? "UNLOCKED" : s.free ? "FREE" : purchased ? "PAID" : "£"}
                      </span>
                    </div>
                  );
                })}
                {allDone && (
                  <div className="cc-finale">
                    <h3>Tour complete</h3>
                    <p>A witch, a boxer, a lie about jazz, a pool table, a hiding place, and the night punk went overground. Your pin is waiting at Dingwalls. Wear it somewhere people will ask.</p>
                  </div>
                )}
              </>
            )}

            {screen === "story" && active && (
              <>
                <div className="cc-eyebrow">STOP {active.n} · UNLOCKED</div>
                <div className="cc-story-name">{active.name}</div>
                <div className="cc-story-sub">{active.sub}</div>
                <div className="cc-audio">
                  <div className="cc-audio-row">
                    <span>▶ NOW PLAYING</span>
                    <span>{active.runtime} · compressed for demo</span>
                  </div>
                  <div className="cc-bar"><i style={{ width: `${Math.min(100, audioPct)}%` }} /></div>
                </div>
                <div className="cc-transcript">{active.excerpt}</div>

                {audioPct >= 100 && (
                  <div className="cc-banked">
                    <div className="cc-banked-h">REWARD BANKED</div>
                    <div className="cc-banked-t">{active.reward.label}</div>
                    <div className="cc-banked-w">{active.reward.window} · {active.reward.sponsor} · valid 7 days</div>
                    {active.hasGig && (
                      <div className="cc-gig">
                        <span>Tonight in the back room: 4 bands, £7</span>
                        <button onClick={() => setGigAdded(true)}>{gigAdded ? "ADDED ✓" : "ADD TICKET"}</button>
                      </div>
                    )}
                  </div>
                )}
                {audioPct >= 100 && (
                  <button className="cc-cta" onClick={continueWalk}>
                    {active.finale ? "Finish the tour" : "Continue the walk"}
                  </button>
                )}
              </>
            )}

            {screen === "wallet" && (
              <>
                <div className="cc-eyebrow">YOUR ROUND</div>
                <div className="cc-tourtitle" style={{ fontSize: 24, marginBottom: 14 }}>Banked rewards</div>
                {unlockedCount === 0 && (
                  <div className="cc-toursub">Nothing yet. Drinks land here as you unlock venues. They keep for 7 days, so the tour stays an hour and the pints stay yours.</div>
                )}
                {STOPS.filter((s) => banked.includes(s.id)).map((s) => {
                  const used = redeemed.includes(s.id);
                  return (
                    <button key={s.id} className={"cc-stub" + (used ? " dead" : "")} disabled={used} onClick={() => startRedeem(s)}>
                      <div className="cc-stub-h">{used ? "REDEEMED" : "TAP AT THE BAR TO REDEEM"}</div>
                      <div className="cc-stub-t">{s.reward.label}</div>
                      <div className="cc-stub-w">{s.name} · {s.reward.window}</div>
                    </button>
                  );
                })}
              </>
            )}

            {screen === "redeem" && ticket && (
              <>
                <button className="cc-back" onClick={() => { setTicket(null); setScreen("wallet"); }}>← Back to wallet</button>
                <div className="cc-ticket">
                  <div className="cc-stub-h">{ticket.stop.name.toUpperCase()}</div>
                  <div className="cc-stub-t" style={{ fontSize: 24 }}>{ticket.stop.reward.label}</div>
                  <div className="cc-stub-w">{ticket.stop.reward.sponsor}</div>
                  <div className="cc-ticket-perf" />
                  {!ticket.torn && ticket.secs > 0 && (
                    <>
                      <div className="cc-stub-h" style={{ textAlign: "center" }}>SHOW THIS SCREEN, NOT A SCREENSHOT</div>
                      <div className="cc-code">{ticket.code}</div>
                      <div className="cc-countbar"><i style={{ width: `${(ticket.secs / 60) * 100}%` }} /></div>
                      <div className="cc-count-l">live for {ticket.secs}s · code dies, drink doesn't — reopen any time</div>
                      <button className="cc-tear" onClick={() => { setTicket((t) => ({ ...t, torn: true })); setRedeemed((r) => [...r, ticket.stop.id]); }}>
                        STAFF: TEAR HERE
                      </button>
                    </>
                  )}
                  {!ticket.torn && ticket.secs <= 0 && (
                    <>
                      <div className="cc-count-l" style={{ margin: "10px 0" }}>Code expired. Your drink is still banked.</div>
                      <button className="cc-tear" onClick={() => setTicket({ ...ticket, code: makeCode(), secs: 60 })}>GET A FRESH CODE</button>
                    </>
                  )}
                  {ticket.torn && (
                    <div style={{ textAlign: "center", padding: "10px 0" }}>
                      <span className="cc-redeemed">Poured ✓</span>
                      <div className="cc-count-l" style={{ marginTop: 12 }}>Logged · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · billed to sponsor</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* unlock takeover */}
          {unlocking && (
            <div className="cc-unlock">
              <div className="cc-unlock-eyebrow">YOU'VE ARRIVED · STOP {unlocking.n}</div>
              <div className="cc-unlock-name">{unlocking.name}</div>
            </div>
          )}

          {/* paywall */}
          {paywall && (
            <div className="cc-pay">
              <div className="cc-pay-cut">[ audio stopped mid-story · 200m from the Dublin Castle ]</div>
              <div className="cc-pay-line">FIVE STOPS. FOUR DRINKS. <em>ONE LIE.</em></div>
              <div className="cc-pay-sub">
                In 1979, seven young men told a landlord on this road a lie that invented British pop.
                Hear the rest for £4.99 — less than the pint already in your pocket.
              </div>
              <button className="cc-pay-btn" onClick={() => { setPurchased(true); setPaywall(false); }}>
                Unlock the last five
              </button>
              <button className="cc-pay-skip" onClick={() => setPaywall(false)}>Not now — keep my free drinks</button>
            </div>
          )}

          {/* walk bar */}
          {screen === "tour" && !allDone && !paywall && (
            <div className="cc-foot">
              <div className="cc-dist">
                {idx === 2 && !purchased && dist <= PAYWALL_AT
                  ? "STORY LOCKED AHEAD"
                  : `NEXT: ${nextStop.name.toUpperCase()} · ${dist}m`}
              </div>
              <button
                className="cc-walk"
                disabled={walking}
                onClick={() => {
                  if (idx === 2 && !purchased && dist <= PAYWALL_AT) { setPaywall(true); return; }
                  setWalking(true);
                }}
              >
                {walking ? "Walking…" : "Walk (simulates GPS)"}
              </button>
            </div>
          )}
        </div>
        <div className="cc-demo">
          DEMO · geofence fires at {GEOFENCE}m · audio compressed ·{" "}
          <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={reset}>reset</span>
        </div>
      </div>
    </div>
  );
}
