"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

/* ─────────────────────────────────────────────
   Prayer flag config — BAZARCO + two bookends
   ───────────────────────────────────────────── */
const LETTERS = ["❋", "B", "A", "Z", "A", "R", "C", "O", "❋"];

// Alternating deep-blue / crimson-red / cream with inner square border
const FLAG_PALETTE = [
  { bg: "#d98a00", border: "#8a5500", text: "#fff4cc", glow: "rgba(217,138,0,0.55)" },   // ❋ gold
  { bg: "#1540a8", border: "#0d2870", text: "#bdd4ff", glow: "rgba(21,64,168,0.6)" },    // B blue
  { bg: "#c0201c", border: "#7a0c0a", text: "#ffd4d3", glow: "rgba(192,32,28,0.6)" },    // A red
  { bg: "#f5f0e8", border: "#a8a090", text: "#1a1610", glow: "rgba(180,170,150,0.4)" },  // Z cream
  { bg: "#1540a8", border: "#0d2870", text: "#bdd4ff", glow: "rgba(21,64,168,0.6)" },    // A blue
  { bg: "#c0201c", border: "#7a0c0a", text: "#ffd4d3", glow: "rgba(192,32,28,0.6)" },    // R red
  { bg: "#f5f0e8", border: "#a8a090", text: "#1a1610", glow: "rgba(180,170,150,0.4)" },  // C cream
  { bg: "#1540a8", border: "#0d2870", text: "#bdd4ff", glow: "rgba(21,64,168,0.6)" },    // O blue
  { bg: "#d98a00", border: "#8a5500", text: "#fff4cc", glow: "rgba(217,138,0,0.55)" },   // ❋ gold
];

const FLAG_COUNT = LETTERS.length; // 9
const ROPE_DROP = 60;   // px the rope droops at the centre
const FLAG_W = 58;
const FLAG_H = 68;

interface FlagData {
  t: number; ropeY: number; rotateDeg: number;
  letter: string; color: typeof FLAG_PALETTE[0];
  flutterDur: number; flutterDelay: number;
}

const FLAGS: FlagData[] = LETTERS.map((letter, i) => {
  const t = i / (FLAG_COUNT - 1);
  const ropeY = 4 * ROPE_DROP * t * (1 - t);
  const rotateDeg = (0.5 - t) * 38;
  return {
    t, ropeY, rotateDeg,
    letter,
    color: FLAG_PALETTE[i],
    flutterDur: 2.2 + (i % 4) * 0.4,
    flutterDelay: t * 1.4,
  };
});

/* ─── Single prayer flag ─── */
function PrayerFlag({ letter, color, rotateDeg, flutterDur, flutterDelay }: FlagData) {
  return (
    <motion.div
      style={{ transformOrigin: "top center" }}
      animate={{ rotate: [rotateDeg - 3.5, rotateDeg + 3.5, rotateDeg - 3.5] }}
      transition={{ duration: flutterDur, repeat: Infinity, delay: flutterDelay, ease: "easeInOut" }}
    >
      <div
        style={{
          width: FLAG_W, height: FLAG_H,
          background: color.bg,
          border: `2.5px solid ${color.border}`,
          borderRadius: "3px 3px 7px 7px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 8px 22px ${color.glow}, 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)`,
          overflow: "visible",
        }}
      >
        {/* ── Inner square decorative border (characteristic of Tibetan flags) ── */}
        <div style={{
          position: "absolute", inset: 5,
          border: `1.5px solid ${color.border}`,
          borderRadius: 2, opacity: 0.55,
          pointerEvents: "none",
        }} />
        {/* Corner dots */}
        {([["top","left"],["top","right"],["bottom","left"],["bottom","right"]] as const).map(([v,h], idx) => (
          <div key={idx} style={{
            position: "absolute",
            width: 4, height: 4,
            borderRadius: "50%",
            background: color.border,
            opacity: 0.7,
            [v]: 3, [h]: 3,
          }} />
        ))}
        {/* Letter / symbol */}
        <span style={{
          color: color.text,
          fontSize: letter.length === 1 && letter !== "❋" ? 26 : 16,
          fontWeight: 900,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          textShadow: "0 1px 4px rgba(0,0,0,0.45)",
          letterSpacing: "-0.01em",
          zIndex: 1,
          userSelect: "none",
          lineHeight: 1,
        }}>
          {letter}
        </span>
        {/* Bottom hanging thread */}
        <div style={{
          position: "absolute", bottom: -8,
          left: "50%", transform: "translateX(-50%)",
          width: 1.5, height: 8,
          background: "rgba(215,195,145,0.75)",
        }} />
      </div>
    </motion.div>
  );
}

