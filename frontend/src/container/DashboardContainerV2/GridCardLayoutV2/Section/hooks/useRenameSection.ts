import { useCallback, useState } from 'react';

import { patchDashboardV2 } from 'api/generated/services/dashboard';
import { useErrorModal } from 'providers/ErrorModalProvider';
import APIError from 'types/api/error';

import { renameSectionOp } from '../../../patchOps';

interface Params {
	layoutIndex: number;
	dashboardId: string | undefined;
	onRefetch: () => void;
}

interface Result {
	rename: (title: string) => Promise<boolean>;
	isSaving: boolean;
}

/** Renames a section's title via `replace /spec/layouts/<i>/spec/display/title`. */
export function useRenameSection({
	layoutIndex,
	dashboardId,
	onRefetch,
}: Params): Result {
	const [isSaving, setIsSaving] = useState(false);
	const { showErrorModal } = useErrorModal();

	const rename = useCallback(
		async (title: string): Promise<boolean> => {
			const trimmed = title.trim();
			if (!dashboardId || !trimmed) {
				return false;
			}
			try {
				setIsSaving(true);
				await patchDashboardV2({ id: dashboardId }, [
					renameSectionOp(layoutIndex, trimmed),
				]);
				onRefetch();
				return true;
			} catch (error) {
				showErrorModal(error as APIError);
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[dashboardId, layoutIndex, onRefetch, showErrorModal],
	);

	return { rename, isSaving };
}
