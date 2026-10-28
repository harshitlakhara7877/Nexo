import { useState } from "react";
import {
  AlertTriangle,
  Flag,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const reasons = [
  {
    value: "spam",
    label: "Spam",
  },
  {
    value: "harassment",
    label: "Harassment or bullying",
  },
  {
    value: "inappropriate",
    label: "Inappropriate content",
  },
  {
    value: "impersonation",
    label: "Impersonation",
  },
  {
    value: "other",
    label: "Something else",
  },
];

export default function ReportDialog({
  open,
  onOpenChange,
  contact,
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && submitting) return;

    onOpenChange(nextOpen);

    if (!nextOpen) {
      setReason("");
      setDetails("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason || submitting) return;

    setSubmitting(true);

    try {
      await onSubmit({
        reason,
        details: details.trim(),
      });

      setReason("");
      setDetails("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white p-0 dark:border-[#262626] dark:bg-[#181818]">
        <header className="flex items-center justify-between border-b border-[#E4E1DB] dark:border-[#262626] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40">
              <Flag size={19} />
            </span>

            <div>
              <DialogTitle className="text-base font-semibold text-[#1B1C20] dark:text-white">
                Report account
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs text-[#686A72] dark:text-neutral-400">
                @{contact?.username || "user"}
              </DialogDescription>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-5">
            <div>
              <h3 className="text-sm font-semibold text-[#1B1C20] dark:text-white">
                Why are you reporting this account?
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#686A72] dark:text-neutral-400">
                Choose the reason that best describes the problem.
              </p>
            </div>

            <div className="space-y-2">
              {reasons.map((item) => (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                    reason === item.value
                      ? "border-[#FF4D00] bg-[#FFF7F2] dark:bg-[#2A180E] dark:border-[#FF4D00]"
                      : "border-[#E4E1DB] hover:bg-[#FCFBF9] dark:border-[#262626] dark:hover:bg-[#222]"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={(event) =>
                      setReason(event.target.value)
                    }
                    className="size-4 accent-[#FF4D00]"
                  />

                  <span className="text-sm text-[#1B1C20] dark:text-white">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label
                htmlFor="report-details"
                className="mb-2 block text-sm font-medium text-[#1B1C20] dark:text-white"
              >
                Additional details{" "}
                <span className="font-normal text-[#85858D] dark:text-neutral-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="report-details"
                value={details}
                onChange={(event) =>
                  setDetails(event.target.value.slice(0, 1000))
                }
                rows={3}
                placeholder="Describe the issue..."
                className="w-full resize-y rounded-xl border border-[#E4E1DB] px-3 py-2.5 text-sm text-[#1B1C20] outline-none placeholder:text-[#9A9CA3] focus:border-[#FF4D00] dark:border-[#262626] dark:bg-[#121212] dark:text-white dark:placeholder:text-neutral-500"
              />

              <p className="mt-1 text-right text-[11px] text-[#85858D] dark:text-neutral-500">
                {details.length}/1000
              </p>
            </div>

            <div className="flex gap-2 rounded-xl bg-[#F7F6F3] dark:bg-[#202020] p-3">
              <AlertTriangle
                size={17}
                className="mt-0.5 shrink-0 text-[#85858D] dark:text-neutral-400"
              />

              <p className="text-xs leading-5 text-[#686A72] dark:text-neutral-400">
                Reports should be accurate. Your report will be
                associated with this account.
              </p>
            </div>
          </div>

          <footer className="flex justify-end gap-3 border-t border-[#E4E1DB] bg-[#FCFBF9] dark:border-[#262626] dark:bg-[#151515] px-5 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
              className="border-[#E4E1DB] text-[#1B1C20] dark:border-[#333] dark:text-white dark:hover:bg-[#222]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={!reason || submitting}
              className="gap-2 bg-red-500 text-white hover:bg-red-600"
            >
              {submitting && (
                <LoaderCircle size={16} className="animate-spin" />
              )}

              Submit report
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}