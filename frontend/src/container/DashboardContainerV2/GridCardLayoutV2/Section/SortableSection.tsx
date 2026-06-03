import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { DashboardSectionV2 } from '../../utils';
import type { MovePanelArgs } from '../Panel/hooks/useMovePanelToSection';
import type { AddPanelArgs } from '../Panel/hooks/useAddPanelToSection';
import type { DeletePanelArgs } from '../Panel/hooks/useDeletePanel';
import Section from './Section/Section';

interface Props {
	section: DashboardSectionV2;
	dashboardId: string | undefined;
	isEditable: boolean;
	onRefetch: () => void;
	sections: DashboardSectionV2[];
	onMovePanel: (args: MovePanelArgs) => void;
	onAddPanel: (args: AddPanelArgs) => void;
	onDeletePanel: (args: DeletePanelArgs) => void;
}

function SortableSection({
	section,
	dashboardId,
	isEditable,
	onRefetch,
	sections,
	onMovePanel,
	onAddPanel,
	onDeletePanel,
}: Props): JSX.Element {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: section.id });

	// dnd-kit drives the drag transform per-frame, so this must be an inline
	// style — there is no static-stylesheet equivalent for a live transform.
	// While dragging, the original is hidden (the DragOverlay renders the moving
	// preview); keeping it in place preserves the gap and lets siblings animate.
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0 : undefined,
	};

	return (
		<div ref={setNodeRef} style={style}>
			<Section
				section={section}
				dashboardId={dashboardId}
				isEditable={isEditable}
				onRefetch={onRefetch}
				sections={sections}
				onMovePanel={onMovePanel}
				onAddPanel={onAddPanel}
				onDeletePanel={onDeletePanel}
				dragHandle={{ attributes, listeners, setActivatorNodeRef }}
			/>
		</div>
	);
}

export default SortableSection;
