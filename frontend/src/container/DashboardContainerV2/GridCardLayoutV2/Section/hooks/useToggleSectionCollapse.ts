import { useCallback, useEffect, useState } from 'react';

import { patchDashboardV2 } from 'api/generated/services/dashboard';
import { useErrorModal } from 'providers/ErrorModalProvider';
import APIError from 'types/api/error';

import { setSectionCollapseOp } from '../../../patchOps';

interface Params {
	layoutIndex: number;
	initialOpen: boolean;
	dashboardId: string | undefined;
}

interface Result {
	open: boolean;
	toggle: () => void;
}

/**
 * Owns a section's expand/collapse state. The toggle is optimistic (snappy UI)
 * and persists to `spec.layouts[i].spec.display.collapse.open` in the
 * background — no refetch, since collapse is a lightweight UI preference and a
 * full dashboard refetch would flicker. Reverts on patch failure.
 */
export function useToggleSectionCollapse({
	layoutIndex,
	initialOpen,
	dashboardId,
}: Params): Result {
	const [open, setOpen] = useState<boolean>(initialOpen);
	const { showErrorModal } = useErrorModal();

	// Reconcile with server state when it changes (e.g. after a refetch).
	useEffect(() => {
		setOpen(initialOpen);
	}, [initialOpen]);

	const toggle = useCallback((): void => {
		setOpen((prev) => {
			const next = !prev;
			if (dashboardId) {
				patchDashboardV2({ id: dashboardId }, [
					setSectionCollapseOp(layoutIndex, next),
				]).catch((error) => {
					setOpen(prev); // revert on failure
					showErrorModal(error as APIError);
				});
			}
			return next;
		});
	}, [dashboardId, layoutIndex, showErrorModal]);

	return { open, toggle };
}
