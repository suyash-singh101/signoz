import { useMemo } from 'react';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import {
	restrictToParentElement,
	restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
	SortableContext,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DashboardtypesLayoutDTO } from 'api/generated/services/sigNoz.schemas';

import type { DashboardSectionV2 } from '../../utils';
import { useSectionDragReorder } from './hooks/useSectionDragReorder';
import { useMovePanelToSection } from '../Panel/hooks/useMovePanelToSection';
import { useAddPanelToSection } from '../Panel/hooks/useAddPanelToSection';
import { useDeletePanel } from '../Panel/hooks/useDeletePanel';
import Section from './Section/Section';
import SectionDragPreview from './SectionDragPreview/SectionDragPreview';
import SortableSection from './SortableSection';

interface Props {
	sections: DashboardSectionV2[];
	layouts: DashboardtypesLayoutDTO[] | undefined | null;
	dashboardId: string | undefined;
	isEditable: boolean;
	onRefetch: () => void;
}

function SectionList({
	sections,
	layouts,
	dashboardId,
	isEditable,
	onRefetch,
}: Props): JSX.Element {
	const {
		sensors,
		orderedSections,
		activeSection,
		onDragStart,
		onDragEnd,
		onDragCancel,
	} = useSectionDragReorder({ sections, layouts, dashboardId, onRefetch });

	const onMovePanel = useMovePanelToSection({
		sections,
		dashboardId,
		onRefetch,
	});
	const onAddPanel = useAddPanelToSection({ sections, dashboardId, onRefetch });
	const onDeletePanel = useDeletePanel({ sections, dashboardId, onRefetch });

	// Only titled sections participate in reordering; untitled (free-flow)
	// blocks render in place without a drag handle.
	const sortableIds = useMemo(
		() => orderedSections.filter((s) => s.title).map((s) => s.id),
		[orderedSections],
	);

	if (!isEditable) {
		return (
			<>
				{sections.map((section) => (
					<Section
						key={section.id}
						section={section}
						dashboardId={dashboardId}
						isEditable={isEditable}
						onRefetch={onRefetch}
					/>
				))}
			</>
		);
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis, restrictToParentElement]}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}
		>
			<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
				{orderedSections.map((section) =>
					section.title ? (
						<SortableSection
							key={section.id}
							section={section}
							dashboardId={dashboardId}
							isEditable={isEditable}
							onRefetch={onRefetch}
							sections={sections}
							onMovePanel={onMovePanel}
							onAddPanel={onAddPanel}
							onDeletePanel={onDeletePanel}
						/>
					) : (
						<Section
							key={section.id}
							section={section}
							dashboardId={dashboardId}
							isEditable={isEditable}
							onRefetch={onRefetch}
							sections={sections}
							onMovePanel={onMovePanel}
							onAddPanel={onAddPanel}
							onDeletePanel={onDeletePanel}
						/>
					),
				)}
			</SortableContext>
			{/* dropAnimation disabled: optimistic reorder already places the section,
			    so animating the overlay back would cause a visible snap/shake. */}
			<DragOverlay dropAnimation={null}>
				{activeSection ? <SectionDragPreview section={activeSection} /> : null}
			</DragOverlay>
		</DndContext>
	);
}

export default SectionList;
