import themeColors from "daisyui/src/theming/themes";
import { color as d3Color } from "d3";
import { Matrix } from "ml-matrix";

// Data
export const egVector = [-1, 2];
export const egMatrixX = [1, -2];
// export const egMatrixY = [3, 0];
export const egMatrixY = [2, 0];

export const initMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export const egEndMatrix = [
	egMatrixX[0], egMatrixY[0], 0, 0,
	egMatrixX[1], egMatrixY[1], 0, 0,
	0, 0, 1, 0,
  0, 0, 0, 1
];

const A = new Matrix([egMatrixX, egMatrixY]).transpose();
const v = new Matrix([egVector]).transpose();
const w = A.mmul(v);

export const egOutputVector = [w.get(0, 0), w.get(1, 0)];

// export const eg3dVector = [2, 3, -1];
// export const eg3dMatrixX = [0, 1, -2];
// export const eg3dMatrixY = [1, 2, 4];
// export const eg3dMatrixZ = [1, 3, 4];

// export const eg3dVector = [2, 3, -1];
export const eg3dVector = [-1, 2, 1];
export const eg3dMatrixX = [1, 0, 0];
export const eg3dMatrixY = [1, 1, 1];
// export const eg3dMatrixZ = [0, 0, 1];
export const eg3dMatrixZ = [0, -1, 1];

const B = new Matrix([eg3dMatrixX, eg3dMatrixY, eg3dMatrixZ]).transpose();
const u = new Matrix([eg3dVector]).transpose();
const t = B.mmul(u);

export const eg3dOutputVector = [t.get(0, 0), t.get(1, 0), t.get(2, 0)];

const [x1, x2, x3] = eg3dMatrixX;
const [y1, y2, y3] = eg3dMatrixY;
const [z1, z2, z3] = eg3dMatrixZ;

export const eg3dMatrix = [
	x1, y1, z1, 0,
	x2, y2, z2, 0,
	x3, y3, z3, 0,
	0, 0, 0, 1,
];

// Colors
const dracula = themeColors["[data-theme=dracula]"];

export const colorXAlt = dracula.primary;
export const colorYAlt = dracula.secondary;
export const colorZAlt = dracula.accent;

// export const colorX = d3Color("hsl(326, 100%, 67%)").formatHex();
// export const colorY = d3Color("hsl(265, 89%, 71%)").formatHex();
// export const colorZ = d3Color("hsl(31, 100%, 64%)").formatHex();
export const colorX = colorToHex("hsl(326, 100%, 67%)");
export const colorY = colorToHex("hsl(265, 89%, 71%)");
export const colorZ = colorToHex("hsl(31, 100%, 64%)");

// export const colorVector = dracula.info;
// export const colorVector = "hsl(191, 97%, 77%)";
// export const colorVector = "#04cefb";
export const colorVector = colorToHex("hsl(191, 97%, 50%)");

export const colorGrid = colorToHex("hsl(191, 97%, 30%)");
export const colorGridAlt = colorToHex("hsl(191, 97%, 20%)");

export const colorB1 = "hsl(231, 15%, 18%)";
export const colorB2 = colorToHex("hsl(231, 15%, 11%)");
export const colorB3 = "hsl(231, 15%, 4%)";

export const colorN = "hsl(230, 15%, 30%)";
export const colorNc = "hsl(232, 7%, 85%)";
export const colorNf = "hsl(230, 15%, 23%)";

export const colorIn = "hsl(191, 97%, 77%)"


// Determinant chapter: signed-area colors (dracula green / red, grey-blue at zero)
export const colorArea = "#50fa7b";
export const colorAreaNeg = "#ff5555";
export const colorAreaZero = "#6272a4";
// Basis vector whose matrix entry is being hovered (dracula yellow)
export const colorHighlight = "#f1fa8c";

