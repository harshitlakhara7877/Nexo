import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DeleteChatDialog({
  open,
  onOpenChange,
  contact,
  onConfirm,
  deleting,
}) {
  const name =
    contact?.name || contact?.username || "this person";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!deleting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-sm rounded-2xl border border-[#E4E1DB] bg-white p-0 dark:border-[#262626] dark:bg-[#181818]">
        <div className="px-6 pb-5 pt-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40">
            <AlertTriangle size={27} />
          </span>

          <DialogTitle className="mt-4 text-lg font-semibold text-[#1B1C20] dark:text-white">
            Delete this chat?
          </DialogTitle>

          <DialogDescription className="mt-2 text-sm leading-6 text-[#686A72] dark:text-neutral-400">
            This conversation with{" "}
            <span className="font-semibold text-[#1B1C20] dark:text-white">
              {name}
            </span>{" "}
            will be removed from your inbox. It won't delete the
            other person's copy of the conversation.
          </DialogDescription>
        </div>

        <div className="flex gap-3 border-t border-[#E4E1DB] bg-[#FCFBF9] dark:border-[#262626] dark:bg-[#151515] px-5 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
            className="flex-1 border-[#E4E1DB] text-[#1B1C20] hover:bg-[#F7F6F3] dark:border-[#333] dark:text-white dark:hover:bg-[#222]"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex-1 gap-2 bg-red-500 text-white hover:bg-red-600"
          >
            {deleting ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}

            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}