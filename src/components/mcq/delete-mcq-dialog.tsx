"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { deleteMcq } from "@/lib/mcq/api";

type DeleteMcqDialogProps = {
	mcqId: string;
	mcqName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: () => void;
};

export function DeleteMcqDialog({
	mcqId,
	mcqName,
	open,
	onOpenChange,
	onDeleted,
}: DeleteMcqDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleDelete() {
		setIsDeleting(true);
		setError(null);

		try {
			await deleteMcq(mcqId);
			onOpenChange(false);
			onDeleted();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Unable to delete question. Please try again.",
			);
		} finally {
			setIsDeleting(false);
		}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setError(null);
		}

		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent showCloseButton={!isDeleting}>
				<DialogHeader>
					<DialogTitle>Delete question</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete &quot;{mcqName}&quot;? This
						action cannot be undone.
					</DialogDescription>
				</DialogHeader>

				{error ? (
					<p className="text-sm text-destructive" role="alert">{error}</p>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
