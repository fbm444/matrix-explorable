// Row-major 3×3 matrices. Each example starts from the unit cube.
export const det3dPresets = [
	{
		key: "identity",
		label: "Unit cube",
		matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
		det: 1
	},
	{
		key: "stretch",
		label: "Stretch",
		matrix: [2, 0, 0, 0, 1, 0, 0, 0, 1],
		det: 2,
		copy: "Double the width and keep the other two sides unchanged. The cube becomes a box of volume 2, so the determinant is +2."
	},
	{
		key: "compress",
		label: "Compress",
		matrix: [1, 0, 0, 0, 1, 0, 0, 0, 0.5],
		det: 0.5,
		copy: "Halve the height while keeping the base unchanged. Volume and determinant both become 0.5."
	},
	{
		key: "shear",
		label: "Shear",
		matrix: [1, 0, 1, 0, 1, 0, 0, 0, 1],
		det: 1,
		copy: "Slide each horizontal layer sideways, with higher layers moving farther. The solid leans, but its base area and height stay the same: volume 1, determinant +1."
	},
	{
		key: "rotate",
		label: "Rotate",
		matrix: [0, 0, 1, 0, 1, 0, -1, 0, 0],
		det: 1,
		copy: "Turn the cube a quarter turn around the y-axis. Its volume stays 1 throughout, and its orientation is preserved, so the determinant stays +1."
	},
	{
		key: "reflect",
		label: "Reflect",
		matrix: [1, 0, 0, 0, 1, 0, 0, 0, -1],
		det: -1,
		copy: "Flip the cube through the xy-plane. It flattens as it passes through, then opens below with volume 1 and reversed orientation: determinant −1."
	},
	{
		key: "collapse",
		label: "Collapse",
		matrix: [1, 0, 0, 0, 1, 0, 0, 0, 0],
		det: 0,
		copy: "Press the cube flat onto the xy-plane. A flat square still has area, but no volume: the determinant is 0, height information is lost, and there is no inverse."
	}
];
