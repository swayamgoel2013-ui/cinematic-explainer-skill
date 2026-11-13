import React, { useId } from "react";

/** Original dimensional SVG artwork for scientific explainers. All motion is a pure function of t. */
export const WATERLINE = {
  night: "#04131F",
  ink: "#081E2A",
  navy: "#102E41",
  slate: "#32566C",
  steel: "#9DB6C3",
  silver: "#DBE9EE",
  cyan: "#7EDFE8",
  water: "#1E8299",
  rust: "#AE4A39",
  coral: "#EB7757",
  amber: "#F7BC7B",
  ivory: "#EEF3EF",
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  n = clamp(n);
  return n * n * (3 - 2 * n);
};
const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
const useSvgId = (name: string) =>
  `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

export type HeroShipProps = {
  /** x/y place the ship's deck origin; hull occupies local y=−45…186. */
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  t?: number;
  /** 0…1 brings three containers down onto the center stack, in sequence. */
  load?: number;
  /** Optional gentle roll/bob, in local pixels. Set 0 for measured comparisons. */
  bob?: number;
  wake?: boolean;
  opacity?: number;
  name?: string;
  /** 0…1 scans open the existing hull's near side, preserving deck and cargo. */
  cutaway?: number;
  /** Virtual annotation of excluded volume, clipped below waterlineY. */
  displaced?: number;
  /** Horizontal water level in LOCAL ship coordinates; default 100. */
  waterlineY?: number;
  dryLabel?: boolean;
};

function CargoBox({
  x,
  y,
  w = 126,
  h = 52,
  d = 34,
  color = "#517F8C",
  top = "#77A0A9",
  side = "#315B68",
  opacity = 1,
}: any) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <path
        d={`M0 0 L${d} ${-d * 0.66} H${w + d} L${w} 0Z`}
        fill={top}
        stroke="#0A2633"
        strokeWidth={1.5}
      />
      <path
        d={`M${w} 0 L${w + d} ${-d * 0.66} V${h - d * 0.66} L${w} ${h}Z`}
        fill={side}
        stroke="#092331"
        strokeWidth={1.5}
      />
      <rect
        width={w}
        height={h}
        fill={color}
        stroke="#092331"
        strokeWidth={1.8}
      />
      {Array.from({ length: 9 }, (_, j) => (
        <g key={j}>
          <path
            d={`M${9 + j * 13.3} 5 V${h - 5}`}
            stroke="#061B27"
            strokeOpacity={0.34}
            strokeWidth={3}
          />
          <path
            d={`M${11 + j * 13.3} 5 V${h - 5}`}
            stroke="#D5E8E7"
            strokeOpacity={0.25}
            strokeWidth={1}
          />
        </g>
      ))}
      <path
        d={`M1 2 H${w - 1}`}
        stroke="#EFF6EE"
        strokeOpacity={0.38}
        strokeWidth={2}
      />
      <path
        d={`M${w - 17} 5 V${h - 5} M${w - 7} 5 V${h - 5}`}
        stroke="#D5E0D6"
        strokeOpacity={0.5}
        strokeWidth={1}
      />
      <rect
        x={9}
        y={h - 13}
        width={23}
        height={6}
        fill="#E5EADE"
        fillOpacity={0.5}
      />
      <path
        d={`M${w + 5} -3 l${d - 9} ${-(d - 9) * 0.66}`}
        stroke="#D9E7E3"
        strokeOpacity={0.25}
      />
    </g>
  );
}

export function HeroShip({
  x = 540,
  y = 1000,
  scale = 1,
  rotation = 0,
  t = 0,
  load = 0,
  bob = 0,
  wake = true,
  opacity = 1,
  name = "",
  cutaway = 0,
  displaced = 0,
  waterlineY = 100,
  dryLabel = false,
}: HeroShipProps) {
  const id = useSvgId("hero-ship");
  const lift = Math.sin(t * 1.35) * bob;
  const roll = Math.sin(t * 0.93) * bob * 0.035;
  const hull =
    "M-455 -31 L312 -31 L508 -111 L427 100 Q406 158 329 176 L-326 184 Q-391 174 -424 99Z";
  const cavity =
    "M-439 -17 L309 -17 L484 -89 L412 94 Q392 143 326 160 L-324 168 Q-379 158 -409 94Z";
  const cut = clamp(cutaway),
    volume = clamp(displaced);
  const cargoColors = [
    ["#3E6574", "#698D99", "#284956"],
    ["#B56C49", "#DC966B", "#76452E"],
    ["#92A58A", "#B6C4AC", "#61715B"],
  ];
  return (
    <g
      transform={`translate(${x} ${y + lift}) rotate(${rotation + roll}) scale(${scale})`}
      opacity={opacity}
    >
      <defs>
        <linearGradient id={`${id}-hull`} x1="0" x2=".23" y1="0" y2="1">
          <stop stopColor="#668194" />
          <stop offset=".18" stopColor="#365D76" />
          <stop offset=".55" stopColor="#183B55" />
          <stop offset="1" stopColor="#061A29" />
        </linearGradient>
        <linearGradient id={`${id}-red`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#CC745C" />
          <stop offset=".45" stopColor="#9F493A" />
          <stop offset="1" stopColor="#51262A" />
        </linearGradient>
        <linearGradient id={`${id}-deck`} x1="0" y1="0" x2="1" y2=".8">
          <stop stopColor="#BDC8C7" />
          <stop offset=".5" stopColor="#738F98" />
          <stop offset="1" stopColor="#3F6275" />
        </linearGradient>
        <linearGradient id={`${id}-bridge`} x1="0" y1="0" x2="1" y2=".3">
          <stop stopColor="#E7ECE4" />
          <stop offset=".65" stopColor="#C5D5D2" />
          <stop offset="1" stopColor="#7F9FA5" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#B5E7E8" stopOpacity="0" />
          <stop offset=".42" stopColor="#B5E7E8" stopOpacity=".13" />
          <stop offset=".7" stopColor="#B5E7E8" stopOpacity=".02" />
          <stop offset="1" stopColor="#B5E7E8" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={hull} />
        </clipPath>
        <clipPath id={`${id}-cavity-clip`}>
          <path d={cavity} />
        </clipPath>
        <clipPath id={`${id}-scan-clip`}>
          <rect x={-470} y={-120} width={1000 * smooth(cut)} height={330} />
        </clipPath>
        <clipPath id={`${id}-underwater-clip`}>
          <rect
            x={-500}
            y={waterlineY}
            width={1050}
            height={Math.max(0, 240 - waterlineY)}
          />
        </clipPath>
        <linearGradient id={`${id}-dry-hold`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#0A202D" />
          <stop offset=".66" stopColor="#15313E" />
          <stop offset="1" stopColor="#2E4650" />
        </linearGradient>
        <linearGradient id={`${id}-excluded`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#B5F5EC" stopOpacity=".27" />
          <stop offset="1" stopColor="#5ADBE1" stopOpacity=".44" />
        </linearGradient>
        <pattern
          id={`${id}-excluded-hatch`}
          width={23}
          height={23}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-28)"
        >
          <path
            d="M0 0 V23"
            stroke="#B2F5ED"
            strokeWidth={1.2}
            strokeOpacity={0.26}
          />
        </pattern>
      </defs>
      {wake && (
        <g opacity={0.65}>
          <ellipse
            cx={-12}
            cy={143}
            rx={517}
            ry={34}
            fill="#061C2B"
            fillOpacity={0.7}
          />
          {[0, 1, 2, 3].map((i) => {
            const p = (t * 0.28 + i * 0.25) % 1;
            return (
              <path
                key={i}
                d={`M${-492 - p * 58} ${116 + p * 52} Q-355 ${168 + p * 70} 270 ${153 + p * 50} Q420 ${142 + p * 40} ${497 + p * 44} ${85 + p * 38}`}
                stroke="#80D4DD"
                strokeWidth={2.8 - i * 0.25}
                opacity={(1 - p) * 0.27}
                fill="none"
              />
            );
          })}
        </g>
      )}
      {/* Main hull and the bevel that turns the bow into a volume. */}
      <path
        d={hull}
        fill={`url(#${id}-hull)`}
        stroke="#8DA7B3"
        strokeOpacity={0.6}
        strokeWidth={1.6}
      />
      <g clipPath={`url(#${id}-clip)`}>
        <path
          d="M-445 91 Q-20 111 452 42 L468 220 H-480Z"
          fill={`url(#${id}-red)`}
        />
        <path
          d="M-440 87 Q-20 107 460 37"
          stroke="#E29373"
          strokeWidth={3}
          opacity={0.7}
        />
        <path
          d="M310 -32 L508 -111 L427 100 Q406 158 329 176 L333 68Z"
          fill="#061A29"
          fillOpacity={0.3}
        />
        {[-310, -170, -20, 130, 280].map((q, i) => (
          <path
            key={q}
            d={`M${q} -20 L${q + 6} 188`}
            stroke="#C7D9DC"
            opacity={0.07}
            strokeWidth={1.5}
          />
        ))}
        {[18, 51, 126, 155].map((q) => (
          <path
            key={q}
            d={`M-450 ${q} Q10 ${q + 10} 490 ${q - 30}`}
            fill="none"
            stroke="#031624"
            strokeOpacity={0.21}
            strokeWidth={2}
          />
        ))}
        <path
          d={`M${-580 + ((t * 22) % 960)} -60 h180 v290 h-180Z`}
          fill={`url(#${id}-shine)`}
        />
        <path
          d="M-422 142 Q-40 188 358 140"
          stroke="#D7A28B"
          strokeOpacity={0.12}
          strokeWidth={3}
          fill="none"
        />
      </g>
      {/* Cut the existing side plating away; all structure above it stays intact. */}
      {cut > 0 && (
        <g clipPath={`url(#${id}-scan-clip)`}>
          <path
            d={cavity}
            fill={`url(#${id}-dry-hold)`}
            stroke="#D0C4AD"
            strokeWidth={3}
          />
          <g clipPath={`url(#${id}-cavity-clip)`}>
            <path
              d="M-439 -17 H309 L484 -89 L419 -25 L-375 14Z"
              fill="#69828A"
              opacity={0.28}
            />
            <path
              d="M-429 121 Q-24 153 395 119 L346 165 H-350Z"
              fill="#74908E"
              opacity={0.15}
            />
            {Array.from({ length: 13 }, (_, i) => {
              const xx = -404 + i * 65;
              return (
                <g key={i}>
                  <path
                    d={`M${xx} -45 V113 Q${xx} 144 ${xx + 17} 172`}
                    fill="none"
                    stroke="#020E16"
                    strokeWidth={10}
                    opacity={0.72}
                  />
                  <path
                    d={`M${xx + 4} -45 V113 Q${xx + 4} 140 ${xx + 21} 172`}
                    fill="none"
                    stroke="#91A7A5"
                    strokeWidth={3}
                    opacity={0.61}
                  />
                  <path
                    d={`M${xx + 8} -45 V112 Q${xx + 8} 136 ${xx + 25} 172`}
                    fill="none"
                    stroke="#3E626D"
                    strokeWidth={3}
                    opacity={0.68}
                  />
                </g>
              );
            })}
            <path
              d="M-440 6 H314 L471 -58 M-425 136 Q-30 165 402 131"
              stroke="#9EB9B7"
              strokeWidth={2}
              fill="none"
              opacity={0.48}
            />
          </g>
          <path
            d={cavity}
            fill="none"
            stroke="#E2B191"
            strokeWidth={2}
            opacity={0.75}
          />
          {dryLabel && (
            <text
              x={-35}
              y={Math.min(30, waterlineY - 25)}
              textAnchor="middle"
              fontFamily="ExplainerSans,sans-serif"
              fontSize={21}
              letterSpacing={4}
              fill="#E8F0E8"
            >
              DRY INTERIOR
            </text>
          )}
        </g>
      )}
      {/* This patterned overlay is an excluded-volume annotation, never water entering the hold. */}
      {volume > 0 && (
        <g clipPath={`url(#${id}-clip)`} opacity={volume}>
          <g clipPath={`url(#${id}-underwater-clip)`}>
            <path d={hull} fill={`url(#${id}-excluded)`} />
            <path d={hull} fill={`url(#${id}-excluded-hatch)`} />
            <path d={hull} fill="none" stroke="#A6F4EC" strokeWidth={5} />
          </g>
          <path
            d={`M-500 ${waterlineY} H550`}
            fill="none"
            stroke="#BDF9F0"
            strokeWidth={2}
            strokeDasharray="12 9"
            opacity={0.9}
          />
        </g>
      )}
      {/* Perspective deck; stern and bow need different planes. */}
      <path
        d="M-455 -31 L-361 -105 H439 L508 -111 L312 -31Z"
        fill={`url(#${id}-deck)`}
        stroke="#94ACB7"
        strokeWidth={1.6}
      />
      <path
        d="M-455 -31 H312 L508 -111"
        fill="none"
        stroke="#D3E0DF"
        strokeWidth={5}
      />
      <path
        d="M-455 -20 H314 L502 -102"
        fill="none"
        stroke="#082332"
        strokeWidth={6}
      />
      <path d="M-361 -105 H438" stroke="#B4C7C7" strokeWidth={3} />
      {/* Far cargo row, behind the bridge and near cargo. */}
      {Array.from({ length: 6 }, (_, i) => {
        const row = Math.floor(i / 3),
          col = i % 3,
          [c, top, side] = cargoColors[(col + 1) % 3];
        return (
          <CargoBox
            key={`far${i}`}
            x={-149 + col * 137 + 41}
            y={-110 - row * 56}
            w={126}
            h={52}
            d={32}
            color={c}
            top={top}
            side={side}
          />
        );
      })}
      {/* Superstructure with visible right-hand plane. */}
      <path
        d="M-402 -40 V-233 H-276 V-40Z"
        fill={`url(#${id}-bridge)`}
        stroke="#365B6B"
        strokeWidth={2}
      />
      <path
        d="M-276 -233 L-232 -265 V-74 L-276 -40Z"
        fill="#799AA4"
        stroke="#355868"
        strokeWidth={2}
      />
      <path
        d="M-402 -233 L-357 -266 H-232 L-276 -233Z"
        fill="#EDF0E6"
        stroke="#6B8D97"
        strokeWidth={2}
      />
      <path
        d="M-413 -208 H-266 L-222 -241"
        fill="none"
        stroke="#E8EFEA"
        strokeWidth={8}
      />
      <path d="M-413 -206 H-266 V-179 H-413Z" fill="#496E7B" />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M${-405 + i * 20} -201 V-183`}
          stroke="#A0D5DB"
          strokeWidth={9}
          opacity={0.9 - i * 0.04}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={-386 + i * 34}
            y={-146}
            width={17}
            height={22}
            rx={2}
            fill="#345764"
          />
          <rect
            x={-386 + i * 34}
            y={-101}
            width={17}
            height={22}
            rx={2}
            fill="#436673"
          />
        </g>
      ))}
      <path d="M-259 -214 l22 -16 v25 l-22 16Z" fill="#4E7B8B" />
      <path
        d="M-370 -265 V-331 H-318 V-265"
        fill="#3C6170"
        stroke="#7897A1"
        strokeWidth={2}
      />
      <path d="M-370 -331 l17 -11 H-302 L-318 -331Z" fill="#91ADB3" />
      <path
        d="M-345 -344 V-410 M-374 -382 H-315 M-361 -397 H-329 M-345 -410 L-314 -357 M-345 -410 L-376 -357"
        stroke="#A6BFC6"
        strokeWidth={3}
        fill="none"
      />
      <circle cx={-345} cy={-414} r={5} fill="#DA996C" />
      {/* Near cargo row; rigid boxes settle at identical deck height. */}
      {Array.from({ length: 6 }, (_, i) => {
        const row = Math.floor(i / 3),
          col = i % 3,
          [c, top, side] = cargoColors[col];
        return (
          <CargoBox
            key={`front${i}`}
            x={-173 + col * 139}
            y={-88 - row * 56}
            w={128}
            h={52}
            d={34}
            color={c}
            top={top}
            side={side}
          />
        );
      })}
      {[0, 1, 2].map((i) => {
        const p = smooth(clamp(load * 1.8 - i * 0.3));
        return (
          <CargoBox
            key={`load${i}`}
            x={-173 + i * 139}
            y={-200 - 235 * (1 - p)}
            w={128}
            h={52}
            d={34}
            color="#BE674B"
            top="#ECA17A"
            side="#743D31"
            opacity={clamp(p * 5)}
          />
        );
      })}
      {/* Clear foredeck, mooring hardware and rail details. */}
      <path
        d="M288 -36 L432 -92 L473 -93 L322 -35Z"
        fill="#7F9BA6"
        stroke="#BCD0D2"
        strokeWidth={1.2}
      />
      <path d="M343 -53 l30 -12 17 4 -29 13Z" fill="#234B60" />
      <path d="M377 -68 v-13 M387 -73 v-13" stroke="#1D3B4C" strokeWidth={5} />
      <path
        d="M-445 -43 H306 L489 -116"
        stroke="#E5ECE5"
        strokeWidth={1.6}
        fill="none"
      />
      {Array.from({ length: 17 }, (_, i) => (
        <path
          key={i}
          d={`M${-438 + i * 45} -45 v17`}
          stroke="#A8C1C7"
          strokeWidth={1.3}
        />
      ))}
      <path
        d="M328 -47 L478 -108"
        fill="none"
        stroke="#D1E2DE"
        strokeWidth={1.8}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M${329 + i * 28} ${-47 - i * 11.2} v15`}
          stroke="#ADC6CA"
          strokeWidth={1.5}
        />
      ))}
      <text
        x={258}
        y={36}
        textAnchor="end"
        fontFamily="ExplainerSans, sans-serif"
        fontSize={21}
        letterSpacing={3}
        fill="#DDE6DF"
        opacity={0.9 * (1 - cut)}
      >
        {name}
      </text>
      <path
        d="M399 7 l11 -5 -4 18 -11 4Z"
        fill="#041A28"
        stroke="#7C9DA9"
        strokeWidth={2}
      />
      <path
        d="M-405 43 h23 v34 h-23Z"
        fill="#041B2A"
        stroke="#8AA6B1"
        strokeWidth={2}
      />
      {wake && (
        <g>
          <path
            d="M-440 106 Q-343 149 -252 140"
            stroke="#CEF2EA"
            strokeWidth={3}
            opacity={0.45}
            fill="none"
          />
          <path
            d="M417 105 Q461 84 486 88"
            stroke="#A9E4E4"
            strokeWidth={4}
            opacity={0.55}
            fill="none"
          />
        </g>
      )}
    </g>
  );
}

