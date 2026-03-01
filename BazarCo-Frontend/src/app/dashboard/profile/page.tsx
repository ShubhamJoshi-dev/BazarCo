"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { authUpdateProfile } from "@/lib/api";

const sidebarNav = [
  { id: "profile", label: "Public profile", Icon: User },
  { id: "account", label: "Account", Icon: Settings },
];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);
  const [activeSection, setActiveSection] = useState("profile");

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const updated = await authUpdateProfile(name);
    setSaving(false);
    if (updated) {
      setUser(updated);
      setMessage("saved");
    } else {
      setMessage("error");
    }
  }

  return (
    <div className="flex gap-8 min-h-[60vh]">
      <motion.aside
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="w-56 shrink-0"
      >
        <div className="settings-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--brand-red)]/30 to-[var(--brand-blue)]/30 flex items-center justify-center text-[var(--brand-white)]">
              <User className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--brand-white)]">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-neutral-500">Your personal account</p>
            </div>
          </div>
        </div>
        <nav className="space-y-0.5">
          {sidebarNav.map((item) => {
            const active = activeSection === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] border border-[var(--brand-blue)]/30"
                    : "text-neutral-400 hover:bg-white/5 hover:text-[var(--brand-white)]"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </motion.aside>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex-1 min-w-0"
      >
        <div className="settings-card rounded-2xl border border-white/10 overflow-hidden card-glow">
          <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-white/[0.02]">
            <h2 className="text-lg font-bold text-[var(--brand-white)]">
              Public profile
            </h2>
            <Link
              href="/dashboard"
              className="text-sm text-[var(--brand-blue)] hover:underline"
            >
              Back to dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <label
                htmlFor="profile-name"
                className="block text-sm font-medium text-[var(--brand-white)]"
              >
                Name
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Your name may appear around BazarCo. You can change it anytime.
              </p>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30 transition-colors"
                placeholder="Your name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-[var(--brand-white)]">
                Email
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Your account email. Contact support to change it.
              </p>
              <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-neutral-400">
                {user?.email}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-[var(--brand-white)]">
                Role
              </label>
              <p className="text-xs text-neutral-500 mb-2">
                Your account type on the marketplace.
              </p>
              <div
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  user?.role === "seller"
                    ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40"
                    : "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40"
                }`}
              >
                <User className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                <span className="capitalize">{user?.role}</span>
              </div>
            </motion.div>

            {message === "saved" && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-400"
              >
                Profile updated.
              </motion.p>
            )}
            {message === "error" && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-[var(--brand-red)]"
              >
                Failed to update. Try again.
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-blue)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:ring-offset-2 focus:ring-offset-[var(--brand-black)] disabled:opacity-60 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? "Saving..." : "Save changes"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
