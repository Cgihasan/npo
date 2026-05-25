"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Wallet, ArrowRight } from "lucide-react";

interface ContraFlowProps {
  fromType: "CASH" | "BANK";
  toType: "CASH" | "BANK";
  amount: number;
}

export default function ContraFlow({ fromType, toType, amount }: ContraFlowProps) {
  const isCashToBank = fromType === "CASH" && toType === "BANK";
  const isBankToCash = fromType === "BANK" && toType === "CASH";

  if (!isCashToBank && !isBankToCash) return null;

  return (
    <div className="relative glass rounded-2xl p-8 overflow-hidden h-40 flex items-center justify-between">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-full bg-emerald-500 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-full bg-amber-500 rounded-full blur-[80px]" />
      </div>

      <div className="z-10 flex flex-col items-center gap-2 w-24">
        <div className={`p-4 rounded-2xl ${fromType === "CASH" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"} shadow-lg`}>
          {fromType === "CASH" ? <Wallet className="w-8 h-8" /> : <Landmark className="w-8 h-8" />}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{fromType}</span>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {amount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-6 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full"
            >
              <span className="text-sm font-mono font-bold text-primary">₹{amount.toLocaleString()}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full h-px bg-border/50 relative">
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: "0%" }}
            animate={{ left: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
          >
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </motion.div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
             <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
             <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
             <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
          </div>
        </div>

        <p className="mt-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-tighter">
          Transferring Funds
        </p>
      </div>

      <div className="z-10 flex flex-col items-center gap-2 w-24">
        <div className={`p-4 rounded-2xl ${toType === "CASH" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"} shadow-lg`}>
          {toType === "CASH" ? <Wallet className="w-8 h-8" /> : <Landmark className="w-8 h-8" />}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{toType}</span>
      </div>
    </div>
  );
}
