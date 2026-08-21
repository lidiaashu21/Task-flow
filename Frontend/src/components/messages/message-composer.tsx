"use client";

import { Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageComposer({ onSend }: { onSend: (body: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setBody("");
    try {
      await onSend(text);
    } catch {
      setBody(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
      <Textarea
        rows={1}
        placeholder="Write a message…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        className="max-h-32 min-h-[2.75rem]"
      />
      <Button className="w-auto shrink-0 px-3" onClick={handleSend} loading={sending} disabled={!body.trim()}>
        <Send className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
