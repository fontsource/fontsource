export interface SizeProps {
	value: number;
	onChange: React.Dispatch<React.SetStateAction<number>>;
}

export interface PreviewProps {
	label: string;
	labelChange: React.Dispatch<React.SetStateAction<string>>;
	value: string;
	inputView: string;
	onChangeEvent: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onChangeValue: React.Dispatch<React.SetStateAction<string>>;
}

export interface FilterProps {
	size: SizeProps
	preview: PreviewProps
}