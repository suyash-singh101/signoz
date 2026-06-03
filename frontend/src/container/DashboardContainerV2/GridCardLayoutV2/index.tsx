import { useMemo } from 'react';

import { Empty } from 'antd';
import { Typography } from '@signozhq/ui/typography';
import type {
	DashboardtypesLayoutDTO,
	DashboardtypesPanelDTO,
} from 'api/generated/services/sigNoz.schemas';

import { layoutsToSections } from '../utils';
import AddSectionControl from './Section/AddSectionControl/AddSectionControl';
import Section from './Section/Section/Section';
import SectionList from './Section/SectionList';
import styles from './GridCardLayoutV2.module.scss';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface Props {
	layouts: DashboardtypesLayoutDTO[] | undefined | null;
	panels: Record<string, DashboardtypesPanelDTO | undefined> | undefined;
	dashboardId: string | undefined;
	isEditable: boolean;
	onRefetch: () => void;
}

function GridCardLayoutV2({
	layouts,
	panels,
	dashboardId,
	isEditable,
	onRefetch,
}: Props): JSX.Element {
	const sections = useMemo(
		() => layoutsToSections(layouts, panels),
		[layouts, panels],
	);

	const isEmpty =
		sections.length === 0 || sections.every((s) => s.items.length === 0);

	// Sectioned mode = at least one titled layout. Sections then become a
	// draggable, reorderable list; otherwise the dashboard is a single
	// free-flowing grid with no section chrome or reordering.
	const isSectioned = useMemo(() => sections.some((s) => !!s.title), [sections]);

	const renderContent = (): JSX.Element => {
		if (isEmpty) {
			return (
				<div className={styles.emptyState}>
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description={
							<Typography.Text>No panels in this dashboard yet</Typography.Text>
						}
					/>
				</div>
			);
		}

		if (isSectioned) {
			return (
				<SectionList
					sections={sections}
					layouts={layouts}
					dashboardId={dashboardId}
					isEditable={isEditable}
					onRefetch={onRefetch}
				/>
			);
		}

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
	};

	return (
		<>
			{renderContent()}
			{isEditable ? (
				<AddSectionControl
					sections={sections}
					layouts={layouts}
					dashboardId={dashboardId}
					isSectioned={isSectioned}
					onRefetch={onRefetch}
				/>
			) : null}
		</>
	);
}

export default GridCardLayoutV2;
