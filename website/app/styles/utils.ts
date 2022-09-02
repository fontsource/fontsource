import type { PropertyValue } from "@stitches/react";

export default {
	// Margin
	mt: (value: PropertyValue<"margin">) => ({
		marginTop: value,
	}),
	mr: (value: PropertyValue<"margin">) => ({
		marginRight: value,
	}),
	mb: (value: PropertyValue<"margin">) => ({
		marginBottom: value,
	}),
	ml: (value: PropertyValue<"margin">) => ({
		marginLeft: value,
	}),
	mx: (value: PropertyValue<"margin">) => ({
		marginLeft: value,
		marginRight: value,
	}),
	my: (value: PropertyValue<"margin">) => ({
		marginTop: value,
		marginBottom: value,
	}),

	// Padding
	pt: (value: PropertyValue<"padding">) => ({
		paddingTop: value,
	}),
	pr: (value: PropertyValue<"padding">) => ({
		paddingRight: value,
	}),
	pb: (value: PropertyValue<"padding">) => ({
		paddingBottom: value,
	}),
	pl: (value: PropertyValue<"padding">) => ({
		paddingLeft: value,
	}),
	px: (value: PropertyValue<"padding">) => ({
		paddingLeft: value,
		paddingRight: value,
	}),
	py: (value: PropertyValue<"padding">) => ({
		paddingTop: value,
		paddingBottom: value,
	}),

	// Border
	borderX: (value: PropertyValue<"border">) => ({
		borderLeft: value,
		borderRight: value,
	}),
	borderY: (value: PropertyValue<"border">) => ({
		borderTop: value,
		borderBottom: value,
	}),

	// Misc
	size: (value: PropertyValue<"width"> & PropertyValue<"height">) => ({
		width: value,
		height: value,
	}),
};