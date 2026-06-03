import { FullScreen, useFullScreenHandle } from 'react-full-screen';

import useComponentPermission from 'hooks/useComponentPermission';
import { useAppContext } from 'providers/App/App';

import DashboardDescriptionV2 from './DashboardDescriptionV2';
import GridCardLayoutV2 from './GridCardLayoutV2';
import type { V2Dashboard } from './utils';
import styles from './DashboardContainerV2.module.scss';

interface Props {
	dashboard: V2Dashboard | undefined;
	onRefetch: () => void;
}

function DashboardContainerV2({ dashboard, onRefetch }: Props): JSX.Element {
	const fullScreenHandle = useFullScreenHandle();
	const spec = dashboard?.spec;

	const { user } = useAppContext();
	const [editDashboard] = useComponentPermission(['edit_dashboard'], user.role);
	const isEditable = !dashboard?.locked && editDashboard;

	return (
		<FullScreen handle={fullScreenHandle}>
			<div className={styles.container}>
				<DashboardDescriptionV2
					dashboard={dashboard}
					handle={fullScreenHandle}
					onRefetch={onRefetch}
				/>
				<div className={styles.body}>
					<GridCardLayoutV2
						layouts={spec?.layouts}
						panels={spec?.panels ?? undefined}
						dashboardId={dashboard?.id}
						isEditable={isEditable}
						onRefetch={onRefetch}
					/>
				</div>
			</div>
		</FullScreen>
	);
}

export default DashboardContainerV2;