export type HeroNailProps = {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  t?: number;
  outline?: boolean;
  showVolume?: boolean;
  opacity?: number;
  submerged?: boolean;
  highlight?: number;
  /** Changes only the optical material; the exact solid geometry is shared. */
  material?: "steel" | "water";
};
/** Rigid solid: width/length never respond to depth. Transform y to sink it. */
export function HeroNail({
  x = 540,
  y = 1000,
  scale = 1,
  rotation = 0,
  t = 0,
  outline = false,
  showVolume = false,
  opacity = 1,
  submerged = true,
  highlight = 1,
  material = "steel",
}: HeroNailProps) {
  const id = useSvgId("hero-nail");
  const glow = 0.5 + 0.5 * Math.sin(t * 0.8);
  const water = material === "water";
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
      opacity={opacity}
    >
      <defs>
        <linearGradient id={`${id}-shaft`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor={water ? "#236D85" : "#102B40"} />
          <stop offset=".18" stopColor={water ? "#55C4D1" : "#526D7D"} />
          <stop offset=".37" stopColor={water ? "#B7F0EE" : "#D7E5EC"} />
          <stop offset=".48" stopColor={water ? "#D4FBF5" : "#F3F8F8"} />
          <stop offset=".6" stopColor={water ? "#7CE1E4" : "#92AAB7"} />
          <stop offset=".77" stopColor={water ? "#3199B1" : "#375467"} />
          <stop offset="1" stopColor={water ? "#175C77" : "#0C2639"} />
        </linearGradient>
        <linearGradient id={`${id}-head`} x1=".2" y1="0" x2=".8" y2="1">
          <stop stopColor={water ? "#D2FCF5" : "#E8F0EE"} />
          <stop offset=".28" stopColor={water ? "#91ECE9" : "#A7BCC5"} />
          <stop offset=".55" stopColor={water ? "#5DD4DD" : "#91A8B4"} />
          <stop offset="1" stopColor={water ? "#278AA5" : "#3F5C70"} />
        </linearGradient>
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor={water ? "#237A96" : "#27465D"} />
          <stop offset=".35" stopColor={water ? "#91ECE9" : "#A9BFCA"} />
          <stop offset=".6" stopColor={water ? "#45B7CA" : "#536E82"} />
          <stop offset="1" stopColor={water ? "#12506D" : "#061D30"} />
        </linearGradient>
      </defs>
      <path
        d="M-19 -174 H19 V172 L0 242 L-19 172Z"
        fill={`url(#${id}-shaft)`}
        stroke={water ? "#AAEEEB" : "#9EB6C3"}
        strokeOpacity={0.55}
        strokeWidth={1.2}
      />
      <path d="M0 242 L19 172 L1 186Z" fill={water ? "#1B6883" : "#082234"} />
      <path
        d="M0 242 L-19 172 L1 186Z"
        fill={water ? "#B3F5EE" : "#D8E5E9"}
        opacity={0.65}
      />
      <path
        d="M-66 -192 V-176 C-65 -149 65 -149 66 -176 V-192Z"
        fill={`url(#${id}-bevel)`}
        stroke={water ? "#75DDE1" : "#829EAE"}
        strokeWidth={1.2}
      />
      <ellipse
        cx={0}
        cy={-192}
        rx={66}
        ry={21}
        fill={`url(#${id}-head)`}
        stroke={water ? "#C0F6EF" : "#C4D6DD"}
        strokeOpacity={0.7}
        strokeWidth={1.5}
      />
      <path
        d="M-45 -201 L35 -190 M-34 -206 L45 -195 M-49 -196 L22 -185"
        fill="none"
        stroke="#E5EFEC"
        strokeWidth={0.8}
        opacity={water ? 0.08 : 0.22}
      />
      <path
        d="M-53 -189 Q-12 -178 48 -190"
        fill="none"
        stroke="#F2F8F3"
        strokeWidth={1.5}
        opacity={0.5}
      />
      <path
        d="M-8 -149 V156"
        stroke="#F6FBF8"
        strokeWidth={2}
        opacity={(0.25 + 0.45 * glow) * highlight}
      />
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d={`M-14 ${-120 + i * 47} L13 ${-112 + i * 47}`}
          stroke={water ? "#216B84" : "#132E40"}
          strokeOpacity={0.12}
          strokeWidth={1}
        />
      ))}
      {submerged && !water && (
        <path
          d="M-19 -150 H19 V172 L0 242 L-19 172Z"
          fill="#4BBECF"
          opacity={0.07}
        />
      )}
      {(outline || showVolume) && (
        <path
          d="M-75 -215 Q0 -245 75 -215 V-162 Q69 -145 27 -141 V175 L0 260 L-27 175 V-141 Q-69 -145 -75 -162Z"
          fill="none"
          stroke={WATERLINE.cyan}
          strokeWidth={2.5}
          strokeDasharray="11 10"
          strokeDashoffset={-t * 24}
          opacity={0.8}
        />
      )}
    </g>
  );
}

