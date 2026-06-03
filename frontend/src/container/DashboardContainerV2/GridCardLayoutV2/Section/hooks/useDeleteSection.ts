import { useCallback, useState } from 'react';

import { patchDashboardV2 } from 'api/generated/services/dashboard';
import type { DashboardtypesJSONPatchOperationDTO } from 'api/generated/services/sigNoz.schemas';
import { useErrorModal } from 'providers/ErrorModalProvider';
import APIError from 'types/api/error';

import { removePanelOp, removeSectionOp } from '../../../patchOps';
import type { DashboardSectionV2 } from '../../../utils';

interface Params {
	section: DashboardSectionV2;
	dashboardId: string | undefined;
	onRefetch: () => void;
}

interface Result {
	deleteSection: () => Promise<void>;
	isSaving: boolean;
}

/**
 * Deletes a section: removes its Grid layout and deletes every panel it
 * contained from `spec.panels` (orphan cleanup), as one atomic patch.
 */
export function useDeleteSection({
	section,
	dashboardId,
	onRefetch,
}: Params): Result {
	const [isSaving, setIsSaving] = useState(false);
	const { showErrorModal } = useErrorModal();

	const deleteSection = useCallback(async (): Promise<void> => {
		if (!dashboardId) {
			return;
		}
		const ops: DashboardtypesJSONPatchOperationDTO[] = section.items.map((i) =>
			removePanelOp(i.id),
		);
		ops.push(removeSectionOp(section.layoutIndex));
		try {
			setIsSaving(true);
			await patchDashboardV2({ id: dashboardId }, ops);
			onRefetch();
		} catch (error) {
			showErrorModal(error as APIError);
		} finally {
			setIsSaving(false);
		}
	}, [section, dashboardId, onRefetch, showErrorModal]);

	return { deleteSection, isSaving };
}