// Determinant chapter: preset transformations, as 2x2 row-major [a, b, c, d]
export const detPresets = [
	{ key: "identity", label: "Identity", m: [1, 0, 0, 1], det: 1 },
	{ key: "stretch", label: "Stretch", m: [2, 0, 0, 1], det: 2 },
	{ key: "compress", label: "Compress", m: [1, 0, 0, 0.5], det: 0.5 },
	{ key: "shear", label: "Shear", m: [1, 1, 0, 1], det: 1 },
	{ key: "rotate", label: "Rotate", m: [0, -1, 1, 0], det: 1 },
	{ key: "reflect", label: "Reflect", m: [1, 0, 0, -1], det: -1 }
];

// "Try it out" walk-through: one transformation type per scroll beat
// (st-try-1..5), as 2x2 row-major [a, b, c, d]. `rotate` turns through the
// angle instead of tweening the entries, so the grid doesn't shrink mid-turn.
export const tryBeats = [
	{ key: "stretch", m: [2, 0, 0, 1] },
	{ key: "reflect", m: [-1, 0, 0, 1] },
	{ key: "shear", m: [1, 1, 0, 1] },
	{ key: "rotate", m: [0, -1, 1, 0], rotate: true },
	{ key: "flatten", m: [1, 0, 0, 0] }
];

// "The determinant and invertibility" (st-inv-1..8): the vectors followed through
// each transformation, as [x, y] starting points, and the 2x2 row-major
// matrix that moves them.
// - collapse: play the matrix; every tracked vector lands on one point
// - question: the same, then the starting points vanish and come back as
//   candidates for "where did this come from?"
// - hold: keep the previous beat's matrix; `more` adds further candidates
//   and `fiber` is the line of every starting point with the same landing
// - roundTrip: play the matrix, then play it backwards
// `label` moves the landing point's coordinates clear of the other marks
// The first two `vectors` span the shaded area and fill the readout's
// equation; their order keeps that area positive before the matrix plays
export const invBeats = [
	{
		key: "collapse-x",
		mode: "collapse",
		m: [1, 0, 0, 0],
		vectors: [
			[1, 1],
			[1, 3]
		]
	},
	{
		key: "collapse-x-more",
		mode: "collapse",
		m: [1, 0, 0, 0],
		vectors: [
			[-2, 1],
			[-2, -2],
			[-2, 3]
		]
	},
	{
		key: "collapse-y",
		mode: "collapse",
		m: [0, 0, 0, 1],
		label: [0.2, 0.6],
		vectors: [
			[3, 2],
			[1, 2],
			[-2, 2]
		]
	},
	{
		key: "collapse-diagonal",
		mode: "collapse",
		m: [0.5, 0.5, 0.5, 0.5],
		label: [0.3, 0.75],
		vectors: [
			[2, 0],
			[0, 2],
			[3, -1]
		]
	},
	{
		key: "reverse",
		mode: "question",
		m: [1, 0, 0, 0],
		vectors: [
			[1, 1],
			[1, 3]
		]
	},
	{
		key: "fiber",
		mode: "hold",
		m: [1, 0, 0, 0],
		vectors: [
			[1, 1],
			[1, 3]
		],
		more: [
			[1, 2],
			[1, -1],
			[1, -2]
		],
		fiber: [
			[1, -3.5],
			[1, 3.5]
		]
	},
	{
		key: "stretch",
		mode: "roundTrip",
		m: [2, 0, 0, 1],
		vectors: [
			[1, 1],
			[1, 3]
		]
	},
	{
		key: "reflect",
		mode: "roundTrip",
		m: [1, 0, 0, -1],
		vectors: [
			[1, 1],
			[1, 3]
		]
	}
];
// One colour per tracked vector, by position in `vectors`: the input-vector
// cyan, then dracula yellow and orange. The further candidates in `more`
// share a neutral, as does everything the vectors have in common (where
// they land, the line they started on).
export const invColors = [colorVector, colorHighlight, colorZ];
export const invColorShared = colorToHex(colorNc);
// The single vector that several different ones have collapsed into
// (dracula red)
export const invColorResult = colorAreaNeg;
// Most vectors any one beat tracks (vectors + more)
export const invPoolSize = 5;

function colorToHex(color) {
	return d3Color(color).formatHex();
}