/** Exact excluded-volume copy. It reuses every outer path and transform of HeroNail. */
export type NailVolumeProps = Omit<HeroNailProps, "material">;
export function NailVolume(props: NailVolumeProps) {
  return <HeroNail {...props} material="water" />;
}

export type OceanProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  t?: number;
  opacity?: number;
  surfaceAmplitude?: number;
  showSurface?: boolean;
  caustics?: boolean;
  deep?: boolean;
};
/** Draw behind the objects. For a foreground refraction wash reuse at opacity .1. */
export function Ocean({
  x = 0,
  y = 940,
  width = 1080,
  height = 980,
  t = 0,
  opacity = 1,
  surfaceAmplitude = 11,
  showSurface = true,
  caustics = true,
  deep = false,
}: OceanProps) {
  const id = useSvgId("ocean");
  let surface = `M0 0`;
  for (let q = 0; q <= width + 36; q += 36)
    surface += ` L${q} ${surfaceAmplitude * (Math.sin(q / 146 + t * 1.1) * 0.65 + Math.sin(q / 54 - t * 0.7) * 0.35)}`;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-depth`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={deep ? "#155066" : "#236B80"} />
          <stop offset=".21" stopColor="#103E54" />
          <stop offset=".62" stopColor="#082B40" />
          <stop offset="1" stopColor="#031724" />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx=".5" cy=".3" r=".7">
          <stop stopColor="#A9F0EB" stopOpacity=".11" />
          <stop offset=".4" stopColor="#A9F0EB" stopOpacity=".04" />
          <stop offset=".72" stopColor="#8BE0E0" stopOpacity=".012" />
          <stop offset="1" stopColor="#72D4DD" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-light-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="white" />
          <stop offset=".5" stopColor="white" stopOpacity=".45" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask
          id={`${id}-light-mask`}
          x="-100"
          y="-30"
          width={width + 200}
          height={height + 30}
          maskUnits="userSpaceOnUse"
        >
          <rect
            x={-100}
            y={-30}
            width={width + 200}
            height={height + 30}
            fill={`url(#${id}-light-fade)`}
          />
        </mask>
        <clipPath id={`${id}-clip`}>
          <path d={`${surface} L${width} ${height} H0Z`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect
          y={-30}
          width={width}
          height={height + 30}
          fill={`url(#${id}-depth)`}
        />
        {caustics && (
          <>
            <g mask={`url(#${id}-light-mask)`}>
              {[0, 1, 2].map((i) => (
                <ellipse
                  key={`ray${i}`}
                  cx={i * width * 0.39 + Math.sin(t * 0.2 + i) * 35}
                  cy={height * 0.23}
                  rx={width * 0.14}
                  ry={height * 0.9}
                  transform={`rotate(-17 ${i * width * 0.39} ${height * 0.23})`}
                  fill={`url(#${id}-light)`}
                  opacity={0.9 - i * 0.15}
                />
              ))}
            </g>
            {Array.from({ length: 9 }, (_, i) => {
              const yy = 33 + i * 66,
                off = Math.sin(t * 0.6 + i) * 20;
              return (
                <path
                  key={i}
                  d={`M-50 ${yy} Q${width * 0.25 + off} ${yy - 23} ${width * 0.5} ${yy + off} T${width + 50} ${yy + 8}`}
                  fill="none"
                  stroke="#69BFCC"
                  strokeWidth={i < 3 ? 1.8 : 1.2}
                  strokeOpacity={0.12 - i * 0.009}
                />
              );
            })}
            {Array.from({ length: 16 }, (_, i) => {
              const xx = (i * 147.73 + t * (3 + (i % 3))) % width,
                yy = 45 + ((i * 79.91) % Math.max(150, height - 80));
              return (
                <circle
                  key={i}
                  cx={xx}
                  cy={yy}
                  r={i % 4 === 0 ? 1.7 : 1}
                  fill="#C1F0EC"
                  opacity={0.1 + (i % 3) * 0.035}
                />
              );
            })}
          </>
        )}
        <rect y={-5} width={width} height={13} fill="#9BE1E3" opacity={0.1} />
      </g>
      {showSurface && (
        <>
          <path
            d={surface}
            fill="none"
            stroke="#B7E8E5"
            strokeWidth={2.1}
            opacity={0.7}
          />
          <path
            d={surface}
            transform="translate(0 5)"
            fill="none"
            stroke="#3F9EB3"
            strokeWidth={3}
            opacity={0.35}
          />
        </>
      )}
    </g>
  );
}

/** The drawing uses a 660×260 open hull. Values are local coordinates. */
export const CUTAWAY_GEOMETRY = {
  height: 260,
  halfTop: 330,
  halfBottom: 190,
  weightAnchor: { x: 0, y: 145 },
  buoyancyAnchor: { x: 0, y: 260 },
};
export function cutawayWaterline(draft: number) {
  return 260 - draft;
}
export function cutawayHalfWidthAtY(y: number) {
  return 330 - (140 * y) / 260;
}
/** Area proxy of the excluded side-section; map 100 L to any chosen draft. */
export function cutawayArea(draft: number) {
  const d = Math.max(0, Math.min(260, draft));
  return 380 * d + (140 / 260) * d * d;
}
export function cutawayDraftForFraction(fraction: number, fullDraft = 155) {
  const target = cutawayArea(fullDraft) * Math.max(0, fraction),
    a = 140 / 260;
  return (-380 + Math.sqrt(380 * 380 + 4 * a * target)) / (2 * a);
}
export type CutawayBoatProps = {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  t?: number;
  /** Depth of keel below the horizontal waterline, in local px. */
  draft?: number;
  immersion?: number;
  shade?: boolean;
  pressure?: boolean;
  pressureReveal?: number;
  /** Fades only the individual pressure arrows, for a transition to resultant force. */
  pressureOpacity?: number;
  forceColor?: string;
  /** Interior color can be ivory for the laboratory or midnight for ocean shots. */
  interior?: string;
  opacity?: number;
  waterline?: boolean;
  rimDepth?: number;
  wallHighlight?: number;
  highlight?: number;
  dryLabel?: boolean;
};
export function ForceArrow({
  x,
  y,
  dx = 0,
  dy = -140,
  color = WATERLINE.cyan,
  width = 11,
  reveal = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  color?: string;
  width?: number;
  reveal?: number;
  opacity?: number;
}) {
  const p = clamp(reveal),
    xx = x + dx * p,
    yy = y + dy * p,
    a = Math.atan2(dy, dx),
    h = width * 2.4;
  return (
    <g opacity={opacity}>
      <path
        d={`M${x} ${y} L${xx} ${yy}`}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${xx} ${yy} L${xx - h * Math.cos(a - 0.48)} ${yy - h * Math.sin(a - 0.48)} L${xx - h * Math.cos(a + 0.48)} ${yy - h * Math.sin(a + 0.48)}Z`}
        fill={color}
        opacity={p}
      />
    </g>
  );
}

export function CutawayBoat({
  x = 540,
  y = 790,
  scale = 1,
  rotation = 0,
  t = 0,
  draft = 155,
  immersion,
  shade = false,
  pressure = false,
  pressureReveal = 1,
  pressureOpacity = 1,
  forceColor,
  interior = WATERLINE.ivory,
  opacity = 1,
  waterline = true,
  rimDepth = 24,
  wallHighlight = 0,
  highlight = 0,
  dryLabel = false,
}: CutawayBoatProps) {
  const arrowColor =
    forceColor || (interior === WATERLINE.ivory ? "#24869C" : WATERLINE.cyan);
  const id = useSvgId("cutaway");
  const d = immersion === undefined ? draft : immersion,
    wl = 260 - d,
    edge = cutawayHalfWidthAtY(wl);
  const outline = "M-330 0 L-190 260 H190 L330 0Z";
  const inner = "M-307 0 L-177 240 H177 L307 0Z";
  const wall = Math.max(wallHighlight, highlight);
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
      opacity={opacity}
    >
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2=".25">
          <stop stopColor="#395B6F" />
          <stop offset=".15" stopColor="#D2E2E5" />
          <stop offset=".32" stopColor="#748E9E" />
          <stop offset=".65" stopColor="#B7CFD6" />
          <stop offset=".86" stopColor="#496C82" />
          <stop offset="1" stopColor="#0B2B42" />
        </linearGradient>
        <linearGradient id={`${id}-interior`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={interior} />
          <stop
            offset="1"
            stopColor={interior == WATERLINE.ivory ? "#C9DBDC" : "#0B2535"}
          />
        </linearGradient>
        <linearGradient id={`${id}-volume`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#65CAD7" stopOpacity=".06" />
          <stop offset="1" stopColor="#2CB2CC" stopOpacity=".28" />
        </linearGradient>
        <pattern
          id={`${id}-hatch`}
          width="19"
          height="19"
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${t * 6} 0)`}
        >
          <path
            d="M-3 3 L3 -3 M0 19 L19 0 M16 22 L22 16"
            fill="none"
            stroke="#4CACBD"
            strokeWidth={1.2}
            opacity={0.32}
          />
        </pattern>
        <clipPath id={`${id}-envelope`}>
          <path d={outline} />
        </clipPath>
      </defs>
      {/* Back rim: a small offset adds thickness without obscuring the cross-section. */}
      <path
        d={`M-330 0 L${-330 + rimDepth} ${-rimDepth * 0.6} H${330 + rimDepth} L330 0Z`}
        fill="#99B3BE"
        stroke="#C2D4D7"
        strokeWidth={1.3}
      />
      <path
        d={outline}
        fill={`url(#${id}-metal)`}
        stroke="#7797A8"
        strokeWidth={1.5}
      />
      <path
        d={inner}
        fill={`url(#${id}-interior)`}
        stroke="#34576D"
        strokeWidth={1.7}
      />
      <path
        d="M-307 0 L-177 240 H177 L307 0"
        fill="none"
        stroke="#F0F8F4"
        strokeOpacity={0.5}
        strokeWidth={2}
      />
      {/* Visible chine, seam, and plate rivets make macros useful. */}
      <path d="M-190 260 H190" stroke="#D0E0E1" strokeWidth={3} />
      <path d="M-187 251 H187" stroke="#193C52" strokeWidth={2} />
      {Array.from({ length: 10 }, (_, i) => {
        const q = (i + 1) / 11,
          yy = 260 * q,
          xx = 330 - 140 * q - 9;
        return (
          <g key={i}>
            <circle cx={-xx} cy={yy} r={2.2} fill="#254A60" />
            <circle cx={xx} cy={yy} r={2.2} fill="#244A61" />
            <circle cx={-xx - 0.5} cy={yy - 0.7} r={0.8} fill="#DCE9E9" />
            <circle cx={xx - 0.5} cy={yy - 0.7} r={0.8} fill="#DCE9E9" />
          </g>
        );
      })}
      <path
        d="M-330 0 H-307 M307 0 H330"
        stroke="#E78664"
        strokeWidth={8}
        strokeLinecap="square"
      />
      {shade && d > 0 && (
        <g clipPath={`url(#${id}-envelope)`}>
          <rect
            x={-350}
            y={Math.max(0, wl)}
            width={700}
            height={Math.max(0, d)}
            fill={`url(#${id}-volume)`}
          />
          <rect
            x={-350}
            y={Math.max(0, wl)}
            width={700}
            height={Math.max(0, d)}
            fill={`url(#${id}-hatch)`}
          />
          <path
            d={`M${-edge} ${wl} H${edge} L190 260 H-190Z`}
            fill="none"
            stroke="#55C2D2"
            strokeWidth={2}
            strokeDasharray="9 7"
          />
        </g>
      )}
      {waterline && d >= 0 && d <= 260 && (
        <path
          d={`M-410 ${wl} H${-edge} M${edge} ${wl} H410`}
          stroke="#7ACAD7"
          strokeWidth={2.2}
        />
      )}
      {wall > 0 && (
        <path
          d="M-330 0 L-190 260 H190 L330 0"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - clamp(wall)}
          fill="none"
          stroke="#F5AC78"
          strokeWidth={6}
          strokeLinecap="round"
        />
      )}
      {dryLabel && (
        <text
          x={0}
          y={Math.min(wl - 25, 78)}
          textAnchor="middle"
          fill={interior == WATERLINE.ivory ? "#274B5D" : "#D6E4E7"}
          fontFamily="ExplainerSans,sans-serif"
          fontSize={27}
          fontWeight={600}
          letterSpacing={4}
        >
          DRY INTERIOR
        </text>
      )}
      {pressure && d > 0 && (
        <g opacity={clamp(pressureOpacity)}>
          {[0.18, 0.5, 0.83].map((f, i) => {
            const yy = wl + d * f,
              xx = cutawayHalfWidthAtY(yy),
              len = 35 + i * 24,
              rev = clamp(pressureReveal * 1.5 - i * 0.18);
            return (
              <g key={i}>
                <ForceArrow
                  x={-xx - len}
                  y={yy + len * (140 / 260)}
                  dx={len - 3}
                  dy={-len * (140 / 260)}
                  width={7 + i * 1.7}
                  reveal={rev}
                  color={arrowColor}
                />
                <ForceArrow
                  x={xx + len}
                  y={yy + len * (140 / 260)}
                  dx={-len + 3}
                  dy={-len * (140 / 260)}
                  width={7 + i * 1.7}
                  reveal={rev}
                  color={arrowColor}
                />
              </g>
            );
          })}
          {[-100, 0, 100].map((xx) => (
            <ForceArrow
              key={xx}
              x={xx}
              y={350}
              dy={-85}
              width={12}
              reveal={pressureReveal}
              color={arrowColor}
            />
          ))}
        </g>
      )}
    </g>
  );
}
