import { useCallback, useMemo } from 'react';
import GridLayout, {
	type ItemCallback,
	WidthProvider,
	type Layout,
} from 'react-grid-layout';

import type { DashboardSectionV2 } from '../../../utils';
import { usePersistLayout } from '../hooks/usePersistLayout';
import type { MovePanelArgs } from '../../Panel/hooks/useMovePanelToSection';
import type { DeletePanelArgs } from '../../Panel/hooks/useDeletePanel';
import PanelV2 from '../../Panel/PanelV2/PanelV2';
import styles from './SectionGrid.module.scss';

const ResponsiveGridLayout = WidthProvider(GridLayout);

interface Props {
	items: DashboardSectionV2['items'];
	layoutIndex: number;
	dashboardId: string | undefined;
	isEditable: boolean;
	onRefetch: () => void;
	/** Forwarded to panels — true when the parent section is in the viewport. */
	isVisible?: boolean;
	/** All sections + move handler — present only in editable sectioned mode (panel "Move to section"). */
	sections?: DashboardSectionV2[];
	onMovePanel?: (args: MovePanelArgs) => void;
	onDeletePanel?: (args: DeletePanelArgs) => void;
}

function SectionGrid({
	items,
	layoutIndex,
	dashboardId,
	isEditable,
	onRefetch,
	isVisible,
	sections,
	onMovePanel,
	onDeletePanel,
}: Props): JSX.Element {
	const rglLayout = useMemo<Layout[]>(
		() =>
			items.map((item) => ({
				i: item.id,
				x: item.x,
				y: item.y,
				w: item.width,
				h: item.height,
			})),
		[items],
	);

	const { handleLayoutChange } = usePersistLayout({
		layoutIndex,
		items,
		dashboardId,
		onRefetch,
	});

	// On drop, if the pointer is released over a different section, move the
	// panel there instead of repositioning it within this section. RGL clamps
	// the dragged item visually to this grid, but the pointer is free, so we
	// hit-test the release point against section containers.
	const handleDragStop = useCallback<ItemCallback>(
		// eslint-disable-next-line max-params -- signature fixed by react-grid-layout's ItemCallback
		(layout, oldItem, _newItem, _placeholder, event) => {
			// Deterministically hit-test the release point against section
			// containers (rect-based, so the dragged item on top doesn't interfere).
			const targetEl = Array.from(
				document.querySelectorAll<HTMLElement>('[data-section-layout-index]'),
			).find((el) => {
				const r = el.getBoundingClientRect();
				return (
					event.clientX >= r.left &&
					event.clientX <= r.right &&
					event.clientY >= r.top &&
					event.clientY <= r.bottom
				);
			});
			const attr = targetEl?.getAttribute('data-section-layout-index');
			const targetIndex = attr != null ? Number(attr) : null;

			if (onMovePanel && targetIndex != null && targetIndex !== layoutIndex) {
				onMovePanel({
					panelId: oldItem.i,
					fromLayoutIndex: layoutIndex,
					toLayoutIndex: targetIndex,
				});
				return;
			}
			handleLayoutChange(layout);
		},
		[onMovePanel, layoutIndex, handleLayoutChange],
	);

	return (
		<ResponsiveGridLayout
			className={styles.grid}
			cols={12}
			rowHeight={45}
			autoSize
			useCSSTransforms
			layout={rglLayout}
			draggableHandle=".panel-drag-handle"
			isDraggable={isEditable}
			isResizable={isEditable}
			onDragStop={handleDragStop}
			onResizeStop={handleLayoutChange}
			margin={[8, 8]}
		>
			{items.map((item) => (
				<div key={item.id}>
					<PanelV2
						panel={item.panel}
						panelId={item.id}
						isVisible={isVisible}
						currentLayoutIndex={layoutIndex}
						sections={isEditable ? sections : undefined}
						onMovePanel={isEditable ? onMovePanel : undefined}
						onDeletePanel={isEditable ? onDeletePanel : undefined}
					/>
				</div>
			))}
		</ResponsiveGridLayout>
	);
}

export default SectionGrid;
