"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SevaFormDialog } from "@/components/seva-form-dialog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SevaDTO } from "@/lib/dto";

export function SevaManager({ sevas: initialSevas }: { sevas: SevaDTO[] }) {
  const router = useRouter();
  const [sevas, setSevas] = React.useState(initialSevas);
  const [syncedSevas, setSyncedSevas] = React.useState(initialSevas);
  if (initialSevas !== syncedSevas) {
    setSyncedSevas(initialSevas);
    setSevas(initialSevas);
  }
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingSeva, setEditingSeva] = React.useState<SevaDTO | null>(null);
  const [deletingSeva, setDeletingSeva] = React.useState<SevaDTO | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const rowRefs = React.useRef<Map<string, HTMLElement>>(new Map());

  async function persistOrder(ordered: SevaDTO[]) {
    const res = await fetch("/api/sevas/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((seva) => seva.id) }),
    });
    if (!res.ok) {
      toast.error("Could not save the new order");
      router.refresh();
    }
  }

  function reorder(id: string, overId: string) {
    if (id === overId) return;
    setSevas((prev) => {
      const fromIndex = prev.findIndex((seva) => seva.id === id);
      const toIndex = prev.findIndex((seva) => seva.id === overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = prev.slice();
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function findRowIdAtPoint(clientY: number): string | null {
    for (const [id, el] of rowRefs.current) {
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) return id;
    }
    return null;
  }

  function handleDragHandlePointerDown(id: string, e: React.PointerEvent) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    setDraggingId(id);

    function onMove(ev: PointerEvent) {
      const overId = findRowIdAtPoint(ev.clientY);
      if (overId) reorder(id, overId);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDraggingId(null);
      setSevas((current) => {
        persistOrder(current);
        return current;
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleDragHandleKeyDown(id: string, e: React.KeyboardEvent) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const index = sevas.findIndex((seva) => seva.id === id);
    const targetIndex = e.key === "ArrowUp" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sevas.length) return;
    const overId = sevas[targetIndex].id;
    reorder(id, overId);
    setSevas((current) => {
      persistOrder(current);
      return current;
    });
  }

  async function toggleActive(seva: SevaDTO) {
    setTogglingId(seva.id);
    try {
      const res = await fetch(`/api/sevas/${seva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !seva.active }),
      });

      if (!res.ok) {
        toast.error("Could not update seva");
        return;
      }

      toast.success(seva.active ? "Seva deactivated" : "Seva activated");
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deletingSeva) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sevas/${deletingSeva.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete seva");
        return;
      }
      toast.success("Seva deleted");
      setDeletingSeva(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Add Seva</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add Seva
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Sevas</CardTitle>
        </CardHeader>
        <CardContent>
          {sevas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sevas yet. Add your first one to get started.
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {sevas.map((seva) => (
                <div
                  key={seva.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(seva.id, el);
                    else rowRefs.current.delete(seva.id);
                  }}
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-2 p-3",
                    draggingId === seva.id && "bg-secondary/60",
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Reorder ${seva.name}`}
                    className="shrink-0 touch-none text-muted-foreground hover:text-foreground"
                    style={{ touchAction: "none" }}
                    onPointerDown={(e) => handleDragHandlePointerDown(seva.id, e)}
                    onKeyDown={(e) => handleDragHandleKeyDown(seva.id, e)}
                  >
                    <GripVertical className="size-4" />
                  </button>

                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate font-medium">{seva.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {seva.price === null ? (
                        <Badge variant="secondary">Custom</Badge>
                      ) : (
                        formatCurrency(seva.price)
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
                      checked={seva.active}
                      disabled={togglingId === seva.id}
                      onCheckedChange={() => toggleActive(seva)}
                    />
                    <span className="text-sm whitespace-nowrap text-muted-foreground">
                      {seva.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="ml-auto flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${seva.name}`}
                      onClick={() => setEditingSeva(seva)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${seva.name}`}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeletingSeva(seva)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SevaFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => router.refresh()}
      />
      <SevaFormDialog
        seva={editingSeva}
        open={editingSeva !== null}
        onOpenChange={(open) => !open && setEditingSeva(null)}
        onSaved={() => router.refresh()}
      />

      <AlertDialog
        open={deletingSeva !== null}
        onOpenChange={(open) => !open && setDeletingSeva(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingSeva?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This can&apos;t be undone. Past receipts already keep their own copy of this
              seva&apos;s name and price, so history stays intact — but it will be removed from
              your seva list and the Seva page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
