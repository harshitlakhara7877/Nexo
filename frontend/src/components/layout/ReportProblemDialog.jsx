import { useState } from "react";
import { AlertCircle, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const problemTypes = [
  { value: "bug", label: "Something isn't working" },
  { value: "feedback", label: "General feedback" },
  { value: "content", label: "Inappropriate content or spam" },
  { value: "other", label: "Other problem" },
];

export default function ReportProblemDialog({ open, onOpenChange }) {
  const [problemType, setProblemType] = useState("bug");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || submitting) return;

    setSubmitting(true);
    try {
      // Simulate/persist problem report
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Thank you for your feedback. We're looking into this issue.");
      setDescription("");
      setProblemType("bug");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white p-0 text-[#1B1C20] shadow-2xl dark:border-[#262626] dark:bg-[#181818] dark:text-white"
      >
        <header className="flex items-center justify-between border-b border-[#E4E1DB] px-5 py-4 dark:border-[#262626]">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#2A180E]">
              <AlertCircle size={18} />
            </span>
            <DialogTitle className="text-base font-semibold">Report a problem</DialogTitle>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-full text-[#686A72] hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col p-5 gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#686A72] dark:text-neutral-400">
              Type of issue
            </label>
            <select
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
              className="w-full rounded-xl border border-[#E4E1DB] bg-[#F7F6F3] p-2.5 text-sm text-[#1B1C20] outline-none transition focus:border-[#FF4D00] dark:border-[#333333] dark:bg-[#202020] dark:text-white"
            >
              {problemTypes.map((t) => (
                <option key={t.value} value={t.value} className="bg-white dark:bg-[#202020]">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#686A72] dark:text-neutral-400">
              Please explain what happened
            </label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly explain what went wrong and how we can reproduce it..."
              className="w-full resize-none rounded-xl border border-[#E4E1DB] bg-[#F7F6F3] p-3 text-sm text-[#1B1C20] outline-none transition placeholder-[#9A9CA3] focus:border-[#FF4D00] dark:border-[#333333] dark:bg-[#202020] dark:text-white dark:placeholder-neutral-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-[#E4E1DB] px-4 py-2 text-xs font-semibold text-[#1B1C20] transition hover:bg-[#F7F6F3] dark:border-[#333333] dark:text-neutral-300 dark:hover:bg-[#262626]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!description.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF4D00] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#E64400] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <LoaderCircle size={14} className="animate-spin" />}
              Send report
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
