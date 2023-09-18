interface AxesData {
	default: string;
	min: string;
	max: string;
	step: string;
}

// axes: italic: link
type VariableVariants = Record<string, Record<string, string>>;

interface VariableMetadata {
	family: string;
	id: string;
	axes: Record<string, AxesData>;
}

interface VariableMetadataWithVariants extends VariableMetadata {
	variants: VariableVariants;
}

type VariableList = Record<string, VariableMetadata>;

export type { VariableList, VariableMetadata, VariableMetadataWithVariants };
