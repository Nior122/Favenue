import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, ExternalLink } from "lucide-react";

interface UnlockPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  postTitle?: string;
}

export default function UnlockPopup({ isOpen, onClose, onUnlock, postTitle }: UnlockPopupProps) {
  const handleUnlockClick = () => {
    // Open the unlock link in a new tab
    window.open('https://loadingup.vercel.app/', '_blank');
    
    // Mark this image as unlocked (this will start the 5-second timer)
    onUnlock();
    
    // Close the popup
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gray-900 border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-white flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            Content Locked
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          <div className="text-center">
            <p className="text-gray-300 mb-2">
              To view this content, please complete a quick verification
            </p>
            {postTitle && (
              <p className="text-sm text-gray-400">
                "{postTitle}"
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleUnlockClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 flex items-center justify-center gap-2"
              size="lg"
            >
              <ExternalLink className="w-4 h-4" />
              Unlock for Free
            </Button>

            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            You'll be redirected to complete verification. After completing, this content will be unlocked permanently.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}