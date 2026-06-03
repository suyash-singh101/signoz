import { useCallback } from 'react';

import { patchDashboardV2 } from 'api/generated/services/dashboard';
import { useErrorModal } from 'providers/ErrorModalProvider';
import APIError from 'types/api/error';

import { removePanelOp, replaceSectionItemsOp } from '../../../patchOps';
import type { DashboardSectionV2 } from '../../../utils';

interface Params {
	sections: DashboardSectionV2[];
	dashboardId: string | undefined;
	onRefetch: () => void;
}

export interface DeletePanelArgs {
	panelId: string;
	layoutIndex: number;
}

/**
 * Removes a panel: drops its item ref from the section's items and deletes the
 * panel from `spec.panels`, as one atomic patch.
 */
export function useDeletePanel({
	sections,
	dashboardId,
	onRefetch,
}: Params): (args: DeletePanelArgs) => Promise<void> {
	const { showErrorModal } = useErrorModal();

	return useCallback(
		async ({ panelId, layoutIndex }: DeletePanelArgs): Promise<void> => {
			if (!dashboardId) {
				return;
			}
			const section = sections.find((s) => s.layoutIndex === layoutIndex);
			if (!section) {
				return;
			}

			const nextItems = section.items.filter((i) => i.id !== panelId);
			try {
				await patchDashboardV2({ id: dashboardId }, [
					replaceSectionItemsOp(layoutIndex, nextItems),
					removePanelOp(panelId),
				]);
				onRefetch();
			} catch (error) {
				showErrorModal(error as APIError);
			}
		},
		[sections, dashboardId, onRefetch, showErrorModal],
	);
}
