import { get, writable } from "svelte/store";
import { egMatrixX, egMatrixY, egVector } from "$data/variables";
import { spring } from "svelte/motion";

export const debug = writable(false);

// export const endMatrix = writable([
// 	1, 1, -1, 0,
//   0, 1, 1, 0,
//   0, 0, 1, 0,
//   0, 0, 0, 1
// ]);
export const endMatrix = writable([
	egMatrixX[0],
	egMatrixY[0],
	0,
	0,
	egMatrixX[1],
	egMatrixY[1],
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1
]);
// export const endMatrix = spring([
// 	egMatrixX[0],
// 	egMatrixY[0],
// 	0,
// 	0,
// 	egMatrixX[1],
// 	egMatrixY[1],
// 	0,
// 	0,
// 	0,
// 	0,
// 	1,
// 	0,
// 	0,
// 	0,
// 	0,
// 	1
// ]);

export const vectorCoordsInput = spring([...egVector, 0]);

// Separate matrix transformation states
export const heroMatrix = writable([
	1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
]);

export const customMatrix = writable([
	1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1
]);

export const inputVectorToggled = writable(false);
export const gridToggled = writable(false);
export const transformedGridToggled = writable(true);
export const grid3dToggled = writable(false);
export const dataToggled = writable(undefined);

export const showHero = writable(true);
if (get(debug)) showHero.set(false);

export const show3d = writable(false);
if (get(debug)) show3d.set(true);
export const show2d = writable(true)
export const showPlayground = writable(false);
if (get(debug)) showPlayground.set(true);

export const cameraControls = writable(undefined);
export const cameraProps = writable({
	dolly: 30,
	polarAngle: 0,
	truckX: 0,
	truckY: 0
});

export const matrixTween = writable(undefined);

// ScrubberInput stores
export const playhead = writable(0);
export const playToggle = writable(true);

export const titleMounted = writable(false);
export const sceneMounted = writable(false);
export const introMounted = writable(false)
export const arcadeMounted = writable(false)

export const loaded = writable(false);

export const afterImageEnabled = writable(true);
export const rgbShiftEnabled = writable(true);
if (get(debug)) rgbShiftEnabled.set(false);

export const cameraAutoRotate = writable(false);

export const playgroundSt = writable(undefined);

export const resetViewToggle = writable(true);

export const expandPlayground = writable(false);
if (get(debug)) expandPlayground.set(true);

// Determinant chapter
// Live determinant of the currently displayed transform (set by Arcade)
export const detValue = writable(1);
// Live 2x2 entries [a, b, c, d] of the displayed transform (set by Arcade)
export const detMatrixEntries = writable([1, 0, 0, 1]);
// Which matrix column is hovered in MatrixInput: null | "x" | "y"
export const highlightedBasis = writable(null);
// Clicked preset from the article's "Select transformation" list: { key, m, n }
export const detPresetRequest = writable(null);
// True while the article's determinant "Try it" block has been reached:
// the readout on the graph then shows the reader's own editable matrix
export const detTryActive = writable(false);
// True while the "The determinant and invertibility" section owns the canvas:
// scrolling drives the transformation, so the readout is not editable
export const invNarrative = writable(false);
// The two tracked vectors a collapse beat is following: the shaded area on
// the canvas is the one they span, and the readout multiplies them instead
// of î and ĵ. { vectors: [[x1, y1], [x2, y2]], colors: [c1, c2],
// resultColors: [c1, c2] (where they land), labels: opacity of the readout's
// î ĵ column labels }, or null while î and ĵ themselves are on screen.
export const invPair = writable(null);

// The brief volume chapter uses the same canvas, with a 3×3 readout.
export const det3dActive = writable(false);
export const det3dMatrix = writable([1, 0, 0, 0, 1, 0, 0, 0, 1]);
export const det3dPresetRequest = writable(null);
