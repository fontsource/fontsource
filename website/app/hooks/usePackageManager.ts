import { useLocalStorage } from '@mantine/hooks';

import { deserializeStoredChoice } from '@/utils/browser-storage';
import { packageManagerValues } from '@/utils/docs/packageManagers';

const usePackageManager = (defaultValue: string) =>
	useLocalStorage({
		key: 'package-manager',
		defaultValue,
		deserialize: (value) =>
			deserializeStoredChoice(value, packageManagerValues, defaultValue),
	});

export { usePackageManager };
