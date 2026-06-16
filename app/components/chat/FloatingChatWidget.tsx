"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChatInterface } from "./ChatInterface";
export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl h-[600px] p-0 flex flex-col">
          <DialogHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <span>AI Chat Assistant</span>
            </DialogTitle>
          </DialogHeader>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
