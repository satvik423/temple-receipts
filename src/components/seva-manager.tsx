"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SevaFormDialog } from "@/components/seva-form-dialog";
import { formatCurrency } from "@/lib/format";
import type { SevaDTO } from "@/lib/dto";

export function SevaManager({ sevas }: { sevas: SevaDTO[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingSeva, setEditingSeva] = React.useState<SevaDTO | null>(null);
  const [deletingSeva, setDeletingSeva] = React.useState<SevaDTO | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

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
        <h1 className="text-lg font-semibold">Sevas</h1>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sevas.map((seva) => (
                    <TableRow key={seva.id}>
                      <TableCell className="font-medium">{seva.name}</TableCell>
                      <TableCell>
                        {seva.price === null ? (
                          <Badge variant="secondary">Custom</Badge>
                        ) : (
                          formatCurrency(seva.price)
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={seva.active}
                            disabled={togglingId === seva.id}
                            onCheckedChange={() => toggleActive(seva)}
                          />
                          <span className="text-sm text-muted-foreground">
                            {seva.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              your seva list and the Sell page.
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
