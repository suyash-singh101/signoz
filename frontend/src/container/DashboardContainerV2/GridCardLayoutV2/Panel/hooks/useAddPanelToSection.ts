import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';

import { patchDashboardV2 } from 'api/generated/services/dashboard';
import { useErrorModal } from 'providers/ErrorModalProvider';
import APIError from 'types/api/error';

import {
	addPanelToSectionOps,
	createDefaultPanel,
	panelRef,
} from '../../../patchOps';
import type { DashboardSectionV2 } from '../../../utils';

interface Params {
	sections: DashboardSectionV2[];
	dashboardId: string | undefined;
	onRefetch: () => void;
}

export interface AddPanelArgs {
	layoutIndex: number;
	pluginKind: string;
}

/**
 * Creates a new panel and places its item ref at the bottom of the target
 * section, as one atomic patch. Structure-only: the panel is a valid minimal
 * placeholder (its query is filled in once the panel editor lands).
 */
export function useAddPanelToSection({
	sections,
	dashboardId,
	onRefetch,
}: Params): (args: AddPanelArgs) => Promise<void> {
	const { showErrorModal } = useErrorModal();

	return useCallback(
		async ({ layoutIndex, pluginKind }: AddPanelArgs): Promise<void> => {
			if (!dashboardId) {
				return;
			}
			const target = sections.find((s) => s.layoutIndex === layoutIndex);
			if (!target) {
				return;
			}

			const panelId = uuid();
			const nextY = target.items.reduce(
				(max, i) => Math.max(max, i.y + i.height),
				0,
			);

			try {
				await patchDashboardV2(
					{ id: dashboardId },
					addPanelToSectionOps({
						panelId,
						panel: createDefaultPanel(pluginKind),
						layoutIndex,
						item: {
							x: 0,
							y: nextY,
							width: 6,
							height: 6,
							content: { $ref: panelRef(panelId) },
						},
					}),
				);
				onRefetch();
			} catch (error) {
				showErrorModal(error as APIError);
			}
		},
		[sections, dashboardId, onRefetch, showErrorModal],
	);
}
