import { useRef, useState } from 'react';
import { Modal } from 'antd';

import { useIntersectionObserver } from 'hooks/useIntersectionObserver';

import type { DashboardSectionV2 } from '../../../utils';
import { useRenameSection } from '../hooks/useRenameSection';
import { useToggleSectionCollapse } from '../hooks/useToggleSectionCollapse';
import { useDeleteSection } from '../hooks/useDeleteSection';
import type { MovePanelArgs } from '../../Panel/hooks/useMovePanelToSection';
import type { AddPanelArgs } from '../../Panel/hooks/useAddPanelToSection';
import type { DeletePanelArgs } from '../../Panel/hooks/useDeletePanel';
import PanelTypeSelectionModalV2 from '../../Panel/PanelTypeSelectionModalV2/PanelTypeSelectionModalV2';
import RenameSectionModal from '../RenameSectionModal';
import SectionGrid from '../SectionGrid/SectionGrid';
import SectionHeader, {
	type SectionDragHandle,
} from '../SectionHeader/SectionHeader';
import styles from './Section.module.scss';

interface Props {
	section: DashboardSectionV2;
	dashboardId: string | undefined;
	isEditable: boolean;
	onRefetch: () => void;
	/** All sections + move handler, for the per-panel "Move to section" action. */
	sections?: DashboardSectionV2[];
	onMovePanel?: (args: MovePanelArgs) => void;
	/** Adds a panel to this section; present only in editable sectioned mode. */
	onAddPanel?: (args: AddPanelArgs) => void;
	/** Deletes a panel from this section. */
	onDeletePanel?: (args: DeletePanelArgs) => void;
	/** Provided by SortableSection in sectioned mode; absent for untitled/free-flow sections. */
	dragHandle?: SectionDragHandle;
}

function Section({
	section,
	dashboardId,
	isEditable,
	onRefetch,
	sections,
	onMovePanel,
	onAddPanel,
	onDeletePanel,
	dragHandle,
}: Props): JSX.Element {
	const containerRef = useRef<HTMLDivElement>(null);
	// Placeholder signal for lazy panel query-loading (consumed in a later PR):
	// true once the section scrolls into (or near) the viewport.
	const isVisible = useIntersectionObserver(containerRef, {
		rootMargin: '200px',
	});

	const { open, toggle } = useToggleSectionCollapse({
		layoutIndex: section.layoutIndex,
		initialOpen: section.open,
		dashboardId,
	});

	const [isRenaming, setIsRenaming] = useState(false);
	const { rename, isSaving } = useRenameSection({
		layoutIndex: section.layoutIndex,
		dashboardId,
		onRefetch,
	});

	const handleRenameSubmit = async (title: string): Promise<void> => {
		const ok = await rename(title);
		if (ok) {
			setIsRenaming(false);
		}
	};

	const [isAddingPanel, setIsAddingPanel] = useState(false);
	const handleSelectPanelType = (pluginKind: string): void => {
		onAddPanel?.({ layoutIndex: section.layoutIndex, pluginKind });
		setIsAddingPanel(false);
	};

	const { deleteSection } = useDeleteSection({
		section,
		dashboardId,
		onRefetch,
	});
	const confirmDeleteSection = (): void => {
		Modal.confirm({
			title: `Delete section "${section.title ?? ''}"?`,
			content: 'Panels in this section will be removed.',
			okText: 'Delete',
			okButtonProps: { danger: true },
			centered: true,
			onOk: () => deleteSection(),
		});
	};

	const grid = (
		<SectionGrid
			items={section.items}
			layoutIndex={section.layoutIndex}
			dashboardId={dashboardId}
			isEditable={isEditable}
			onRefetch={onRefetch}
			isVisible={isVisible}
			sections={sections}
			onMovePanel={onMovePanel}
			onDeletePanel={onDeletePanel}
		/>
	);

	if (!section.title) {
		// Untitled section — just the grid (no header chrome), but still observed
		// for the viewport signal.
		return (
			<div
				ref={containerRef}
				data-testid={`dashboard-section-${section.id}`}
				data-section-layout-index={section.layoutIndex}
			>
				{grid}
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={styles.section}
			data-testid={`dashboard-section-${section.id}`}
			data-section-layout-index={section.layoutIndex}
		>
			<SectionHeader
				sectionId={section.id}
				title={section.title}
				open={open}
				onToggle={toggle}
				repeatVariable={section.repeatVariable}
				dragHandle={dragHandle}
				onRename={isEditable ? (): void => setIsRenaming(true) : undefined}
				onAddPanel={
					isEditable && onAddPanel ? (): void => setIsAddingPanel(true) : undefined
				}
				onDeleteSection={isEditable ? confirmDeleteSection : undefined}
			/>
			{open ? grid : null}
			<RenameSectionModal
				open={isRenaming}
				initialValue={section.title}
				isSaving={isSaving}
				onClose={(): void => setIsRenaming(false)}
				onSubmit={handleRenameSubmit}
			/>
			<PanelTypeSelectionModalV2
				open={isAddingPanel}
				onClose={(): void => setIsAddingPanel(false)}
				onSelect={handleSelectPanelType}
			/>
		</div>
	);
}

export default Section;
