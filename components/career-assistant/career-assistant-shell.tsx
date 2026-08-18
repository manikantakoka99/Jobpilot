"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bot, Plus, User, Loader2, Send, MessagesSquare, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { cn } from "@/lib/utils";
import {
  createCareerAssistantSessionAction,
  sendCareerAssistantMessageAction,
  deleteCareerAssistantSessionAction,
} from "@/app/dashboard/career-assistant/actions";
import type { CareerAssistantSessionSummary, CareerAssistantSessionDetail } from "@/services/career-assistant-service";
import type { CareerAssistantMessageRow } from "@/types/database";

interface CareerAssistantShellProps {
  sessions: CareerAssistantSessionSummary[];
  activeSessionId: string | null;
  initialDetail: CareerAssistantSessionDetail | null;
}

export function CareerAssistantShell({ sessions, activeSessionId, initialDetail }: CareerAssistantShellProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);

  async function handleNewConversation() {
    setIsCreating(true);
    const result = await createCareerAssistantSessionAction();
    setIsCreating(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.push(`/dashboard/career-assistant/${result.data.sessionId}`);
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
      <aside className={cn("flex min-h-0 flex-col gap-2", activeSessionId && "hidden md:flex")}>
        <Button type="button" onClick={handleNewConversation} disabled={isCreating} className="w-full">
          {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New conversation
        </Button>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground px-2 py-4 text-center text-xs">No conversations yet.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg",
                  s.id === activeSessionId ? "bg-primary/10" : "hover:bg-muted/50",
                )}
              >
                <Link href={`/dashboard/career-assistant/${s.id}`} className="min-w-0 flex-1 px-3 py-2">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                </Link>
                <div className="opacity-0 group-hover:opacity-100">
                  <ConfirmDeleteButton
                    action={() => deleteCareerAssistantSessionAction(s.id)}
                    label=""
                    successMessage="Conversation deleted"
                    onDeleted={() => {
                      if (s.id === activeSessionId) router.push("/dashboard/career-assistant");
                      else router.refresh();
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        {activeSessionId && initialDetail ? (
          <ChatPane sessionId={activeSessionId} initialMessages={initialDetail.messages} />
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="Start a conversation"
            description="Ask about your applications, ATS scores, resume versions, or interview history — grounded only in your real JobPilot data."
            action={
              <Button type="button" onClick={handleNewConversation} disabled={isCreating}>
                {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                New conversation
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
}

function ChatPane({ sessionId, initialMessages }: { sessionId: string; initialMessages: CareerAssistantMessageRow[] }) {
  const [messages, setMessages] = React.useState(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft("");
    setIsSending(true);

    const result = await sendCareerAssistantMessageAction(sessionId, text);
    setIsSending(false);

    if (!result.success) {
      toast.error(result.error);
      setDraft(text);
      return;
    }
    setMessages((prev) => [...prev, result.data.userMessage, result.data.assistantMessage]);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border flex items-center gap-2 border-b p-3 md:hidden">
        <Link href="/dashboard/career-assistant" className="text-muted-foreground flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> All conversations
        </Link>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <EmptyState
            icon={Bot}
            title="Ask me anything about your JobPilot data"
            description={`e.g. "How many applications are in Interview stage?" or "What's my average ATS score?"`}
          />
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm text-pretty",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-2.5">
            <div className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
              <Bot className="size-3.5" />
            </div>
            <div className="bg-muted flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5">
              <Loader2 className="size-3.5 animate-spin" />
              <span className="text-muted-foreground text-xs">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-border flex items-end gap-2 border-t p-3">
        <Textarea
          placeholder="Ask about your applications, ATS scores, resumes…"
          className="max-h-32 min-h-10 resize-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isSending}
          maxLength={4000}
        />
        <Button type="button" size="icon" onClick={handleSend} disabled={isSending || !draft.trim()}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
