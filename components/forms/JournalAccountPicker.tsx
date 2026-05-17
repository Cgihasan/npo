"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatAccountFullLabel } from "@/components/forms/AccountForm";
import {
  findOrCreateAccountByLedger,
  type LedgerHint,
} from "@/app/actions/masters";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export type JournalAccountValue = {
  accountId: string;
  accountLabel: string;
};

type AccountRecord = {
  id: string;
  type: string;
  category?: string | null;
  accountType?: string | null;
};

interface JournalAccountPickerProps {
  accounts: AccountRecord[];
  value: JournalAccountValue;
  onChange: (value: JournalAccountValue) => void;
  onAccountCreated?: (account: AccountRecord) => void;
  disabled?: boolean;
  ledgerHint?: LedgerHint;
  placeholder?: string;
}

export function JournalAccountPicker({
  accounts,
  value,
  onChange,
  onAccountCreated,
  disabled,
  ledgerHint = "auto",
  placeholder = "Type ledger name or select account...",
}: JournalAccountPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value.accountLabel);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value.accountLabel);
  }, [value.accountLabel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = useMemo(
    () =>
      accounts.map((acc) => ({
        id: acc.id,
        label: formatAccountFullLabel(acc),
        ledger: acc.accountType?.trim() || formatAccountFullLabel(acc),
      })),
    [accounts]
  );

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(normalizedQuery) ||
        opt.ledger.toLowerCase().includes(normalizedQuery)
    );
  }, [options, normalizedQuery]);

  const hasExactMatch = useMemo(
    () =>
      options.some(
        (opt) =>
          opt.ledger.toLowerCase() === normalizedQuery ||
          opt.label.toLowerCase() === normalizedQuery
      ),
    [options, normalizedQuery]
  );

  const selectExisting = (id: string, label: string) => {
    onChange({ accountId: id, accountLabel: label });
    setQuery(label);
    setOpen(false);
  };

  const createLedger = async () => {
    if (!trimmedQuery || hasExactMatch) return;
    setIsCreating(true);
    try {
      const account = await findOrCreateAccountByLedger(trimmedQuery, {
        hint: ledgerHint,
      });
      const label = formatAccountFullLabel(account);
      onChange({ accountId: account.id, accountLabel: label });
      setQuery(label);
      onAccountCreated?.(account);
      setOpen(false);
      toast.success(`Ledger "${trimmedQuery}" added to chart of accounts`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to add ledger";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        disabled={disabled || isCreating}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          onChange({ accountId: "", accountLabel: next });
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && trimmedQuery && !hasExactMatch) {
            e.preventDefault();
            void createLedger();
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {open && (filtered.length > 0 || (trimmedQuery && !hasExactMatch)) && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md"
          role="listbox"
        >
          {filtered.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  value.accountId === opt.id && "bg-accent/50"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectExisting(opt.id, opt.label)}
              >
                {opt.label}
              </button>
            </li>
          ))}

          {trimmedQuery && !hasExactMatch && (
            <li className="border-t">
              <button
                type="button"
                disabled={isCreating}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-emerald-600 hover:bg-accent disabled:opacity-50 dark:text-emerald-400"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void createLedger()}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {isCreating
                  ? "Adding ledger..."
                  : `Add ledger: "${trimmedQuery}"`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
