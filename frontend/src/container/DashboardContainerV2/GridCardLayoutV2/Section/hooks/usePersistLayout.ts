import { useCallback, useState } from 'react';
import type { Layout } from 'react-grid-layout';

import { patchDashboardV2 } from 'api/generated/services/dashboard';
import { useErrorModal } from 'providers/ErrorModalProvider';
import APIError from 'types/api/error';

import { replaceSectionItemsOp } from '../../../patchOps';
import type { GridItemV2 } from '../../../utils';

interface Params {
	layoutIndex: number;
	items: GridItemV2[];
	dashboardId: string | undefined;
	onRefetch: () => void;
}

interface Result {
	handleLayoutChange: (rglLayout: Layout[]) => void;
	isSaving: boolean;
}

/** Maps an RGL layout back onto the section's grid items, preserving panel refs. */
function mergeRglLayout(
	rglLayout: Layout[],
	items: GridItemV2[],
): GridItemV2[] {
	const byId = new Map(items.map((item) => [item.id, item]));
	return rglLayout
		.map((entry) => {
			const existing = byId.get(entry.i);
			if (!existing) {
				return null;
			}
			return {
				...existing,
				x: entry.x,
				y: entry.y,
				width: entry.w,
				height: entry.h,
			};
		})
		.filter((item): item is GridItemV2 => item !== null);
}

function hasGeometryChanged(next: GridItemV2[], prev: GridItemV2[]): boolean {
	if (next.length !== prev.length) {
		return true;
	}
	const prevById = new Map(prev.map((item) => [item.id, item]));
	return next.some((item) => {
		const before = prevById.get(item.id);
		if (!before) {
			return true;
		}
		return (
			before.x !== item.x ||
			before.y !== item.y ||
			before.width !== item.width ||
			before.height !== item.height
		);
	});
}

/**
 * Persists panel geometry within a single section. Call the returned handler
 * from RGL's `onDragStop`/`onResizeStop` (stop events only — not continuous
 * `onLayoutChange`) to limit network churn.
 */
export function usePersistLayout({
	layoutIndex,
	items,
	dashboardId,
	onRefetch,
}: Params): Result {
	const [isSaving, setIsSaving] = useState(false);
	const { showErrorModal } = useErrorModal();

	const handleLayoutChange = useCallback(
		async (rglLayout: Layout[]): Promise<void> => {
			if (!dashboardId) {
				return;
			}
			const nextItems = mergeRglLayout(rglLayout, items);
			if (!hasGeometryChanged(nextItems, items)) {
				return;
			}
			try {
				setIsSaving(true);
				await patchDashboardV2({ id: dashboardId }, [
					replaceSectionItemsOp(layoutIndex, nextItems),
				]);
				onRefetch();
			} catch (error) {
				showErrorModal(error as APIError);
			} finally {
				setIsSaving(false);
			}
		},
		[dashboardId, items, layoutIndex, onRefetch, showErrorModal],
	);

	return { handleLayoutChange, isSaving };
}
