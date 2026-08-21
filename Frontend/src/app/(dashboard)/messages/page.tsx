import { MessageSquare } from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";

export default function MessagesIndexPage() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/Image/p1.png"
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 rounded-xl object-cover"
        />
        <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a chat from the list, or start a new one." />
      </div>
    </div>
  );
}