/* ─── Full garland ─── */
function PrayerFlagGarland() {
  const containerH = ROPE_DROP + FLAG_H + 20;
  return (
    <motion.div
      className="absolute inset-x-0 top-0 z-20 pointer-events-none"
      style={{ height: containerH }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
    >
      {/* Gentle whole-garland wind sway */}
      <motion.div
        style={{ width: "100%", height: "100%", position: "relative" }}
        animate={{ rotate: [-0.6, 0.6, -0.6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* ── Rope ── */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", overflow: "visible" }}
          height={ROPE_DROP + 12}
          preserveAspectRatio="none"
        >
          {/* rope shadow */}
          <path d={`M 0 3 Q 50% ${ROPE_DROP + 10} 100% 3`}
            fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
          {/* rope */}
          <path d={`M 0 3 Q 50% ${ROPE_DROP + 6} 100% 3`}
            fill="none" stroke="rgba(220,200,150,0.92)" strokeWidth="2"
            strokeLinecap="round" />
        </svg>

        {/* ── Flags ── */}
        {FLAGS.map((flag, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `calc(${flag.t * 100}% - ${FLAG_W / 2}px)`,
            top: flag.ropeY,
          }}>
            <PrayerFlag {...flag} />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── Countdown ─── */
interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(): TimeLeft {
  const target = new Date("2026-08-20T00:00:00").getTime();
  const diff = Math.max(0, target - Date.now());
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  };
}

function CountdownBlock({ value, label, color }: { value: number | null; label: string; color: "red" | "blue" }) {
  const display = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <div className={`flex flex-col items-center gap-1 ${color === "red" ? "clay-card-red" : "clay-card-blue"} px-4 py-3 min-w-[64px]`}>
      <span className="text-2xl font-black tabular-nums text-[var(--foreground)]">{display}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">{label}</span>
    </div>
  );
}

/* ─── Main hero ─── */
export function ComingSoonHero() {
  const { user } = useAuth();
  // null on the server — avoids SSR/client mismatch with Date.now()
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="clay-hero-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">

      {/* Floating ambient orbs */}
      <motion.div className="absolute top-[30%] left-[4%] w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-blue)", opacity: 0.9 }}
        animate={{ y: [0,-22,0], x:[0,10,0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-[22%] right-[4%] w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-red)", opacity: 0.9 }}
        animate={{ y: [0,22,0], x:[0,-12,0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
      <motion.div className="absolute top-[20%] right-[15%] w-44 h-44 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-blue)", opacity: 0.6 }}
        animate={{ scale: [1, 1.25, 1], x: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
      <motion.div className="absolute bottom-[35%] left-[20%] w-36 h-36 rounded-full blur-3xl pointer-events-none"
        style={{ background: "var(--dashboard-glow-red)", opacity: 0.5 }}
        animate={{ scale: [1, 1.3, 1], y: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }} />

      {/* ── Prayer flag garland ── */}
      <PrayerFlagGarland />

      {/* ── Central clay card ── */}
      <motion.div
        className="relative z-10 clay-card flex flex-col items-center gap-8 px-8 py-12 sm:px-12 sm:py-14 text-center max-w-xl w-full"
        style={{ marginTop: 130 }}
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Top accent bar — red → blue */}
        <div className="absolute top-0 inset-x-0 h-1 rounded-t-[24px] overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-[#c0201c] via-[#7b3fd1] to-[#1540a8]" />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/logo.png"
              alt="BazarCo"
              width={260}
              height={110}
              priority
              className="h-auto w-48 sm:w-56 drop-shadow-[0_0_28px_rgba(77,130,255,0.25)]"
            />
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-1"
        >
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--foreground)]">
            Coming{" "}
            <span className="bg-gradient-to-r from-[#ff5c72] to-[#4da6ff] bg-clip-text text-transparent">
              Soon
            </span>
          </h1>
          <p className="text-sm font-medium text-[var(--brand-muted)]">
            The marketplace that connects Nepal — buyers, sellers & riders
          </p>
        </motion.div>

        {/* Countdown timer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-3 w-full"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-muted)]">
            Launching August 20, 2026
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <CountdownBlock value={timeLeft?.days    ?? null} label="Days"    color="blue" />
            <span className="text-2xl font-black text-[var(--brand-muted)] mb-3">:</span>
            <CountdownBlock value={timeLeft?.hours   ?? null} label="Hours"   color="red"  />
            <span className="text-2xl font-black text-[var(--brand-muted)] mb-3">:</span>
            <CountdownBlock value={timeLeft?.minutes ?? null} label="Minutes" color="blue" />
            <span className="text-2xl font-black text-[var(--brand-muted)] mb-3">:</span>
            <CountdownBlock value={timeLeft?.seconds ?? null} label="Seconds" color="red"  />
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--brand-border)] to-transparent" />

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.92 }}
          className="flex gap-3 flex-wrap justify-center w-full"
        >
          {user ? (
            <Link href="/dashboard" className="clay-btn-red px-8 py-3.5 text-sm w-full sm:w-auto">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/signup"
                className="clay-btn-red px-8 py-3.5 text-sm flex-1 sm:flex-none flex items-center justify-center gap-2"
                style={{ minWidth: 150 }}
              >
                Get Started Free
              </Link>
              <Link href="/login"
                className="clay-btn-blue px-8 py-3.5 text-sm flex-1 sm:flex-none flex items-center justify-center gap-2"
                style={{ minWidth: 140 }}
              >
                Sign In
              </Link>
            </>
          )}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-4 flex-wrap justify-center"
        >
          {[
            { dot: "#22c55e", text: "KYC Verified Sellers" },
            { dot: "#4da6ff", text: "Secure Payments" },
            { dot: "#ff5c72", text: "Real-time Chat" },
          ].map(({ dot, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 5px ${dot}` }} />
              <span className="text-xs text-[var(--brand-muted)] font-medium">{text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── 5-colour stripe footer ── */}
      <div className="absolute bottom-0 inset-x-0 flex h-1.5 z-20">
        {["#1540a8","#f5f0e8","#c0201c","#1d7a35","#d98a00"].map((c, i) => (
          <motion.div key={i} className="flex-1" style={{ background: c }}
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.5, delay: 0.8 + i * 0.06, ease: "easeOut" }}
          />
        ))}
      </div>
    </section>
  );
}
