import { Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";

interface JoinSessionPopupProps {
  meetingUrl: string;
  otherPersonName: string;
  onDismiss: () => void;
}

export function JoinSessionPopup({ meetingUrl, otherPersonName, onDismiss }: JoinSessionPopupProps) {
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onDismiss(); }}>
      <DialogContent className="sm:max-w-[440px] text-center">
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Video className="h-10 w-10 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Your Demo Session is Live! 🎥</h2>
          {otherPersonName && (
            <p className="text-muted-foreground mb-6">
              {otherPersonName} is waiting for you
            </p>
          )}

          <Button
            size="lg"
            className="w-full text-lg py-6 font-bold"
            onClick={() => {
              window.open(meetingUrl, "_blank", "noopener,noreferrer");
              onDismiss();
            }}
          >
            <Video className="mr-3 h-6 w-6" />
            Join Demo Now
          </Button>

          <button
            onClick={onDismiss}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            I'll join later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
