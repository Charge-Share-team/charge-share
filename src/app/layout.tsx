import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VehicleProvider } from '@/context/VehicleContext';
import { AuthProvider } from '@/components/AuthProvider';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChargeShare - EV Social Network",
  description: "Share your charger, grow the community.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <VehicleProvider>
            <div className="shell">

              <div className="bg-fx">
                <div className="orb o1"/><div className="orb o2"/><div className="orb o3"/>
                <div className="grid-lines"/>
              </div>

              <div className="lp">
                <div className="lp-icon">⚡</div>
                <p className="lp-name">Charge<span>.Share</span></p>
                <p className="lp-sub">India's Private EV Network</p>
                <div className="lp-stats">
                  <div className="ls"><span className="lsv">2.4K</span><span className="lsl">Chargers</span></div>
                  <div className="lsd"/>
                  <div className="ls"><span className="lsv">18K</span><span className="lsl">Sessions</span></div>
                  <div className="lsd"/>
                  <div className="ls"><span className="lsv">P2P</span><span className="lsl">Network</span></div>
                </div>
              </div>

              <div className="pw">
                <div className="pf">
                  <div className="pn"/>
                  <div className="ps">{children}</div>
                  <div className="pb"/>
                </div>
              </div>

              <div className="rp">
                <div className="sw">
                  <div className="sky">
                    <div className="moon"/>
                    <div className="cld cl1"/><div className="cld cl2"/><div className="cld cl3"/>
                    <div className="str s1"/><div className="str s2"/><div className="str s3"/>
                    <div className="str s4"/><div className="str s5"/>
                  </div>

                  <svg viewBox="0 0 440 310" className="scene-svg" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.12"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                      </radialGradient>
                      <linearGradient id="beamG" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.38"/>
                      </linearGradient>
                      <filter id="glow"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      <filter id="glow3"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>

                    {/* ── FAR MOUNTAINS ── */}
                    <polygon points="0,178 40,82 84,136 126,54 170,116 214,40 258,104 302,56 346,96 390,62 440,90 440,178" fill="#0a1c0d"/>
                    <polygon points="126,54 143,82 109,82" fill="#c0ead8" opacity="0.42"/>
                    <polygon points="214,40 233,70 195,70" fill="#c0ead8" opacity="0.42"/>
                    <polygon points="302,56 320,84 284,84" fill="#c0ead8" opacity="0.38"/>
                    <polygon points="0,210 34,132 76,180 118,112 162,168 206,100 250,156 294,110 338,148 382,118 440,140 440,210" fill="#061408"/>

                    {/* ── PINE TREES ── */}
                    {Array.from({length:24},(_,i)=>i*19).map((x,i)=>(
                      <g key={i}>
                        <polygon points={`${x},214 ${x+9.5},194 ${x+19},214`} fill="#030a04"/>
                        <polygon points={`${x+2},207 ${x+9.5},188 ${x+17},207`} fill="#040c05"/>
                      </g>
                    ))}

                    {/* ── GHAT ROAD ── */}
                    <path d="M440,144 C412,142 386,146 362,153 C338,160 320,169 304,180 C288,191 274,204 260,217 C246,230 232,243 216,254 C200,265 180,273 156,279 C132,285 102,288 66,289 C42,289 18,289 0,289 L0,302 C18,302 42,302 68,301 C106,300 138,297 164,290 C190,283 211,274 228,262 C245,250 259,236 273,223 C287,210 301,197 316,185 C331,173 348,164 368,157 C390,149 415,147 440,149 Z" fill="#040b05"/>
                    <path d="M440,144 C412,142 386,146 362,153 C338,160 320,169 304,180 C288,191 274,204 260,217 C246,230 232,243 216,254 C200,265 180,273 156,279 C132,285 102,288 66,289" stroke="#10b981" strokeWidth="0.6" opacity="0.09" fill="none"/>
                    <path d="M440,149 C415,147 390,149 368,157 C348,164 331,173 316,185 C301,197 287,210 273,223 C259,236 245,250 228,262 C211,274 190,283 164,290 C138,297 106,300 68,301" stroke="#10b981" strokeWidth="0.6" opacity="0.09" fill="none"/>

                    {/* Road dashes */}
                    {[
                      {x:408,y:145,w:10,a:-3},{x:382,y:149,w:11,a:-6},{x:356,y:155,w:12,a:-10},
                      {x:328,y:163,w:13,a:-14},{x:302,y:173,w:14,a:-18},{x:278,y:185,w:15,a:-22},
                      {x:256,y:199,w:16,a:-26},{x:236,y:213,w:17,a:-28},{x:218,y:228,w:18,a:-26},
                      {x:198,y:242,w:19,a:-22},{x:174,y:254,w:20,a:-16},{x:144,y:264,w:21,a:-9},
                      {x:108,y:272,w:22,a:-4},{x:68,y:279,w:23,a:-1},
                    ].map((d,i)=>(
                      <rect key={i} x={d.x} y={d.y} width={d.w} height={2.5} rx="1.25"
                        fill="#10b981" opacity={0.09+(i*0.004)}
                        transform={`rotate(${d.a},${d.x+d.w/2},${d.y+1.25})`}/>
                    ))}

                    <path d="M440,144 C412,142 386,146 362,153 C338,160 320,169 304,180 C288,191 274,204 260,217 C246,230 232,243 216,254 C200,265 180,273 156,279"
                      stroke="#132b16" strokeWidth="2.2" fill="none" opacity="0.5"/>

                    {/* Valley */}
                    <path d="M0,218 C64,214 136,222 220,218 C304,214 370,218 440,216 L440,310 L0,310Z" fill="#020804"/>
                    <rect x="22" y="230" width="18" height="13" fill="#040c05"/>
                    <polygon points="20,230 42,230 31,219" fill="#030904"/>
                    <rect x="54" y="234" width="22" height="11" fill="#040c05"/>
                    <polygon points="52,234 78,234 65,223" fill="#030904"/>
                    <rect x="148" y="228" width="16" height="15" fill="#050d06"/>
                    <path d="M146,228 Q156,217 166,228Z" fill="#030904"/>

                    {/* ── CHARGER STATION ── */}
                    <rect x="358" y="162" width="26" height="3" rx="1.5" fill="#091808"/>
                    <rect x="364" y="126" width="12" height="38" rx="3" fill="#050d06" stroke="#112411" strokeWidth="0.9"/>
                    <rect x="366" y="131" width="8" height="11" rx="1.5" fill="#081508" stroke="#10b981" strokeWidth="0.65"/>
                    <rect x="367" y="133" width="6" height="1.2" rx="0.5" fill="#10b981" opacity="0.88"/>
                    <rect x="367" y="136" width="4" height="1.2" rx="0.5" fill="#10b981" opacity="0.55"/>
                    <rect x="367" y="139" width="5" height="1.2" rx="0.5" fill="#10b981" opacity="0.65"/>
                    <rect x="366" y="146" width="8" height="5" rx="1.2" fill="#0c1e0e" stroke="#10b981" strokeWidth="0.55"/>
                    <circle cx="369" cy="148.5" r="0.9" fill="#10b981" opacity="0.65"/>
                    <circle cx="372" cy="148.5" r="0.9" fill="#10b981" opacity="0.65"/>
                    <circle cx="370" cy="129" r="1.8" fill="#10b981" className="cs-led"/>
                    <text x="370" y="158" textAnchor="middle" fill="#10b981" fontSize="2.8" fontFamily="monospace" opacity="0.45">CS·01</text>
                    <ellipse cx="371" cy="166" rx="10" ry="3" fill="#10b981" opacity="0.04"/>
                    <rect x="350" y="116" width="40" height="9" rx="2.5" fill="#030a04" stroke="#10b981" strokeWidth="0.5" opacity="0.8"/>
                    <text x="370" y="122.5" textAnchor="middle" fill="#10b981" fontSize="4.2" fontWeight="bold" fontFamily="monospace" opacity="0.72">ChargeShare</text>

                    {/* ════════════════════════════════════════════════════════
                        TATA NEXON EV — Traced from real side-view photo

                        CRITICAL SHAPE OBSERVATIONS from the reference image:
                        ─────────────────────────────────────────────────────
                        1. HOOD: Very short & LOW. Almost no rise from bumper.
                           Hood tip is at about 1/4 of total height.
                        
                        2. A-PILLAR: Steep but NOT vertical. ~75° angle.
                           Transitions directly from short hood to windshield.
                        
                        3. WINDSHIELD: Large, takes up significant roof space.
                           Moderate rake. This is NOT a slab-side SUV windshield.
                        
                        4. ROOF ARC: Peaks at roughly 55-60% of wheelbase.
                           The peak is subtle — not a tall rounded arch.
                           Roof is LOW for a compact SUV.
                        
                        5. C-PILLAR: Steep descent. Creates the coupe-SUV look.
                           Angle ~55°. The rear glass is large.
                        
                        6. REAR DECK: SHORT. Tail is raised slightly.
                           Rear overhang is minimal.
                        
                        7. CLADDING: Thick black plastic below the body line,
                           covering the lower 30% of the doors.
                        
                        8. WHEEL ARCHES: Very pronounced, flared outward.
                           Create a "muscular" look.

                        SVG Coordinate System (viewBox 0 0 440 310):
                        ─────────────────────────────────────────────
                        Ground level:  y = 285
                        Front wheel:   cx=156, cy=285, r=24
                        Rear wheel:    cx=284, cy=285, r=24
                        Wheelbase:     128 units
                        
                        Body starts:   x=122 (front bumper)
                        Body ends:     x=320 (rear bumper)
                        Total length:  198 units
                        
                        Roof peak:     x≈218, y≈198  (57% from front)
                        Hood height:   y≈234 (51 units from ground=285)
                        
                        Car group origin for animation:
                        transform-origin: 220px 262px
                    ════════════════════════════════════════════════════════ */}

                    <g className="car-g">

                      {/* Ground shadow */}
                      <ellipse cx="220" cy="286" rx="108" ry="5" fill="url(#shadowG)"/>

                      {/* ══════════════════════════════════════
                          SEDAN — same geometry as car_test.html
                          translated: dx=+10, dy=+14
                          Ground: y=284
                          Front wheel: cx=160 cy=284 r=20
                          Rear  wheel: cx=280 cy=284 r=20
                          Wheelbase: 120px
                      ══════════════════════════════════════ */}

                      {/* MAIN BODY */}
                      <path d="
                        M 110,284 L 110,272
                        C 110,268 112,265 116,264
                        L 130,262 L 158,254
                        C 162,250 168,244 175,236
                        L 185,224
                        C 190,220 196,218 202,217
                        L 258,217
                        C 265,217 271,220 276,226
                        L 288,242
                        C 292,248 295,254 295,260
                        L 298,264 L 310,266
                        C 315,267 318,270 319,274
                        L 320,284 Z
                      " fill="#0e2212"/>

                      {/* ROOF highlight */}
                      <path d="
                        M 185,224 C 190,220 196,218 202,217
                        L 258,217 C 265,217 271,220 276,226
                        L 280,232
                        C 274,226 268,223 260,222
                        L 200,222 C 194,222 189,225 185,230 Z
                      " fill="#173d1c"/>

                      {/* WINDSHIELD */}
                      <path d="
                        M 158,254 L 175,236
                        C 180,230 186,225 194,222
                        L 200,222 L 200,227
                        C 194,229 189,233 185,239
                        L 172,256 Z
                      " fill="#04100a" stroke="#10b981" strokeWidth="0.7" opacity="0.9"/>
                      <path d="M 170,242 L 185,228 L 190,231 L 175,246 Z" fill="white" opacity="0.04"/>

                      {/* SIDE GLASS */}
                      <path d="
                        M 200,227 L 200,222 L 260,222
                        C 268,222 274,226 280,232
                        L 290,246 L 290,256
                        L 172,256 L 185,239
                        C 189,233 194,229 200,227 Z
                      " fill="#04100a" stroke="#10b981" strokeWidth="0.4" opacity="0.75"/>
                      <path d="M 205,223 L 256,223 L 262,229 L 209,229 Z" fill="white" opacity="0.025"/>

                      {/* B-pillar */}
                      <rect x="228" y="222" width="4" height="34" rx="1" fill="#060d08"/>

                      {/* BODY LOWER */}
                      <rect x="112" y="262" width="206" height="12" rx="2" fill="#0a1b0d"/>
                      {/* sill */}
                      <rect x="113" y="272" width="205" height="8" rx="1.5" fill="#070e08"/>
                      {/* body crease */}
                      <path d="M 113,266 C 160,263 260,262 316,266"
                        stroke="#10b981" strokeWidth="0.7" opacity="0.18" fill="none"/>

                      {/* door gap */}
                      <line x1="228" y1="256" x2="228" y2="278" stroke="#040a06" strokeWidth="1.5"/>

                      {/* door handles */}
                      <rect x="172" y="261" width="14" height="2.5" rx="1.2" fill="#122812"/>
                      <rect x="242" y="261" width="14" height="2.5" rx="1.2" fill="#122812"/>

                      {/* FRONT BUMPER */}
                      <path d="M 110,284 L 110,274 C 110,269 113,266 118,265 L 134,263 L 134,284 Z"
                        fill="#0b1d0e"/>
                      <rect x="111" y="275" width="20" height="8" rx="1.5" fill="#050c06" stroke="#10b981" strokeWidth="0.4"/>
                      <line x1="112" y1="277" x2="130" y2="277" stroke="#10b981" strokeWidth="0.4" opacity="0.3"/>
                      <line x1="112" y1="280" x2="130" y2="280" stroke="#10b981" strokeWidth="0.4" opacity="0.3"/>

                      {/* ══ HEADLIGHT CLUSTER ══ */}
                      {/* housing */}
                      <path d="M 110,251 L 136,246 L 136,271 L 110,273 Z"
                        fill="#050d07" stroke="#0b1c0e" strokeWidth="0.5"/>
                      {/* DRL razor strip */}
                      <path d="M 110,252 L 136,247 L 136,249.5 L 110,254.5 Z"
                        fill="#10b981" opacity="0.97" className="drl" filter="url(#glow)"/>
                      <path d="M 110,252 L 136,247 L 136,248.2 L 110,253.2 Z"
                        fill="white" opacity="0.85"/>
                      {/* L-hook at rear */}
                      <path d="M 132,247 L 136,247 L 136,255 L 132,255 Z"
                        fill="#10b981" opacity="0.85" className="drl" filter="url(#glow)"/>
                      <rect x="132.5" y="247" width="2" height="8" fill="white" opacity="0.5"/>
                      {/* chrome divider */}
                      <line x1="110" y1="255.5" x2="136" y2="251" stroke="#0f2812" strokeWidth="0.8"/>
                      {/* projector housing */}
                      <path d="M 110,257 L 134,253 L 134,271 L 110,273 Z" fill="#060f08"/>
                      <ellipse cx="121" cy="263" rx="9" ry="6" fill="#060e08" stroke="#163320" strokeWidth="1.8"/>
                      <ellipse cx="121" cy="263" rx="7" ry="4.6" fill="#040b06"/>
                      <ellipse cx="121" cy="263" rx="5.2" ry="3.4" fill="#07120a"/>
                      <ellipse cx="121" cy="263" rx="3.6" ry="2.4" fill="#0a1e0d"/>
                      <ellipse cx="120.3" cy="262.3" rx="2.2" ry="1.5" fill="#10b981" opacity="0.28"/>
                      <ellipse cx="119.6" cy="261.5" rx="1" ry="0.7" fill="white" opacity="0.55"/>
                      <ellipse cx="121" cy="263" rx="6" ry="4" fill="none"
                        stroke="#10b981" strokeWidth="0.55" opacity="0.35" className="drl"/>
                      {/* beam */}
                      <path className="hl-beam"
                        d="M 110,252 L 18,229 L 12,276 L 110,273 Z"
                        fill="url(#beamG)" opacity="0"/>

                      {/* REAR BUMPER */}
                      <path d="M 320,284 L 320,274 C 320,269 317,266 312,265 L 296,263 L 296,284 Z"
                        fill="#0b1d0e"/>
                      <rect x="297" y="275" width="20" height="7" rx="1.2" fill="#060d07" stroke="#0c1909" strokeWidth="0.4"/>
                      <line x1="300" y1="277" x2="300" y2="281" stroke="#10b981" strokeWidth="0.4" opacity="0.2"/>
                      <line x1="304" y1="277" x2="304" y2="281" stroke="#10b981" strokeWidth="0.4" opacity="0.2"/>
                      <line x1="308" y1="277" x2="308" y2="281" stroke="#10b981" strokeWidth="0.4" opacity="0.2"/>
                      <line x1="312" y1="277" x2="312" y2="281" stroke="#10b981" strokeWidth="0.4" opacity="0.2"/>

                      {/* ══ TAIL LAMP CLUSTER ══ */}
                      {/* housing */}
                      <path d="M 320,238 L 296,234 L 296,266 L 320,270 Z"
                        fill="#080202" stroke="#150404" strokeWidth="0.5"/>
                      {/* chrome trim */}
                      <path d="M 320,238 L 296,234 L 296,235.5 L 320,239.5 Z"
                        fill="#1a2e1a" opacity="0.6"/>
                      {/* full-width LED strip */}
                      <path d="M 320,239.5 L 296,235.5 L 296,239.5 L 320,243.5 Z"
                        fill="#7f1d1d" opacity="0.9" className="tail-led"/>
                      <path d="M 320,239.5 L 296,235.5 L 296,237 L 320,241 Z"
                        fill="#fca5a5" opacity="0.9" className="tail-led" filter="url(#glow)"/>
                      {/* 3 sequential bars */}
                      <rect x="297" y="244" width="7" height="3.5" rx="1" fill="#991b1b" opacity="0.9" className="tail-s1"/>
                      <rect x="297.3" y="244.3" width="6.4" height="1.8" rx="0.5" fill="#f87171" opacity="0.95"/>
                      <rect x="305.5" y="244" width="7" height="3.5" rx="1" fill="#7f1d1d" opacity="0.8" className="tail-s2"/>
                      <rect x="305.8" y="244.3" width="6.4" height="1.8" rx="0.5" fill="#ef4444" opacity="0.85"/>
                      <rect x="313.5" y="244" width="5.5" height="3.5" rx="1" fill="#6b1919" opacity="0.7" className="tail-s3"/>
                      <rect x="313.8" y="244.3" width="4.9" height="1.8" rx="0.5" fill="#dc2626" opacity="0.75"/>
                      {/* divider */}
                      <line x1="296" y1="248.5" x2="320" y2="252" stroke="#100202" strokeWidth="1.2"/>
                      {/* lower brake bar */}
                      <rect x="297" y="250" width="22" height="4" rx="1.5" fill="#3b0808" opacity="0.9"/>
                      <rect x="297.5" y="250.5" width="21" height="2" rx="0.8" fill="#dc2626" opacity="0.18"/>
                      {/* chrome divider */}
                      <line x1="296" y1="262" x2="320" y2="266" stroke="#162416" strokeWidth="0.9"/>
                      {/* charge port */}
                      <rect x="303" y="254" width="7" height="7" rx="2"
                        fill="#10b981" opacity="0.08" stroke="#10b981" strokeWidth="0.6"
                        className="cport"/>
                      <rect x="304.5" y="255.5" width="4" height="4" rx="1"
                        fill="#10b981" opacity="0.45" className="cport-glow"/>

                      {/* WHEEL ARCHES */}
                      <path d="M 111,284 C 115,272 128,264 160,264 C 192,264 205,272 209,284 Z"
                        fill="#060c07" stroke="#0a1609" strokeWidth="1.8"/>
                      <path d="M 251,284 C 255,272 268,264 280,264 C 312,264 325,272 329,284 Z"
                        fill="#060c07" stroke="#0a1609" strokeWidth="1.8"/>

                      {/* FRONT WHEEL */}
                      <circle cx="160" cy="284" r="20" fill="#020702" stroke="#0b1709" strokeWidth="1.8"/>
                      <circle cx="160" cy="284" r="19" fill="none" stroke="#050a06" strokeWidth="3" strokeDasharray="4 4.8"/>
                      <circle cx="160" cy="284" r="12" fill="#050d06" stroke="#10b981" strokeWidth="0.9"/>
                      <circle cx="160" cy="284" r="7.5" fill="none" stroke="#10b981" strokeWidth="0.35" opacity="0.2"/>
                      <circle cx="160" cy="284" r="3.8" fill="#10b981" opacity="0.55"/>
                      <circle cx="160" cy="284" r="1.5" fill="#020702"/>
                      <g className="spk-f" style={{transformOrigin:"160px 284px"}}>
                        {[0,72,144,216,288].map((a,i)=>(
                          <rect key={i} x="157.8" y="272" width="4.4" height="12" rx="2.2"
                            fill="#10b981" opacity="0.55" transform={`rotate(${a} 160 284)`}/>
                        ))}
                      </g>

                      {/* REAR WHEEL */}
                      <circle cx="280" cy="284" r="20" fill="#020702" stroke="#0b1709" strokeWidth="1.8"/>
                      <circle cx="280" cy="284" r="19" fill="none" stroke="#050a06" strokeWidth="3" strokeDasharray="4 4.8"/>
                      <circle cx="280" cy="284" r="12" fill="#050d06" stroke="#10b981" strokeWidth="0.9"/>
                      <circle cx="280" cy="284" r="7.5" fill="none" stroke="#10b981" strokeWidth="0.35" opacity="0.2"/>
                      <circle cx="280" cy="284" r="3.8" fill="#10b981" opacity="0.55"/>
                      <circle cx="280" cy="284" r="1.5" fill="#020702"/>
                      <g className="spk-r" style={{transformOrigin:"280px 284px"}}>
                        {[0,72,144,216,288].map((a,i)=>(
                          <rect key={i} x="277.8" y="272" width="4.4" height="12" rx="2.2"
                            fill="#10b981" opacity="0.55" transform={`rotate(${a} 280 284)`}/>
                        ))}
                      </g>

                    </g>{/* end car-g */}


                    {/* ── CHARGE CABLE ── */}
                    <path className="cable"
                      d="M 307,258 C 320,248 336,228 346,210 C 354,196 362,182 366,170"
                      stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5 4" fill="none"/>

                    {/* ── ENERGY BOLTS ── */}
                    <g className="bolts">
                      <text x="330" y="218" fill="#10b981" fontSize="11" className="bolt b1">⚡</text>
                      <text x="345" y="203" fill="#10b981" fontSize="9" className="bolt b2">⚡</text>
                      <text x="357" y="191" fill="#10b981" fontSize="7" className="bolt b3">⚡</text>
                    </g>

                    {/* Charge glow on ground */}
                    <ellipse className="chg-glow" cx="220" cy="288" rx="100" ry="6" fill="#10b981" opacity="0"/>

                    {/* Top label */}
                    <text x="220" y="15" textAnchor="middle" fill="#10b981" fontSize="5.5" fontFamily="monospace" letterSpacing="2.5" opacity="0.18" fontWeight="bold">MOUNTAIN GHAT · LIVE SESSION</text>
                    <line x1="30" y1="20" x2="410" y2="20" stroke="#10b981" strokeWidth="0.35" opacity="0.09"/>

                  </svg>

                  <div className="phase-bar">
                    <span className="ph-dot"/>
                    <span className="ph-txt">LIVE CHARGING SESSION</span>
                  </div>
                </div>
                <p className="caption">Peer-to-peer EV charging,<br/>wherever you are.</p>
              </div>

            </div>

            <style>{`
              /* ── MOBILE (default, no phone frame) ── */
              .shell{min-height:100vh;background:#000;display:block;}
              .bg-fx,.lp,.rp,.pn,.pb{display:none;}
              .pw{display:block;width:100%;min-height:100vh;}
              .pf{display:block;width:100%;min-height:100vh;background:#000;border-radius:0;border:none;box-shadow:none;overflow:visible;}
              .ps{display:block;width:100%;min-height:100vh;overflow-y:auto;overflow-x:hidden;}

              @media (min-width:900px){
                body{overflow:hidden;height:100vh;}
                .shell{
                  display:grid;grid-template-columns:1fr 390px 1fr;
                  align-items:center;justify-items:center;
                  width:100vw;height:100vh;background:#020408;
                  position:relative;overflow:hidden;
                }

                /* BG */
                .bg-fx{display:block;position:absolute;inset:0;pointer-events:none;z-index:0;}
                .orb{position:absolute;border-radius:50%;filter:blur(100px);opacity:0.11;animation:orbf 12s ease-in-out infinite;}
                .o1{width:520px;height:520px;background:#10b981;top:-180px;left:-120px;}
                .o2{width:380px;height:380px;background:#3b82f6;bottom:-120px;right:80px;animation-delay:-5s;}
                .o3{width:260px;height:260px;background:#10b981;top:35%;right:-60px;animation-delay:-9s;}
                @keyframes orbf{0%,100%{transform:translate(0,0);}40%{transform:translate(18px,-14px);}70%{transform:translate(-12px,10px);}}
                .grid-lines{position:absolute;inset:0;background-image:linear-gradient(rgba(16,185,129,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.02) 1px,transparent 1px);background-size:48px 48px;}

                /* LEFT */
                .lp{display:flex;flex-direction:column;gap:14px;position:relative;z-index:10;padding:40px 60px 40px 40px;justify-self:end;}
                .lp-icon{width:62px;height:62px;background:#10b981;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 0 36px rgba(16,185,129,0.38);margin-bottom:6px;}
                .lp-name{font-size:36px;font-weight:900;color:white;font-style:italic;text-transform:uppercase;letter-spacing:-0.04em;line-height:1;margin:0;}
                .lp-name span{color:#10b981;}
                .lp-sub{font-size:9.5px;font-weight:700;color:#3f3f46;text-transform:uppercase;letter-spacing:0.22em;margin:4px 0 18px;}
                .lp-stats{display:flex;align-items:center;gap:14px;}
                .ls{display:flex;flex-direction:column;gap:2px;}
                .lsv{font-size:19px;font-weight:900;color:white;font-style:italic;line-height:1;}
                .lsl{font-size:8.5px;font-weight:700;color:#3f3f46;text-transform:uppercase;letter-spacing:0.14em;}
                .lsd{width:1px;height:26px;background:#262626;}

                /* PHONE */
                .pw{display:flex;align-items:center;justify-content:center;position:relative;z-index:10;height:100vh;}
                .pf{display:flex;flex-direction:column;position:relative;width:390px;height:844px;background:#000;border-radius:54px;border:2px solid rgba(255,255,255,0.07);box-shadow:0 0 0 1px rgba(0,0,0,0.6),0 60px 120px rgba(0,0,0,0.92),0 0 80px rgba(16,185,129,0.05),inset 0 1px 0 rgba(255,255,255,0.035);overflow:hidden;}
                .pn{display:block;width:120px;height:33px;background:#000;border-radius:0 0 20px 20px;position:absolute;top:0;left:50%;transform:translateX(-50%);z-index:20;border:1px solid rgba(255,255,255,0.05);border-top:none;}
                .ps{display:block;width:100%;height:100%;overflow-y:auto;overflow-x:hidden;border-radius:54px;scrollbar-width:none;}
                .ps::-webkit-scrollbar{display:none;}
                .ps::-webkit-scrollbar{display:none;}
                .pb{display:block;position:absolute;bottom:10px;width:120px;height:5px;background:rgba(255,255,255,0.17);border-radius:10px;z-index:20;left:50%;transform:translateX(-50%);}

                /* RIGHT */
                .rp{display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:10;padding:40px 40px 40px 60px;justify-self:start;gap:14px;}
                .caption{font-size:10.5px;font-weight:700;color:#1e4428;text-transform:uppercase;letter-spacing:0.13em;text-align:center;line-height:1.8;margin:0;}
                .sw{position:relative;width:400px;height:330px;border-radius:22px;overflow:hidden;border:1px solid rgba(16,185,129,0.07);background:#020c04;box-shadow:0 0 60px rgba(16,185,129,0.04);}
                .scene-svg{position:absolute;top:0;left:0;width:100%;height:100%;}

                /* SKY */
                .sky{position:absolute;top:0;left:0;right:0;height:56%;background:linear-gradient(180deg,#010d04 0%,#021306 50%,#030f05 100%);}
                .moon{position:absolute;top:12px;right:48px;width:21px;height:21px;background:radial-gradient(circle,#10b981 0%,#059669 40%,transparent 70%);border-radius:50%;box-shadow:0 0 14px rgba(16,185,129,0.5),0 0 35px rgba(16,185,129,0.14);animation:moonp 4s ease-in-out infinite;}
                @keyframes moonp{0%,100%{opacity:0.82;}50%{opacity:1;transform:scale(1.08);}}
                .cld{position:absolute;background:rgba(16,185,129,0.025);border-radius:40px;animation:clda 24s linear infinite;}
                .cl1{width:72px;height:12px;top:16px;left:-72px;}.cl2{width:48px;height:9px;top:30px;left:-48px;animation-delay:-10s;}.cl3{width:38px;height:7px;top:8px;left:-38px;animation-delay:-18s;}
                @keyframes clda{from{transform:translateX(0);}to{transform:translateX(490px);}}
                .str{position:absolute;border-radius:50%;background:#10b981;width:1.8px;height:1.8px;animation:stra 3.5s ease-in-out infinite;}
                .s1{top:8px;left:28px;}.s2{top:18px;left:98px;animation-delay:.5s;width:1.3px;height:1.3px;}.s3{top:5px;left:170px;animation-delay:1s;}.s4{top:22px;left:248px;animation-delay:1.6s;width:1.3px;height:1.3px;}.s5{top:11px;left:320px;animation-delay:2.2s;}
                @keyframes stra{0%,100%{opacity:0.42;}50%{opacity:0.06;}}

                /* Station LED */
                .cs-led{animation:ledb 1.2s ease-in-out infinite;filter:drop-shadow(0 0 3px #10b981);}
                @keyframes ledb{0%,100%{opacity:1;}50%{opacity:0.08;}}

                /* DRL */
                /* DRL pulse */
                .drl{animation:drlf 2s ease-in-out infinite;}
                @keyframes drlf{0%,100%{opacity:0.97;}50%{opacity:0.6;}}

                /* Tail LED strip */
                .tail-led{animation:taillf 2.4s ease-in-out infinite;}
                @keyframes taillf{0%,100%{opacity:0.9;}50%{opacity:0.5;}}

                /* Sequential tail segments */
                .tail-s1{animation:seq 1.2s ease-in-out infinite;}
                .tail-s2{animation:seq 1.2s ease-in-out infinite 0.15s;}
                .tail-s3{animation:seq 1.2s ease-in-out infinite 0.3s;}
                @keyframes seq{0%,100%{opacity:0.9;}50%{opacity:0.25;}}

                /* Charge port */
                .cport{animation:cprt 16s linear infinite;}
                @keyframes cprt{0%,27%{opacity:0.07;}33%,70%{opacity:0.9;}74%,100%{opacity:0.07;}}
                .cport-glow{animation:cprg 1.4s ease-in-out infinite;}
                @keyframes cprg{0%,100%{opacity:0.4;}50%{opacity:1;filter:drop-shadow(0 0 3px #10b981);}}

                /* ══════════════════════════════════════
                   CAR ANIMATION — 14-second loop
                   
                   Phase 1 (0–28%):  Drive in from right
                   Phase 2 (28–72%): PARKED at charger — gentle float
                   Phase 3 (72–85%): Drive away to left
                   Phase 4 (85–100%): Invisible reset, hold off-screen
                   
                   Car stops with charging port (rear) aligned to station.
                   transform-origin: 220px 262px (body center)
                ══════════════════════════════════════ */
                .car-g{
                  animation:carA 16s linear infinite;
                  will-change:transform;
                  transform-origin:220px 284px;
                  will-change:transform;
                }
                @keyframes carA{
                  /* Drive in from right — pure horizontal */
                  0%    {transform:translateX(380px);}
                  25%   {transform:translateX(0px);}
                  /* Parked */
                  72%   {transform:translateX(0px);}
                  /* Drive away left */
                  90%   {transform:translateX(-420px);}
                  90.1% {transform:translateX(380px);}
                  100%  {transform:translateX(380px);}
                }

                .spk-f{
                  animation:wSpinF 16s linear infinite;
                  transform-origin:160px 284px;
                }
                .spk-r{
                  animation:wSpinR 16s linear infinite;
                  transform-origin:280px 284px;
                }
                @keyframes wSpinF{
                  /* Spin in sync with drive-in (0→25%) */
                  0%   {transform:rotate(0deg);}
                  25%  {transform:rotate(1440deg);}
                  /* HARD HOLD — parked (25%→72%), wheels dead still */
                  72%  {transform:rotate(1440deg);}
                  /* Spin for drive-away (72%→90%) */
                  90%  {transform:rotate(2880deg);}
                  90.1%{transform:rotate(0deg);}
                  100% {transform:rotate(0deg);}
                }
                @keyframes wSpinR{
                  0%   {transform:rotate(0deg);}
                  25%  {transform:rotate(1440deg);}
                  72%  {transform:rotate(1440deg);}
                  90%  {transform:rotate(2880deg);}
                  90.1%{transform:rotate(0deg);}
                  100% {transform:rotate(0deg);}
                }

                /* Headlight beam — on while driving, off when parked */
                .hl-beam{animation:hlb 16s linear infinite;}
                @keyframes hlb{0%,2%{opacity:0.5;}23%,74%{opacity:0;}77%,88%{opacity:0.5;}90%,100%{opacity:0;}}

                /* Cable — appears once parked, fades when leaving */
                .cable{stroke-dasharray:5 4;animation:cblS 16s linear infinite,cblD 0.55s linear infinite;}
                @keyframes cblS{0%,29%{opacity:0;}34%,68%{opacity:1;}73%,100%{opacity:0;}}
                @keyframes cblD{to{stroke-dashoffset:-18;}}

                /* Bolts — during charging */
                .bolts{animation:bltS 16s linear infinite;}
                @keyframes bltS{0%,36%{opacity:0;}41%,64%{opacity:1;}68%,100%{opacity:0;}}
                .bolt{animation:bltF 1.1s ease-out infinite;}
                .b1{animation-delay:0s;}.b2{animation-delay:0.28s;}.b3{animation-delay:0.56s;}
                @keyframes bltF{0%{transform:translateY(0);opacity:1;}100%{transform:translateY(-14px);opacity:0;}}

                /* Ground glow */
                .chg-glow{animation:chgg 16s linear infinite;}
                @keyframes chgg{0%,38%{opacity:0;}43%,64%{opacity:0.08;}68%,100%{opacity:0;}}

                /* Phase bar */
                .phase-bar{position:absolute;bottom:9px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:7px;z-index:10;}
                .ph-dot{width:6px;height:6px;border-radius:50%;background:#10b981;animation:ledb 1.2s ease-in-out infinite;box-shadow:0 0 8px #10b981;flex-shrink:0;}
                .ph-txt{font-size:7px;font-weight:800;color:#1a3e22;text-transform:uppercase;letter-spacing:0.2em;font-family:monospace;white-space:nowrap;}
              }

              @media (min-width:900px) and (max-width:1200px){.lp{display:none;}.shell{grid-template-columns:390px 1fr;}}
              @media (min-width:900px) and (max-width:1050px){.rp{display:none;}.shell{grid-template-columns:1fr;}}
              /* Mobile — no phone frame, full viewport */
  
            `}</style>

          </VehicleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}