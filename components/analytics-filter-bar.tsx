"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toIsoOrUndefined, toLocalDateTimeInput } from "@/lib/format";
import type { ChatChannel } from "@/lib/types";

const CHANNELS: ChatChannel[] = ["SLACK", "TEAMS"];
const ALL_VALUE = "__ALL__";

const PRESETS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
] as const;

export function AnalyticsFilterBar({
  initialChannel,
  initialFrom,
  initialTo,
}: {
  initialChannel?: ChatChannel;
  initialFrom?: string;
  initialTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [channel, setChannel] = useState<string>(initialChannel ?? ALL_VALUE);
  const [fromLocal, setFromLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialFrom)
  );
  const [toLocal, setToLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialTo)
  );

  function pushParams(nextChannel: string, nextFrom?: string, nextTo?: string) {
    const sp = new URLSearchParams();
    if (nextChannel !== ALL_VALUE) sp.set("channel", nextChannel);
    if (nextFrom) sp.set("from", nextFrom);
    if (nextTo) sp.set("to", nextTo);
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleApply(e: FormEvent) {
    e.preventDefault();
    pushParams(channel, toIsoOrUndefined(fromLocal), toIsoOrUndefined(toLocal));
  }

  function handlePreset(hours: number) {
    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const fromIso = start.toISOString();
    const toIso = now.toISOString();
    setFromLocal(toLocalDateTimeInput(fromIso));
    setToLocal(toLocalDateTimeInput(toIso));
    pushParams(channel, fromIso, toIso);
  }

  function handleReset() {
    setChannel(ALL_VALUE);
    setFromLocal("");
    setToLocal("");
    router.push(pathname);
  }

  return (
    <div className="flex flex-col gap-3 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Query Scope
        </span>
        <div className="flex items-center gap-1.5">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 font-mono text-xs"
              onClick={() => handlePreset(preset.hours)}
            >
              Last {preset.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 font-mono text-xs text-muted-foreground"
            onClick={handleReset}
          >
            All time
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleApply}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Channel
          </label>
          <Select
            value={channel}
            onValueChange={(value) => setChannel(value ?? ALL_VALUE)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All channels</SelectItem>
              {CHANNELS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="analytics-filter-from"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            From
          </label>
          <Input
            id="analytics-filter-from"
            type="datetime-local"
            value={fromLocal}
            onChange={(e) => setFromLocal(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="analytics-filter-to"
            className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            To
          </label>
          <Input
            id="analytics-filter-to"
            type="datetime-local"
            value={toLocal}
            onChange={(e) => setToLocal(e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" className="flex-1 gap-1.5">
            <Search className="size-3.5" />
            <span>Apply</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            aria-label="Reset analytics filters"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
