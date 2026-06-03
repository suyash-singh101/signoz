import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	type DragEndEvent,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { patchDashboardV2 } from 'api/generated/services/dashboard';
import type { DashboardtypesLayoutDTO } from 'api/generated/services/sigNoz.schemas';
import { useErrorModal } from 'providers/ErrorModalProvider';
import APIError from 'types/api/error';

import { reorderLayoutsOp } from '../../../patchOps';
import type { DashboardSectionV2 } from '../../../utils';

interface Params {
	sections: DashboardSectionV2[];
	layouts: DashboardtypesLayoutDTO[] | undefined | null;
	dashboardId: string | undefined;
	onRefetch: () => void;
}

interface Result {
	sensors: ReturnType<typeof useSensors>;
	/** Display order — optimistically reordered on drop so the UI doesn't wait on refetch. */
	orderedSections: DashboardSectionV2[];
	/** The section currently being dragged (for the DragOverlay preview), or null. */
	activeSection: DashboardSectionV2 | null;
	onDragStart: (event: DragStartEvent) => void;
	onDragEnd: (event: DragEndEvent) => void;
	onDragCancel: () => void;
}

/**
 * Owns section-reorder drag state. Reorders happen optimistically in local
 * state (keyed by stable section id) and persist via a single
 * `replace /spec/layouts` patch; the optimistic order is cleared once fresh
 * server data arrives. Each section maps 1:1 to a Grid layout via `layoutIndex`,
 * so the new layouts array is rebuilt by mapping the reordered sections back.
 */
export function useSectionDragReorder({
	sections,
	layouts,
	dashboardId,
	onRefetch,
}: Params): Result {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [localOrderIds, setLocalOrderIds] = useState<string[] | null>(null);
	const { showErrorModal } = useErrorModal();

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	// Server data is the source of truth — drop optimistic order whenever it changes.
	useEffect(() => {
		setLocalOrderIds(null);
	}, [sections]);

	const orderedSections = useMemo<DashboardSectionV2[]>(() => {
		if (!localOrderIds) {
			return sections;
		}
		const byId = new Map(sections.map((s) => [s.id, s]));
		const ordered = localOrderIds
			.map((id) => byId.get(id))
			.filter((s): s is DashboardSectionV2 => s !== undefined);
		return ordered.length === sections.length ? ordered : sections;
	}, [sections, localOrderIds]);

	const onDragStart = useCallback((event: DragStartEvent): void => {
		setActiveId(String(event.active.id));
	}, []);

	const onDragCancel = useCallback((): void => {
		setActiveId(null);
	}, []);

	const onDragEnd = useCallback(
		async (event: DragEndEvent): Promise<void> => {
			setActiveId(null);
			const { active, over } = event;
			if (!over || active.id === over.id || !dashboardId || !layouts) {
				return;
			}

			const oldIndex = orderedSections.findIndex((s) => s.id === active.id);
			const newIndex = orderedSections.findIndex((s) => s.id === over.id);
			if (oldIndex < 0 || newIndex < 0) {
				return;
			}

			const newOrdered = arrayMove(orderedSections, oldIndex, newIndex);
			setLocalOrderIds(newOrdered.map((s) => s.id));

			const newLayouts = newOrdered
				.map((s) => layouts[s.layoutIndex])
				.filter((l): l is DashboardtypesLayoutDTO => l !== undefined);

			try {
				await patchDashboardV2({ id: dashboardId }, [reorderLayoutsOp(newLayouts)]);
				onRefetch();
			} catch (error) {
				setLocalOrderIds(null); // revert optimistic order on failure
				showErrorModal(error as APIError);
			}
		},
		[orderedSections, layouts, dashboardId, onRefetch, showErrorModal],
	);

	const activeSection = useMemo(
		() => orderedSections.find((s) => s.id === activeId) ?? null,
		[orderedSections, activeId],
	);

	return {
		sensors,
		orderedSections,
		activeSection,
		onDragStart,
		onDragEnd,
		onDragCancel,
	};
}
