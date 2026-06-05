import type { ContactStatus } from "@/controllers/contacts.functions";
import { STATUS_LABEL } from "@/controllers/contacts.functions";
import { cn } from "@/lib/utils";

const STYLES: Record<ContactStatus, string> = {
  not_contacted: "bg-stone-100 text-stone-500 ring-stone-200/60",
  contacted: "bg-blue-50 text-blue-700 ring-blue-200/60",
  replied: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  follow_up: "bg-amber-50 text-amber-700 ring-amber-200/60",
  nurturing: "bg-violet-50 text-violet-700 ring-violet-200/60",
};

export function StatusBadge({ status, className }: { status: ContactStatus; className?: string }) {
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium ring-1",
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
