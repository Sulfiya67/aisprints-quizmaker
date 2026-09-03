"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVerticalIcon, PencilIcon, EyeIcon, Trash2Icon } from "lucide-react";

import { DeleteMcqDialog } from "@/components/mcq/delete-mcq-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { McqSummary } from "@/lib/db/mcqs";
import { cn } from "@/lib/utils";

type McqTableProps = {
	mcqs: McqSummary[];
};

type DeleteTarget = {
	id: string;
	name: string;
};

export function McqTable({ mcqs }: McqTableProps) {
	const router = useRouter();
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

	if (mcqs.length === 0) {
		return (
			<div className="mt-8 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
				<h2 className="font-heading text-lg tracking-tight">
					No questions yet
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Create your first multiple-choice question to get started.
				</p>
				<Link
					href="/dashboard/mcqs/new"
					className={cn(buttonVariants({ variant: "default" }), "mt-6")}
				>
					Create MCQ
				</Link>
			</div>
		);
	}

	return (
		<>
			<div className="mt-6 rounded-xl border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="w-[72px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{mcqs.map((mcq) => (
							<TableRow key={mcq.id}>
								<TableCell className="font-medium whitespace-normal">
									{mcq.name}
								</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={`Actions for ${mcq.name}`}
												/>
											}
										>
											<MoreVerticalIcon />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem
												render={
													<Link
														href={`/dashboard/mcqs/${mcq.id}/edit`}
													/>
												}
											>
												<PencilIcon />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												render={
													<Link
														href={`/dashboard/mcqs/${mcq.id}/preview`}
													/>
												}
											>
												<EyeIcon />
												Preview
											</DropdownMenuItem>
											<DropdownMenuItem
												variant="destructive"
												onClick={() =>
													setDeleteTarget({
														id: mcq.id,
														name: mcq.name,
													})
												}
											>
												<Trash2Icon />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{deleteTarget ? (
				<DeleteMcqDialog
					mcqId={deleteTarget.id}
					mcqName={deleteTarget.name}
					open={deleteTarget !== null}
					onOpenChange={(open) => {
						if (!open) {
							setDeleteTarget(null);
						}
					}}
					onDeleted={() => {
						setDeleteTarget(null);
						router.refresh();
					}}
				/>
			) : null}
		</>
	);
}
