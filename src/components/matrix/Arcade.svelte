<script>
	// import Grid from "./Grid.svelte";
	import { Grid, useGltf, useTexture } from "@threlte/extras";
	import { useTweakpane } from "$utils/useTweakpane";
	import { T, useThrelte } from "@threlte/core";
	import Points from "./Points.svelte";
	import Sphere from "./Sphere.svelte";
	import Circle from "./Circle.svelte";
	import Planes from "./Planes.svelte";
	import Plane from "./Plane.svelte";
	import Grid3d from "./Grid3d.svelte";
	import Sky from "./Sky.svelte";
	import Gridlines from "./Gridlines.svelte";
	import {
		endMatrix,
		playhead,
		playToggle,
		matrixTween,
		gridToggled,
		grid3dToggled,
		transformedGridToggled,
		dataToggled,
		showHero,
		heroMatrix,
		afterImageEnabled,
		cameraAutoRotate,
		show3d,
		showPlayground,
		customMatrix,
		debug,
		inputVectorToggled,
		rgbShiftEnabled,
		resetViewToggle,
    show2d
	} from "$stores";
	import Vector from "./Vector.svelte";
	import DetVolume from "./DetVolume.svelte";
	import { det3dPresets } from "$data/determinant3d.js";
	import { interpolateDet3d, matrix3dTo4 } from "$utils/determinant3d.js";
	import { ScrollTrigger, gsap } from "$utils/gsap.js";
	import { onMount, onDestroy } from "svelte";
	import {
		sceneMounted,
		titleMounted,
		loaded,
		cameraProps,
		cameraControls,
		playgroundSt,
		vectorCoordsInput
	} from "$stores";
	import {
		colorVector,
		colorX,
		colorY,
		colorZ,
		egVector,
		egMatrixX,
		egMatrixY,
		egOutputVector,
		eg3dMatrix,
		eg3dMatrixX,
		eg3dMatrixY,
		eg3dMatrixZ,
		eg3dVector,
		eg3dOutputVector,
		egEndMatrix,
		initMatrix,
		colorGrid,
		colorGridAlt,
		colorArea,
		colorAreaNeg,
		colorAreaZero,
		colorHighlight,
		tryBeats,
		detPresets,
		invBeats,
		invColors,
		invColorShared,
		invColorResult,
		invPoolSize
	} from "$data/variables";
	import {
		detValue,
		detMatrixEntries,
		highlightedBasis,
		detPresetRequest,
		invNarrative,
		invPair,
		det3dActive,
		det3dMatrix,
		det3dPresetRequest
	} from "$stores";
	import { iHat, jHat } from "$data/tex";
	import katex from "katex";
	import { HTML } from "@threlte/extras";
	import colors from "tailwindcss/colors";
	import CameraControls from "camera-controls";
	import {
		Color,
		MeshBasicMaterial,
		PlaneGeometry,
		SRGBColorSpace,
		sRGBEncoding
	} from "three";
	import Hero from "./Hero.svelte";
	import { spring } from "svelte/motion";
	import { base, assets } from "$app/paths";
	import Vectors from "./Vectors.svelte";

	export let mathbox;

	// const map = useTexture("/maxwell.jpg");
	const map = useTexture(`${assets}/maxwell.jpg`);
	$: if ($map) $map.encoding = sRGBEncoding;

	let mounted;

	// Set this to the z-position of the camera
	// mathbox.set("focus", 15);
	mathbox.set("focus", 20);

	// Set up coordinate system
	const dim = 1;
	const range = [
		[-dim, dim],
		[-dim, dim],
		[-dim, dim]
	];
	const view = mathbox.cartesian({
		range
	});

	const planeDim = 10;

	// States
	const startMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	// Object that gets animated
	let matrix = [...startMatrix];
	// `$endMatrix` records the final state of the matrix

	// const transformedView = view.transform();
	// FIXME: Or should I just set manually?
	// const transformedView = view.transform({}, { matrix: () => matrix });
	const transformedView = view.transform();

	// Matrix animation
	// TODO: Make the ease linear
	// So that the playhead corresponds to the animation progress
	// Tween the animation's progress separately instead
	$matrixTween = gsap.to(matrix, {
		ease: "linear",
		duration: 2,
		paused: true,
		endArray: $endMatrix,
		onUpdate() {
			// Sync playhead with animation progress
			$playhead = this.progress();
			matrix = matrix;
		},
		onComplete() {
			// Toggle play icon
			$playToggle = true;
			// FIXME:
			this.pause();
		}
	});
	// $matrixTween.progress(1);

	// FIXME: Setting $endMatrix directly doesn't work for some reason
	// FIXME: Use different matrix transformation states during narrative, and during interaction time
	$: onMatrixChange($endMatrix);

	let nudgeFlag = true;

	// FIXME: This has to run first!!
	function onMatrixChange(endMatrix) {
		// Reset matrix
		matrix.forEach((_, i) => {
			matrix[i] = startMatrix[i];
		});

		// Update tween
		$matrixTween.invalidate();

		// HACK: Nudge
		const nudgeAmt = nudgeFlag ? 0.0001 : -0.0001;
		$matrixTween.progress($matrixTween.progress() + nudgeAmt);
		nudgeFlag = !nudgeFlag;

		// FIXME: Stays the same
		matrix = matrix;
	}

	// Determinant chapter state
	// While `detNarrative` is true, the displayed transform follows `detMatrix`
	// (driven by the det chapter's scroll timelines and preset clicks) instead
	// of the playground/narrative `matrix`.
	let detNarrative = false;
	let detMatrix = [...initMatrix];
	let squareProps = { opacity: 0 };
	let volumeProps = { opacity: 0 };
	let volumeTween;
	onDestroy(() => volumeTween?.kill());
	let volumePreset = det3dPresets[0];
	const volumeMotion = { progress: 0 };
	$: playVolumePreset($det3dPresetRequest);
	function playVolumePreset(request) {
		if (!request || !$det3dActive) return;
		const next = det3dPresets.find((preset) => preset.key === request.key);
		if (!next) return;
		volumeTween?.kill();
		const previous = volumePreset;
		// Retrace the current example to identity before playing the next.
		// This also handles a new click partway through either animation.
		volumeTween = gsap
			.timeline()
			.to(volumeMotion, {
				progress: 0,
				duration: volumeMotion.progress > 0 ? 0.3 : 0,
				ease: "power2.inOut",
				onUpdate: () =>
					($det3dMatrix = interpolateDet3d(previous, volumeMotion.progress))
			})
			.call(() => (volumePreset = next))
			.to(volumeMotion, {
				progress: 1,
				duration: next.key === "identity" ? 0 : 1.5,
				ease: "power2.inOut",
				onUpdate: () =>
					($det3dMatrix = interpolateDet3d(next, volumeMotion.progress))
			});
	}
	let cachedPlaygroundMatrix = null;

	// 2x2 row-major [a, b, c, d] -> flat 4x4
	function detTo([a, b, c, d]) {
		return [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	}

	// Use different states during interaction and during narrative
	const matrixTransform = spring(initMatrix);
	$: {
		if ($showHero) {
			$matrixTransform = $heroMatrix;
			// } else if (!$showPlayground) {
			// 	$matrixTransform = $customMatrix;
		} else if ($det3dActive) {
			// The preset animation already eases the cube's matrix. A second spring would
			// distort a rotation and desynchronize its determinant and geometry.
			matrixTransform.set(matrix3dTo4($det3dMatrix), { hard: true });
		} else if (detNarrative) {
			$matrixTransform = detMatrix;
		} else if (tryDriving) {
			const precise = [...matrix];
			tryIdx.forEach((idx, k) => {
				precise[idx] += (tryEntries[k] - $endMatrix[idx]) * $playhead;
			});
			$matrixTransform = precise;
		} else {
			$matrixTransform = matrix;
		}
	}

	// Self-heal: the transform spring can diverge after long frame stalls
	// (background tab, heavy jank); snap it back to its target if it blows up
	$: if ($matrixTransform.some((v) => !isFinite(v) || Math.abs(v) > 100)) {
		matrixTransform.set(
			detNarrative ? [...detMatrix] : $showHero ? [...$heroMatrix] : [...matrix],
			{ hard: true }
		);
	}

	// Live determinant of the displayed 2x2 transform (signed area)
	$: detVal =
		$matrixTransform[0] * $matrixTransform[5] -
		$matrixTransform[1] * $matrixTransform[4];
	$: $detValue = detVal;
	$: $detMatrixEntries = [
		$matrixTransform[0],
		$matrixTransform[1],
		$matrixTransform[4],
		$matrixTransform[5]
	];
	$: squareColor =
		detVal > 0.02 ? colorArea : detVal < -0.02 ? colorAreaNeg : colorAreaZero;

	// Place a basis-vector label just beyond the vector's tip
	function basisLabelPos(x, y) {
		const len = Math.hypot(x, y);
		const s = len > 0.05 ? (len + 0.4) / len : 1;
		return [x * s, y * s, 0.01];
	}

	// The Threlte HTML wrapper swallows pointer events over the canvas
	function noPointer(node) {
		if (node.parentElement) node.parentElement.style.pointerEvents = "none";
	}

	// "The determinant and invertibility" (st-inv-N beats): a few vectors followed
	// through the transformation, one per slot of a fixed pool.
	// - image: the vector itself, carried along by the matrix
	// - ghost: a faded copy left at its starting point, with a dashed path
	//   to where the vector is now
	// - mark: a "?" on the ghost (a candidate for where the vector came from)
	const invPool = Array.from({ length: invPoolSize }, (_, i) => i);
	const unitPair = [
		[1, 0],
		[0, 1]
	];
	const invBlank = () => invPool.map(() => 0);
	let track = {
		starts: invPool.map(() => [0, 0]),
		colors: invPool.map((n) => invColors[n] ?? invColorShared),
		// The vector itself, as opposed to its faded starting copy: it turns
		// red as it lands on the same point as the others
		imageColors: invPool.map((n) => invColors[n] ?? invColorShared),
		image: invBlank(),
		ghost: invBlank(),
		mark: invBlank(),
		// Line of every starting point that shares the landing point
		fiber: 0,
		fiberCoords: [0, 0, 0, 0, 0, 0],
		// Coordinates of the landing point, and the "Reverse?" beside them
		landing: 0,
		label: [0.2, -0.45],
		question: 0,
		// Once a beat follows its own vectors, î, ĵ and the unit square step
		// aside (basis) and the shaded area is the one spanned by two of the
		// tracked vectors (area, areaPair)
		basis: 1,
		basisLabel: 1,
		area: 0,
		areaPair: unitPair
	};
	function clearTrack() {
		track.image = invBlank();
		track.ghost = invBlank();
		track.mark = invBlank();
		track.fiber = 0;
		track.landing = 0;
		track.question = 0;
		track.basis = 1;
		track.basisLabel = 1;
		track.area = 0;
		$invPair = null;
	}
	// The shaded area as a matrix applied to the unit square: î and ĵ, or
	// the two tracked vectors, as columns
	$: [[spanX1, spanY1], [spanX2, spanY2]] =
		track.basis < 0.5 ? track.areaPair : unitPair;
	$: areaMatrix = [
		spanX1, spanX2, 0, 0,
		spanY1, spanY2, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	];
	// Where each tracked vector is right now
	$: trackImages = track.starts.map(([x, y]) => [
		$matrixTransform[0] * x + $matrixTransform[1] * y,
		$matrixTransform[4] * x + $matrixTransform[5] * y
	]);
	function trackCoord(v) {
		return String(Math.round(v * 10) / 10 + 0);
	}
	// Restores the section's last beat when scrolling back up from 3D
	let invRestore = () => {};

	// î and ĵ can land on the same spot (a collapse onto a slanted line);
	// their labels then step apart, to either side of the line
	$: basisTipsMeet =
		Math.hypot($matrixTransform[0], $matrixTransform[4]) > 0.05 &&
		Math.hypot(
			$matrixTransform[0] - $matrixTransform[1],
			$matrixTransform[4] - $matrixTransform[5]
		) < 0.3;
	function basisLabelAside(x, y, side) {
		const len = Math.hypot(x, y);
		return [x + (y / len) * 0.4 * side, y - (x / len) * 0.4 * side, 0.01];
	}

	// "Try it out" walk-through state (st-try-N beats)
	// `tryNarrative` is true while the 2D playground owns the matrix, i.e.
	// from st-8 until the determinant chapter takes over. The beats tween
	// `tryEntries` ([a, b, c, d]) and copy it into `$endMatrix`, so the
	// matrix input and the scrubber stay in sync with the scroll.
	let tryNarrative = false;
	const tryEntries = [1, 0, 0, 1];
	const tryAngle = { t: 0 };
	// Playground matrix when the reader enters the first beat
	let tryStart = [1, 0, 0, 1];

	// The matrix input rounds every entry of `$endMatrix` to its 0.1 step and
	// writes it back, which would make a scrubbed beat move in visible jumps.
	// While the stored matrix is just the rounded walk-through matrix, the
	// display adds the rounding error back; a reader's own edit moves an
	// entry further than that, and the display follows `matrix` as usual.
	const tryIdx = [0, 1, 4, 5];
	$: tryDriving =
		tryNarrative &&
		tryIdx.every((idx, k) => Math.abs($endMatrix[idx] - tryEntries[k]) < 0.051);

	// In the playground the wheel zooms the canvas, and camera-controls
	// swallows the event, so the page stops scrolling. Two cases where the
	// wheel has to keep scrolling the page instead:
	// - a scroll gesture that is already moving the page when the canvas
	//   under the cursor becomes interactive (it would zoom all the way out)
	// - the whole walk-through, where scrolling is what plays the beats
	let tryWheelLock = false;
	let lastPageScroll = 0;

	function onPageScroll() {
		lastPageScroll = performance.now();
	}
	function onCanvasWheel(e) {
		if (tryWheelLock || performance.now() - lastPageScroll < 250) {
			// Never reaches camera-controls, so the default scroll goes ahead
			e.stopPropagation();
		}
	}

	function applyTryEntries() {
		if (!tryNarrative) return;

		const m = $endMatrix;
		[m[0], m[1], m[4], m[5]] = tryEntries;
		$endMatrix = m;
	}
	function applyTryAngle() {
		const cos = Math.cos(tryAngle.t);
		const sin = Math.sin(tryAngle.t);
		tryEntries[0] = cos;
		tryEntries[1] = -sin;
		tryEntries[2] = sin;
		tryEntries[3] = cos;

		applyTryEntries();
	}

	// Preset clicked in the article's "Select transformation" list
	let detPresetTween;
	$: onDetPresetRequest($detPresetRequest);
	function onDetPresetRequest(request) {
		if (!request || !detNarrative) return;

		if (detPresetTween) detPresetTween.kill();

		// "Apply transformation" on the reader's own matrix: start over from
		// the untouched unit square, then play the transformation
		if (request.replay) {
			detPresetTween = gsap
				.timeline()
				.to(detMatrix, {
					endArray: [...initMatrix],
					duration,
					onUpdate: () => (detMatrix = detMatrix)
				})
				.to(detMatrix, {
					endArray: detTo(request.m),
					duration: 1.5,
					ease: "power2.inOut",
					onUpdate: () => (detMatrix = detMatrix)
				});
			return;
		}

		detPresetTween = gsap.to(detMatrix, {
			endArray: detTo(request.m),
			duration: 1.5,
			ease: "power2.inOut",
			onUpdate: () => (detMatrix = detMatrix)
		});
	}

	// Update transformed view
	$: transformedView.set("matrix", $matrixTransform);

	// $: console.log(matrixTransform)

	// Grid props
	const gridCellSize = 1;
	const gridSectionSize = 5;

	const defaultGridProps = {
		cellSize: gridCellSize,
		cellColor: colors.slate["700"],
		cellThickness: 1.5,
		sectionSize: gridSectionSize,
		sectionColor: colors.slate["700"],
		sectionThickness: 3,
		infiniteGrid: true
	};

	$: gridSettings = $show3d
		? {
				fadeDistance: 150,
				fadeStrength: 4
		  }
		: {
				fadeDistance: 50,
				fadeStrength: 5
		  };

	$: transformedGridSettings = $show3d
		? {
				fadeDistance: 150,
				fadeStrength: 4
		  }
		: {
				// fadeDistance: 50,
				// fadeStrength: 9
				fadeDistance: 100,
				fadeStrength: 8
		  };

	let gridProps = {
		...defaultGridProps,
		// sectionThickness: 2.5,
		...gridSettings
	};

	let transformedGridProps = {
		...defaultGridProps,
		cellColor: colorGridAlt,
		sectionColor: colorGrid,
		...transformedGridSettings
	};

	let grid3dProps = {
		...defaultGridProps,
		infiniteGrid: false,
		cellColor: colorGridAlt,
		sectionColor: colorGrid,
		gridSize: [10, 10],
		cellThickness: 0,
		sectionThickness: 0,
		t: 0
	};

	let gridVars = {
		fadeDistance: gridProps.fadeDistance,
		transformedFadeDistance: 0,
		fadeStrength: gridProps.fadeStrength,
		transformedFadeStrength: transformedGridProps.fadeStrength
	};

	// let grid3dProps = {
	// 	t: 0
	// };

	$: onGridToggle($gridToggled);
	function onGridToggle(toggled) {
		if (toggled) {
			gsap.to(gridProps, {
				fadeDistance: gridSettings.fadeDistance,
				onUpdate: function () {
					gridProps = gridProps;
				}
			});
		} else {
			gsap.to(gridProps, {
				fadeDistance: 0,
				onUpdate: function () {
					gridProps = gridProps;
				}
			});
		}
	}

	$: onTransformedGridToggle($transformedGridToggled);
	function onTransformedGridToggle(toggled) {
		if (toggled) {
			gsap.to(transformedGridProps, {
				fadeDistance: transformedGridSettings.fadeDistance,
				onUpdate: function () {
					transformedGridProps = transformedGridProps;
				}
			});
		} else {
			gsap.to(transformedGridProps, {
				fadeDistance: 0,
				onUpdate: function () {
					transformedGridProps = transformedGridProps;
				}
			});
		}
	}

	$: onGrid3dToggle($grid3dToggled);
	function onGrid3dToggle(toggled) {
		if (toggled) {
			gsap.to(grid3dProps, {
				t: 1,
				cellThickness: defaultGridProps.cellThickness,
				sectionThickness: defaultGridProps.sectionThickness,
				onUpdate: function () {
					grid3dProps = grid3dProps;
				}
			});
		} else {
			gsap.to(grid3dProps, {
				t: 0,
				cellThickness: 0,
				sectionThickness: 0,
				onUpdate: function () {
					grid3dProps = grid3dProps;
				}
			});
		}
	}

	const cachePlaygroundSettings = {
		dataToggled: undefined,
		gridToggled: true,
		transformedGridToggled: true
	};

	let prevDataToggled;
	$: onDataToggle($dataToggled);
	function onDataToggle(toggled) {
		// Animate out
		if (prevDataToggled == "points") {
			gsap.to(pointsProps, {
				t: 0,
				onUpdate: function () {
					pointsProps = pointsProps;
				}
			});
		} else if (prevDataToggled == "3d points") {
			gsap.to(points3dProps, {
				t: 0,
				onUpdate: function () {
					points3dProps = points3dProps;
				}
			});
		} else if (prevDataToggled == "planes") {
			gsap.to(planesProps, {
				t: 0,
				onUpdate: function () {
					planesProps = planesProps;
				}
			});
		} else if (prevDataToggled == "3d planes") {
			gsap.to(planes3dProps, {
				t: 0,
				onUpdate: function () {
					planes3dProps = planes3dProps;
				}
			});
		} else if (prevDataToggled == "model") {
			gsap.to(modelProps, {
				scale: 0,
				onUpdate: function () {
					modelProps = modelProps;
				}
			});
		} else if (prevDataToggled == "image") {
			gsap.to(imageProps, {
				scale: 0,
				onUpdate: function () {
					imageProps = imageProps;
				}
			});
		}

		// Animate in
		if (toggled == "points") {
			gsap.to(pointsProps, {
				t: 1,
				onUpdate: function () {
					pointsProps = pointsProps;
				}
			});
		} else if (toggled == "3d points") {
			gsap.to(points3dProps, {
				t: 1,
				onUpdate: function () {
					points3dProps = points3dProps;
				}
			});
		} else if (toggled == "planes") {
			gsap.to(planesProps, {
				t: 1,
				onUpdate: function () {
					planesProps = planesProps;
				}
			});
		} else if (toggled == "3d planes") {
			gsap.to(planes3dProps, {
				t: 1,
				onUpdate: function () {
					planes3dProps = planes3dProps;
				}
			});
		} else if (toggled == "model") {
			gsap.to(modelProps, {
				scale: 0.25,
				onUpdate: function () {
					modelProps = modelProps;
				}
			});
		} else if (toggled == "image") {
			gsap.to(imageProps, {
				scale: 1,
				onUpdate: function () {
					imageProps = imageProps;
				}
			});
		}

		// Update prev value
		prevDataToggled = toggled;
	}

	// Have a show 3d trigger?
	$: toggle3d($show3d);
	function toggle3d(toggle) {
		if ($gridToggled) {
			gsap.to(gridProps, {
				duration,
				fadeDistance: gridSettings.fadeDistance,
				fadeStrength: gridSettings.fadeStrength,
				onUpdate: () => (gridProps = gridProps)
			});
		}

		if ($transformedGridToggled) {
			gsap.to(transformedGridProps, {
				duration,
				fadeDistance: transformedGridSettings.fadeDistance,
				fadeStrength: transformedGridSettings.fadeStrength,
				onUpdate: () => (transformedGridProps = transformedGridProps)
			});
		}

		if ($showPlayground) {
			if (!$show3d) {
				// Hide any toggled 3d objects
				$dataToggled = undefined;
				onDataToggle(undefined);

				// Reset camera to 2d view
				$resetViewToggle = !$resetViewToggle;

				// Hide z basis vector
				basisAltProps.zVisible = false;

				// Remove z-coord of input vector
				$vectorCoordsInput[2] = 0;
				// $vectorCoordsInput = $vectorCoordsInput

				// $endMatrix[2] = 0
				// $endMatrix[6] = 0
				// $endMatrix[8] = 0
				// $endMatrix[9] = 0
				// $endMatrix[10] = 1
				gsap.to($endMatrix, {
					endArray: initMatrix,
					onUpdate: () => {
						$endMatrix = $endMatrix;
					},
					duration
				});

				$grid3dToggled = false;
				onGrid3dToggle(false);
			} else {
				basisAltProps.zVisible = true;
			}
		}
	}

	// ScrollTrigger
	const delay = 0.1;
	const transitionDuration = 0.1;

	let vectorCoords = [0, 0, 0, 0, 0, 0];
	let xCoords = [0, 0, 0, 0, 0, 0];
	let yCoords = [0, 0, 0, 0, 0, 0];
	let zCoords = [0, 0, 0, 0, 0, 0];

	const vectorCoordsSpring = spring([0, 0, 0]);
	$: $vectorCoordsSpring = $vectorCoordsInput;

	// FIXME: Do we have to set visibility to false?
	// Hide vector input on toggle
	$: onInputVectorToggle($inputVectorToggled);
	function onInputVectorToggle(toggled) {
		if (toggled) {
			$vectorCoordsSpring = $vectorCoordsInput;
		} else {
			$vectorCoordsSpring = [0, 0, 0];
		}
	}

	// TODO: Separate this?
	let props = {
		vectorTexOpacity: 0,
		xTexOpacity: 0,
		yTexOpacity: 0,
		zTexOpacity: 0,
		xScalar: 1,
		yScalar: 1,
		zScalar: 1,
		xScalarOpacity: 0,
		yScalarOpacity: 0,
		zScalarOpacity: 0,
		xScalarAlign: "top",
		yScalarAlign: "left",
		zScalarAlign: "bottom",
		vectorVisible: false,
		xVisible: true,
		yVisible: true,
		zVisible: true,
		xDim3: false,
		yDim3: false,
		zDim3: false,
		vectorDim3: false
	};

	let pointsProps = {
		t: 0
	};

	let planesProps = {
		t: 0
	};

	let points3dProps = {
		t: 0
	};

	let planes3dProps = {
		t: 0
	};
	let modelProps = {
		scale: 0
	};
	let imageProps = {
		scale: 0
	};
	let vectorsProps = {
		enter: 0,
		exit: 1
	};

	let basisAltProps = {
		vectorVisible: true,
		xVisible: false,
		yVisible: false,
		zVisible: false
	};

	$: if ($debug) {
		basisAltProps.xVisible = true;
		basisAltProps.yVisible = true;
		basisAltProps.zVisible = true;
		squareProps.opacity = 1;
	}

	// $: basisAltProps.zVisible = $show3d;

	const stProps = {
		fastScrollEnd: true,
		pin: "#article",
		pinnedContainer: "#article",
		start: "center center",
		scrub: 1,
		pinSpacing: true,
		toggleClass: "active",
		invalidateOnRefresh: true,
		onEnter: function () {
			animateInStProgress();
		},
		onLeave: function () {
			animateOutStProgress();
		},
		onEnterBack: function () {
			animateInStProgress();
		},
		onLeaveBack: function () {
			animateOutStProgress();
		}
	};

	const stPropsAlt = {
		start: "bottom center",
		pinnedContainer: "#article",
		toggleActions: "play none none reverse",
		fastScrollEnd: true,
		end: 200
	};

	const timelineProps = {
		onUpdate: function () {
			updateStProgress(this.progress());
		}
	};

	const timelinePropsAlt = {
		ease: "power2.in"
	};

	const duration = 0.3;

	const scrollUnit = 1_000;

	function animate() {
		// FIXME: Review scroll amounts

		// Animate in vector
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-1",
					end: `+=${scrollUnit * 1}`
					// onEnter: () => {
					// 	stProps.onEnter();

					// 	($gridToggled = true), ($transformedGridToggled = false);

					// 	// $rgbShiftEnabled = false;
					// },
					// onLeaveBack: () => {
					// 	stProps.onLeaveBack();

					// 	($gridToggled = false), ($transformedGridToggled = true);

					// 	// $rgbShiftEnabled = true;
					// }
				}
			})
			.to(vectorCoords, {
				endArray: [0, 0, 0, ...egVector, 0],
				onUpdate: function () {
					vectorCoords = vectorCoords;
				}
			})
			.to(props, {
				vectorTexOpacity: 1,
				onUpdate: function () {
					props = props;
				}
			})
			.to(
				{},
				{
					duration: delay
				}
			);

		// Animate in basis vectors
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-2",
					end: `+=${scrollUnit * 1}`
				}
			})
			.to(xCoords, {
				endArray: [0, 0, 0, 1, 0, 0],
				onUpdate: function () {
					xCoords = xCoords;
				},
				delay
			})
			.to(
				yCoords,
				{
					endArray: [0, 0, 0, 0, 1, 0],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"<"
			)
			.to(props, {
				xTexOpacity: 1,
				onUpdate: function () {
					props = props;
				}
			})
			.to(
				props,
				{
					yTexOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"<"
			)
			.to(
				{},
				{
					duration: delay
				}
			);

		// Scale basis vectors to example vector
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-3",
					end: `+=${scrollUnit * 3}`,
					preventOverlaps: true
				}
			})
			// Animate out Tex
			.to(props, {
				xTexOpacity: 0,
				onUpdate: function () {
					props = props;
				}
			})
			.to(
				props,
				{
					yTexOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"<"
			)
			// Scale basis vectors
			.add("step-2")
			.to(
				props,
				{
					duration: 0.2,
					xScalarOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					duration: 0.2,
					yScalarOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				xCoords,
				{
					endArray: [0, 0, 0, egVector[0], 0, 0],
					onUpdate: function () {
						xCoords = xCoords;
					}
				},
				"step-2"
			)
			.to(
				yCoords,
				{
					endArray: [0, 0, 0, 0, egVector[1], 0],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					xScalar: egVector[0],
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					yScalar: egVector[1],
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to({}, { duration: delay })
			// Shift y basis vector
			.add("step-3")
			.to(
				props,
				{
					duration: 0.2,
					xScalarOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"step-3"
			)
			.to(
				props,
				{
					duration: 0.2,
					yScalarOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"step-3"
			)
			.to(
				yCoords,
				{
					endArray: [egVector[0], 0, 0, ...egVector, 0],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-3"
			)
			.to({}, { duration: delay });

		// Animate basis vectors back
		gsap
			.timeline({
				scrollTrigger: {
					...stPropsAlt,
					trigger: "#st-3"
				},
				timelinePropsAlt
			})
			.add("step-1")
			// Reset scalar values
			.to(
				props,
				{
					duration,
					xScalar: 1,
					yScalar: 1
				},
				"step-1"
			)
			.to(
				xCoords,
				{
					duration,
					endArray: [0, 0, 0, 1, 0, 0],
					onUpdate: function () {
						xCoords = xCoords;
					}
				},
				"step-1"
			)
			.to(
				yCoords,
				{
					duration,
					endArray: [0, 0, 0, 0, 1, 0],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-1"
			)
			.to(props, {
				duration,
				xTexOpacity: 1,
				onUpdate: function () {
					props = props;
				}
			})
			.to(
				props,
				{
					duration,
					yTexOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"<"
			);

		// Transform to new basis vectors
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-4",
					end: `+=${scrollUnit * 1}`
				}
			})
			// Animate to new basis vectors
			.to(xCoords, {
				endArray: [0, 0, 0, ...egMatrixX, 0],
				onUpdate: function () {
					xCoords = xCoords;
				}
			})
			.to(
				yCoords,
				{
					endArray: [0, 0, 0, ...egMatrixY, 0],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"<"
			)
			// Animate to output vector
			.to(
				vectorCoords,
				{
					endArray: [0, 0, 0, ...egOutputVector, 0],
					onUpdate: function () {
						vectorCoords = vectorCoords;
					}
				},
				"<"
			)
			.to(
				{},
				{
					duration: delay
				}
			);

		// Scale the basis vectors to the transformed vector
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-5",
					end: `+=${scrollUnit * 3}`
				}
			})
			.add("step-1")
			.to(
				props,
				{
					xScalarAlign: "left",
					yScalarAlign: "top"
				},
				"step-1"
			)
			// Animate out Tex
			.to(
				props,
				{
					xTexOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"step-1"
			)
			.to(
				props,
				{
					yTexOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"step-1"
			)
			// Scale basis vectors
			.add("step-2")
			.to(
				props,
				{
					duration: 0.2,
					xScalarOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					duration: 0.2,
					yScalarOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				xCoords,
				{
					endArray: [
						0,
						0,
						0,
						egVector[0] * egMatrixX[0],
						egVector[0] * egMatrixX[1],
						0
					],
					onUpdate: function () {
						xCoords = xCoords;
					}
				},
				"step-2"
			)
			.to(
				yCoords,
				{
					endArray: [
						0,
						0,
						0,
						egVector[1] * egMatrixY[0],
						egVector[1] * egMatrixY[1],
						0
					],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					xScalar: egVector[0],
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					yScalar: egVector[1],
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to({}, { duration: delay })
			// Shift y basis vector
			.add("step-3")
			.to(
				props,
				{
					duration: 0.2,
					xScalarOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"step-3"
			)
			.to(
				props,
				{
					duration: 0.2,
					yScalarOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"step-3"
			)
			.to(
				yCoords,
				{
					endArray: [
						egVector[0] * egMatrixX[0],
						egVector[0] * egMatrixX[1],
						0,
						...egOutputVector,
						0
					],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-3"
			)
			.to({}, { duration: delay });

		// Animate basis vectors back
		gsap
			.timeline({
				scrollTrigger: {
					...stPropsAlt,
					trigger: "#st-5"
				},
				timelinePropsAlt
			})
			.add("step-1")
			// Remove example vector
			.to(
				props,
				{
					duration,
					vectorTexOpacity: 0,
					onUpdate: function () {
						props = props;
					}
				},
				"step-1"
			)
			.to(
				vectorCoords,
				{
					duration,
					endArray: [0, 0, 0, 0, 0, 0],
					onUpdate: function () {
						vectorCoords = vectorCoords;
					}
				},
				"step-1"
			)
			// Animate back x basis
			.to(
				xCoords,
				{
					duration,
					endArray: [0, 0, 0, 1, 0, 0],
					onUpdate: function () {
						xCoords = xCoords;
					}
				},
				"step-1"
			)
			// Animate back y basis
			.to(
				yCoords,
				{
					duration,
					endArray: [0, 0, 0, 0, 1, 0],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-1"
			)
			.add("step-2")
			.to(
				props,
				{
					duration,
					xTexOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					duration,
					yTexOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			);

		// Animate in points
		// FIXME: Animate vectors too?
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-6",
					end: `+=${scrollUnit * 4}`,
					onLeaveBack: () => {
						stProps.onLeaveBack();

						$dataToggled = undefined;
						$transformedGridToggled = false;
					}
				}
			})
			.add("step-1")
			// Animate in vectors
			.to(
				vectorsProps,
				{
					enter: 1,
					onUpdate: function () {
						vectorsProps = vectorsProps;
					}
				},
				"step-1"
			)
			// Animate out vectors
			.to(
				vectorsProps,
				{
					exit: 0,
					onUpdate: function () {
						vectorsProps = vectorsProps;
					}
				},
				"step-1+=0.1"
			)
			// Animate in points
			.to(
				pointsProps,
				{
					t: 1,
					onUpdate: function () {
						pointsProps = pointsProps;
					}
				},
				"step-1+=0.15"
			)
			// Animate in transformed grid
			.to(
				gridVars,
				{
					transformedFadeDistance: gridProps.fadeDistance,
					onUpdate: function () {
						gridVars = gridVars;
					}
				},
				"step-1+=0.15"
			)
			.to(
				{},
				{
					duration: delay
				}
			);

		// Perform linear transformation
		// TODO: Use afterimage for animation of points?
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-7",
					end: `+=${scrollUnit * 1}`,
					onToggle: (self) => {
						// $dataToggled = self.isActive ? "points" : undefined;
						$dataToggled = "points";
						$transformedGridToggled = true;
					}
				}
			})
			.add("step-1")
			// Perform linear transformation
			.to(
				$matrixTween,
				{
					progress: 1.0
				},
				"step-1"
			)
			// .fromTo(
			// 	$customMatrix,
			// 	{
			// 		endArray: initMatrix
			// 	},
			// 	{
			// 		endArray: egEndMatrix,
			// 		onUpdate: () => {
			// 			$matrixTransform = $customMatrix;
			// 		},
			// 	},
			// 	"step-1"
			// )
			// .to(
			// 	$customMatrix,
			// 	{
			// 		endArray: egEndMatrix,
			// 		onUpdate: () => {
			// 			$customMatrix = $customMatrix;
			// 		}
			// 	},
			// 	"step-1"
			// )
			// Animate to new basis vectors
			.to(
				xCoords,
				{
					endArray: [0, 0, 0, ...egMatrixX, 0],
					onUpdate: function () {
						xCoords = xCoords;
					}
				},
				"step-1"
			)
			.to(
				yCoords,
				{
					endArray: [0, 0, 0, ...egMatrixY, 0],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-1"
			)
			.to(
				{},
				{
					duration: delay
				}
			);

		// Let users do some input!
		gsap
			.timeline({
				scrollTrigger: {
					...stPropsAlt,
					trigger: "#st-8",
					start: "top center",
					onEnter: () => {
						$showPlayground = true;
						tryNarrative = true;

						$inputVectorToggled = true;
					},
					onLeaveBack: () => {
						// When going back from playground to interactive

						$showPlayground = false;
						tryNarrative = false;

						$cameraControls.reset(true);

						// FIXME: Cache settings!
						// Reset input settings
						$dataToggled = "points";
						$gridToggled = true;
						$transformedGridToggled = true;
						$inputVectorToggled = false;

						// Reset playhead
						$matrixTween.progress(1);

						// Reset matrix transform
						gsap.to($endMatrix, {
							endArray: egEndMatrix,
							onUpdate: () => {
								$endMatrix = $endMatrix;
							},
							duration
						});
					}
				},
				timelinePropsAlt
			})
			.add("step-1")
			// Make canvas interactable
			.to(
				"#canvas-wrapper",
				{
					pointerEvents: "auto",
					// cursor: "move",
					duration
				},
				"step-1"
			)
			// Show input
			.from(
				"#inputs",
				{
					autoAlpha: 0,
					x: -40,
					duration
				},
				"step-1"
			)
			// Animate basis vectors to interactive position
			.fromTo(
				xCoords,
				{
					endArray: [0, 0, 0, ...egMatrixX, 0]
				},
				{
					endArray: () => [0, 0, 0, matrix[0], matrix[4], 0],
					onUpdate: () => {
						xCoords = xCoords;
					},
					immediateRender: false,
					duration
				},
				"step-1"
			)
			.fromTo(
				yCoords,
				{
					endArray: [0, 0, 0, ...egMatrixY, 0]
				},
				{
					endArray: () => [0, 0, 0, matrix[1], matrix[5], 0],
					onUpdate: () => {
						yCoords = yCoords;
					},
					immediateRender: false,
					duration
				},
				"step-1"
			)
			// Hide basis vectors
			// FIXME: Animate opacity of vectors
			.to(
				props,
				{
					duration,
					xTexOpacity: 0,
					yTexOpacity: 0,
					// xVisible: false,
					// yVisible: false,
					onUpdate: function () {
						props = props;
					}
				},
				"step-1"
			)
			// Show alt basis vectors
			.to(
				basisAltProps,
				{
					duration: 0.001,
					xVisible: true,
					yVisible: true,
					onUpdate: function () {
						basisAltProps = basisAltProps;
					}
				},
				"step-1"
			)
			.to(
				props,
				{
					duration: 0.001,
					xVisible: false,
					yVisible: false,
					onUpdate: function () {
						props = props;
					}
				},
				"step-1"
			);
		// Show example vector

		// Guided walk-through of the 2D playground (st-try-1..5): scrolling
		// scrubs the playground matrix through one type of transformation per
		// beat. Every beat first returns to the identity and then applies its
		// own matrix, so each type is seen against the untransformed grid.
		const identity2d = [1, 0, 0, 1];
		const turn = ({ m }) => Math.atan2(m[2], m[0]);

		tryBeats.forEach((beat, i) => {
			const prev = tryBeats[i - 1];

			const tl = gsap.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: `#st-try-${i + 1}`,
					end: `+=${scrollUnit * 1}`,
					// Start values are fixed (or re-read in onEnter below);
					// a refresh must not replay a beat over the reader's matrix
					invalidateOnRefresh: false,
					onEnter: (self) => {
						stProps.onEnter();

						// Show the end state, wherever the playhead was left
						$matrixTween.progress(1);

						if (i === 0) {
							// Frame the walk-through with the default view, however
							// the reader left the camera in the playground
							tryWheelLock = true;
							$cameraControls.reset(true);

							// Start from whatever the reader left in the playground
							tryStart = [
								$endMatrix[0],
								$endMatrix[1],
								$endMatrix[4],
								$endMatrix[5]
							];
							self.animation.invalidate();
						}
					},
					onEnterBack: () => {
						stProps.onEnterBack();

						$matrixTween.progress(1);
					},
					onLeaveBack: () => {
						stProps.onLeaveBack();

						// Back in the free playground: the wheel zooms again
						if (i === 0) tryWheelLock = false;
					}
				}
			});

			// Back to the identity
			if (prev?.rotate) {
				tl.fromTo(
					tryAngle,
					{ t: turn(prev) },
					{
						t: 0,
						duration: 0.25,
						immediateRender: false,
						onUpdate: applyTryAngle
					}
				);
			} else {
				tl.fromTo(
					tryEntries,
					{ endArray: prev ? prev.m : () => tryStart },
					{
						endArray: identity2d,
						duration: 0.25,
						immediateRender: false,
						onUpdate: applyTryEntries
					}
				);
			}

			// Apply this beat's transformation
			if (beat.rotate) {
				tl.fromTo(
					tryAngle,
					{ t: 0 },
					{
						t: turn(beat),
						immediateRender: false,
						onUpdate: applyTryAngle
					}
				);
			} else {
				tl.fromTo(
					tryEntries,
					{ endArray: identity2d },
					{
						endArray: beat.m,
						immediateRender: false,
						onUpdate: applyTryEntries
					}
				);
			}

			tl.to({}, { duration: delay });
		});

		// === Determinant chapter ===
		// Bridge: leave the 2D playground, enter determinant mode
		gsap
			.timeline({
				scrollTrigger: {
					...stPropsAlt,
					trigger: "#section-det",
					start: "top center",
					onEnter: () => {
						// Snapshot the playground matrix so scrolling back restores it
						cachedPlaygroundMatrix = [...$endMatrix];

						$showPlayground = false;
						tryNarrative = false;
						$cameraControls.reset(true);

						$dataToggled = undefined;
						$gridToggled = true;
						$transformedGridToggled = true;
						$inputVectorToggled = false;

						$matrixTween.progress(1);
						gsap.to($endMatrix, {
							endArray: initMatrix,
							onUpdate: () => {
								$endMatrix = $endMatrix;
							},
							duration
						});

						basisAltProps.vectorVisible = false;

						// Enter determinant mode from the current visual state,
						// so the canvas transitions in place with no reset
						detMatrix.forEach((_, i) => (detMatrix[i] = $matrixTransform[i]));
						detMatrix = detMatrix;
						detNarrative = true;

						// Then ease back to the identity, so the chapter opens with
						// both basis vectors drawn from the origin (the walk-through
						// ends on Flatten, where ĵ has no length)
						if (detPresetTween) detPresetTween.kill();
						detPresetTween = gsap.to(detMatrix, {
							endArray: [...initMatrix],
							duration,
							onUpdate: () => (detMatrix = detMatrix)
						});
					},
					onLeaveBack: () => {
						detNarrative = false;

						$showPlayground = true;
						tryNarrative = true;
						$inputVectorToggled = true;
						basisAltProps.vectorVisible = true;

						if (cachedPlaygroundMatrix) {
							gsap.to($endMatrix, {
								endArray: cachedPlaygroundMatrix,
								onUpdate: () => {
									$endMatrix = $endMatrix;
								},
								duration
							});
						}
					}
				}
			})
			.add("step-1")
			.to(
				"#canvas-wrapper",
				{
					pointerEvents: "none",
					duration
				},
				"step-1"
			)
			.to(
				"#inputs",
				{
					autoAlpha: 0,
					x: -40,
					duration
				},
				"step-1"
			);

		// Shade the unit square at the identity; show the det readout
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-det-1",
					end: `+=${scrollUnit * 1}`
				}
			})
			.add("step-1")
			.to(
				detMatrix,
				{
					endArray: [...initMatrix],
					onUpdate: () => (detMatrix = detMatrix)
				},
				"step-1"
			)
			.to(
				squareProps,
				{
					opacity: 1,
					onUpdate: () => (squareProps = squareProps)
				},
				"step-1"
			)
			.to("#det-readout", { autoAlpha: 1 }, "step-1")
			.to({}, { duration: delay });

		// The preset walk-through (st-det-2..6): scrolling through a beat
		// first returns the square to the identity, then plays that beat's
		// transformation, so each one starts from the untouched unit square.
		// From the identity, Reflect passes visibly through det = 0.
		const detBeats = [
			"stretch",
			"compress",
			"shear",
			"rotate",
			"reflect"
		].map((key) => detPresets.find((preset) => preset.key === key));
		const identity2x2 = [1, 0, 0, 1];
		// Rotate turns through the angle instead of blending the entries, so
		// the square keeps its area (det = 1) all the way round
		const blend = (preset, k) => {
			if (preset.key === "rotate") {
				const t = Math.atan2(preset.m[2], preset.m[0]) * k;
				return [Math.cos(t), -Math.sin(t), Math.sin(t), Math.cos(t)];
			}
			return preset.m.map((v, n) => identity2x2[n] + (v - identity2x2[n]) * k);
		};
		// Scrubbed timelines lag behind the scroll, so on a fast scroll
		// several beats are still moving at once. Only the beat the reader
		// entered last writes the square, and it writes the whole matrix.
		let detBeatOwner = null;

		detBeats.forEach((beat, i) => {
			const prev = detBeats[i - 1];
			// undo: 0 -> 1 takes the previous beat back to the identity
			// apply: 0 -> 1 plays this beat from the identity
			const state = { undo: 0, apply: 0 };

			const write = () => {
				if (detBeatOwner !== i) return;

				const m =
					state.apply > 0 || !prev
						? blend(beat, state.apply)
						: blend(prev, 1 - state.undo);
				[detMatrix[0], detMatrix[1], detMatrix[4], detMatrix[5]] = m;
				detMatrix = detMatrix;
			};
			const own = () => {
				detBeatOwner = i;
				// Scrolling now owns the square
				if (detPresetTween) detPresetTween.kill();
				// Entering at a point where the timeline is holding still
				// (scrolling back up from the section below) renders nothing
				// by itself
				write();
			};

			gsap
				.timeline({
					...timelineProps,
					scrollTrigger: {
						...stProps,
						trigger: `#st-det-${i + 2}`,
						end: `+=${scrollUnit * 1}`,
						onEnter: () => {
							stProps.onEnter();
							own();
						},
						onEnterBack: () => {
							stProps.onEnterBack();
							own();
						}
					}
				})
				.fromTo(
					state,
					{ undo: 0 },
					{ undo: 1, duration: 0.25, immediateRender: false, onUpdate: write }
				)
				.fromTo(
					state,
					{ apply: 0 },
					{ apply: 1, immediateRender: false, onUpdate: write }
				)
				.to({}, { duration: delay });
		});

		// === The determinant and invertibility (st-inv-1..8) ===
		// Bridge: the reader arrives from "Try it" with their own matrix
		// applied; hand the canvas back to the scroll, from the identity.
		// Only once the "Try it" block has all but left the screen — while
		// any of it is still readable, its matrix has to stay editable.
		let invBeatOwner = null;

		gsap.timeline({
			scrollTrigger: {
				...stPropsAlt,
				trigger: "#det-try",
				start: "bottom 10%",
				onEnter: () => {
					$invNarrative = true;
					detBeatOwner = null;
					invBeatOwner = null;

					if (detPresetTween) detPresetTween.kill();
					// A slow return, so the reader sees their own square
					// settle back before the vectors change
					detPresetTween = gsap.to(detMatrix, {
						endArray: [...initMatrix],
						duration: 0.9,
						ease: "power2.inOut",
						onUpdate: () => (detMatrix = detMatrix)
					});
				},
				onLeaveBack: () => {
					$invNarrative = false;
					invBeatOwner = null;

					clearTrack();
					track = track;
				}
			}
		});

		const clamp01 = (v) => Math.min(1, Math.max(0, v));
		// Every vector a beat follows, and how far its matrix is still
		// applied once the beat has finished
		const invVectors = (beat) => [...beat.vectors, ...(beat.more ?? [])];
		const invEndK = (beat) => (beat.mode === "roundTrip" ? 0 : 1);
		const sameVectors = (a, b) =>
			a.length === b.length &&
			a.every((v, n) => v[0] === b[n][0] && v[1] === b[n][1]);
		// The two vectors of each beat that span its shaded area
		const invPairs = invBeats.map((beat) => beat.vectors.slice(0, 2));
		const basisColors = [colorX, colorY];
		const mixHex = (from, to, t) =>
			"#" +
			[1, 3, 5]
				.map((at) => {
					const a = parseInt(from.slice(at, at + 2), 16);
					const b = parseInt(to.slice(at, at + 2), 16);
					return Math.round(a + (b - a) * t)
						.toString(16)
						.padStart(2, "0");
				})
				.join("");

		invBeats.forEach((beat, i) => {
			const prev = invBeats[i - 1];
			const hold = beat.mode === "hold";
			const keepsVectors =
				prev && sameVectors(invVectors(prev), invVectors(beat));
			// undo: 0 -> 1 takes the previous beat back to the identity
			// apply: 0 -> 1 plays this beat from the identity
			// back: 0 -> 1 plays it backwards again (roundTrip)
			// q1..q3: the starting points vanish, then return one at a time
			// extra: further candidates, and the line they all sit on
			const state = {
				undo: 0,
				apply: 0,
				back: 0,
				q1: 0,
				q2: 0,
				q3: 0,
				extra: 0
			};

			const write = () => {
				if (invBeatOwner !== i) return;

				// Still showing the previous beat, on its way back
				const undoing = !hold && prev && state.apply === 0;
				const shown = undoing ? prev : beat;
				const vectors = invVectors(shown);
				const collapses = shown.mode !== "roundTrip";

				// The first beat grows out of the unit square: before its
				// matrix plays, î and ĵ glide over to its two vectors
				// (morph 0 -> 1), taking the shaded area along
				const morph = i === 0 ? state.undo : 1;

				// k: how far the matrix is applied; fade: the vectors
				// themselves, which swap while the grid is at the identity
				let k, fade;
				if (undoing) {
					k = invEndK(prev) * (1 - state.undo);
					fade = keepsVectors ? 1 : clamp01((1 - state.undo) / 0.2);
				} else if (hold) {
					k = 1;
					fade = 1;
				} else {
					k = clamp01((state.apply - 0.15) / 0.85) * (1 - state.back);
					fade = keepsVectors ? 1 : clamp01(state.apply / 0.15);
				}
				if (i === 0) fade = morph > 0 ? 1 : 0;

				// What the finished previous beat had on screen fades with it
				const left = undoing ? clamp01(1 - state.undo * 2) : 1;
				const asked = undoing
					? prev.mode === "question" || prev.mode === "hold"
					: beat.mode === "question" || hold;
				const settled = undoing || hold;

				vectors.forEach((v, n) => {
					const added = n >= shown.vectors.length;
					const path = clamp01(k * 4);

					const gliding = morph < 1 && n < 2;
					track.starts[n] = gliding
						? unitPair[n].map((c, axis) => c + (v[axis] - c) * morph)
						: v;
					track.colors[n] = added
						? invColorShared
						: gliding
						? mixHex(basisColors[n], invColors[n], morph)
						: invColors[n];
					track.image[n] = fade * (added && hold ? state.extra : 1);

					if (!asked) {
						track.ghost[n] = path;
						track.mark[n] = 0;
					} else if (added) {
						track.ghost[n] = track.mark[n] = hold ? state.extra : left;
					} else if (settled) {
						track.ghost[n] = path;
						track.mark[n] = left;
					} else {
						const back = n === 0 ? state.q2 : state.q3;
						track.ghost[n] = path * (1 - state.q1) + back;
						track.mark[n] = back;
					}
				});
				for (let n = vectors.length; n < invPoolSize; n++) {
					track.image[n] = track.ghost[n] = track.mark[n] = 0;
				}

				// Different vectors that have collapsed into one: the one
				// they became is red, wherever each of them started
				track.landing = collapses ? clamp01((k - 0.8) / 0.2) : 0;
				vectors.forEach((_, n) => {
					track.imageColors[n] = mixHex(
						track.colors[n],
						invColorResult,
						track.landing
					);
				});

				// î and ĵ themselves are swapped for the gliding copies as
				// soon as those start to move; their labels fade more slowly
				track.basis = i === 0 ? 1 - fade : 0;
				track.basisLabel = i === 0 ? 1 - clamp01(morph / 0.35) : 0;
				track.area = fade;
				track.areaPair =
					morph < 1
						? [track.starts[0], track.starts[1]]
						: invPairs[undoing ? i - 1 : i];
				$invPair =
					track.basis < 0.5
						? {
								vectors: track.areaPair,
								colors: [track.colors[0], track.colors[1]],
								resultColors: [track.imageColors[0], track.imageColors[1]],
								labels: track.basisLabel
						  }
						: null;

				track.label = shown.label ?? [0.2, -0.45];
				track.question = !asked ? 0 : settled ? left : state.q1;

				track.fiber = shown.fiber ? (hold ? state.extra : left) : 0;
				if (shown.fiber) {
					const [[x1, y1], [x2, y2]] = shown.fiber;
					track.fiberCoords = [x1, y1, 0, x2, y2, 0];
				}
				track = track;

				[detMatrix[0], detMatrix[1], detMatrix[4], detMatrix[5]] = blend(
					shown,
					k
				);
				detMatrix = detMatrix;
			};
			const own = () => {
				invBeatOwner = i;
				if (detPresetTween) detPresetTween.kill();
				write();
			};
			if (i === invBeats.length - 1) invRestore = own;

			const tween = (key, vars = {}) => [
				state,
				{ [key]: 0 },
				{ [key]: 1, immediateRender: false, onUpdate: write, ...vars }
			];
			const timeline = gsap.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: `#st-inv-${i + 1}`,
					end: `+=${
						scrollUnit *
						(i > 0 && (hold || beat.mode === "collapse") ? 1 : 1.5)
					}`,
					onEnter: () => {
						stProps.onEnter();
						own();
					},
					onEnterBack: () => {
						stProps.onEnterBack();
						own();
					}
				}
			});

			if (hold) {
				timeline.fromTo(...tween("extra"));
			} else {
				timeline
					.fromTo(
						...tween(
							"undo",
							// The first beat's glide from î and ĵ takes its time
							i === 0
								? { duration: 0.5, ease: "power1.inOut" }
								: { duration: 0.25 }
						)
					)
					.fromTo(...tween("apply"));
			}
			if (beat.mode === "question") {
				timeline
					.fromTo(...tween("q1", { duration: 0.25 }))
					.to({}, { duration: delay })
					.fromTo(...tween("q2", { duration: 0.25 }))
					.fromTo(...tween("q3", { duration: 0.25 }));
			}
			if (beat.mode === "roundTrip") {
				timeline.to({}, { duration: delay * 2 }).fromTo(...tween("back"));
			}
			timeline.to({}, { duration: delay });
		});

		// Brief 3D determinant extension, in the existing scene and camera.
		function enterVolume(reset = false) {
			if (detPresetTween) detPresetTween.kill();
			detBeatOwner = invBeatOwner = null;
			$invNarrative = false;
			clearTrack();
			track = track;
			detNarrative = true;
			if (reset) {
				volumeTween?.kill();
				volumePreset = det3dPresets[0];
				volumeMotion.progress = 0;
				$det3dMatrix = [...volumePreset.matrix];
				$det3dPresetRequest = null;
			}
			$det3dActive = true;
			$showPlayground = false;
			$show3d = true;
			$show2d = false;
			$cameraAutoRotate = false;
			$grid3dToggled = true;
			$transformedGridToggled = true;
			gsap.to(squareProps, {
				opacity: 0,
				duration: 0.6,
				overwrite: true,
				onUpdate: () => (squareProps = squareProps)
			});
			gsap.to(volumeProps, {
				opacity: 1,
				duration: 0.9,
				overwrite: true,
				onUpdate: () => (volumeProps = volumeProps)
			});
			gsap.to($cameraControls, {
				distance: 9,
				polarAngle: Math.PI * 0.35,
				azimuthAngle: Math.PI * 0.3,
				duration: 0.9,
				ease: "power2.inOut",
				overwrite: "auto"
			});
			gsap.to("#det-readout", { autoAlpha: 1, duration: 0.3, overwrite: true });
		}
		function leaveVolume() {
			$det3dActive = false;
			volumeTween?.kill();
			$show3d = false;
			$show2d = true;
			$grid3dToggled = false;
			gsap.to(volumeProps, {
				opacity: 0,
				duration: 0.3,
				overwrite: true,
				onUpdate: () => (volumeProps = volumeProps)
			});
			gsap.killTweensOf($cameraControls);
			$cameraControls.reset(true);
		}
		ScrollTrigger.create({
			...stPropsAlt,
			trigger: "#section-det3d",
			start: "top center",
			onEnter: () => enterVolume(true),
			onLeaveBack: () => {
				leaveVolume();
				$invNarrative = true;
				invRestore();
				gsap.to(squareProps, {
					opacity: 1,
					duration: 0.6,
					overwrite: true,
					onUpdate: () => (squareProps = squareProps)
				});
			}
		});


		// Animate back
		gsap
			.timeline({
				scrollTrigger: {
					...stPropsAlt,
					trigger: "#section-2",
					start: "top center",
					// FIXME:
					// onToggle: () => {
					onEnter: () => {
						// stProps.onEnter();
						leaveVolume();

						$showPlayground = false;

						// Leave determinant mode; hide square and readout
						detNarrative = false;
						$invNarrative = false;
						invBeatOwner = null;
						clearTrack();
						track = track;
						gsap.to(squareProps, {
							opacity: 0,
							duration,
							onUpdate: () => (squareProps = squareProps)
						});
						gsap.to("#det-readout", { autoAlpha: 0, duration });

						// Return to default camera position
						$cameraControls.reset(true);

						// Reset input settings
						// cachePlaygroundSettings.dataToggled = $dataToggled;
						$dataToggled = undefined;
						$gridToggled = true;
						$transformedGridToggled = false;
						$inputVectorToggled = false;

						// Reset playhead
						$matrixTween.progress(1);

						// Reset matrix transform
						gsap.to($endMatrix, {
							endArray: initMatrix,
							onUpdate: () => {
								$endMatrix = $endMatrix;
							},
							duration
						});
					},
					onLeaveBack: () => {
						// stProps.onLeaveBack();

						// Restore the cube and its last matrix on upward scrolling.
						enterVolume();

						// $dataToggled = cachePlaygroundSettings.dataToggled;
					}
				},
				timelinePropsAlt
			})
			.add("step-1")
			// Change grid settings
			.to(
				gridVars,
				{
					duration,
					fadeDistance: grid3dProps.fadeDistance,
					onUpdate: () => {
						gridVars = gridVars;
					}
				},
				"step-1"
			)
			// (Hiding #inputs / disabling the canvas now happens at the
			// determinant-chapter bridge, which sits before this section)
			// Reset basis vectors
			.to(
				xCoords,
				{
					endArray: () => [0, 0, 0, 1, 0, 0],
					onUpdate: () => {
						xCoords = xCoords;
					},
					duration: 0.001
				},
				"step-1"
			)
			.to(
				yCoords,
				{
					endArray: () => [0, 0, 0, 0, 1, 0],
					onUpdate: () => {
						yCoords = yCoords;
					},
					duration: 0.001
				},
				"step-1"
			)
			.add("step-2")
			.to(
				basisAltProps,
				{
					duration: 0.001,
					xVisible: false,
					yVisible: false,
					onUpdate: function () {
						basisAltProps = basisAltProps;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					duration: 0.001,
					xVisible: true,
					yVisible: true,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			);

		// Show third dimension
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-9",
					end: `+=${scrollUnit * 3}`,
					onEnter: () => {
						stProps.onEnter();

						$show3d = true;
            $show2d = false
						basisAltProps.zVisible = false;

						// // Update matrix transform
						// gsap.to($endMatrix, {
						// 	endArray: eg3dMatrix,
						// 	onUpdate: () => {
						// 		$endMatrix = $endMatrix;
						// 	},
						// 	duration
						// });

						basisAltProps.vectorVisible = false;

						// $inputVectorToggled = true;

						// $vectorCoordsInput[0] = eg3dVector[0];
						// $vectorCoordsInput[1] = eg3dVector[1];
						// $vectorCoordsInput[2] = eg3dVector[2];
					},
					onLeaveBack: () => {
						stProps.onLeaveBack();

						$show3d = false;
            $show2d = true
						$grid3dToggled = false;

						$inputVectorToggled = false;
						onInputVectorToggle(false);

						// basisAltProps.vectorVisible = true;

						// $vectorCoordsInput = egVector;
						// $vectorCoordsInput[0] = egVector[0];
						// $vectorCoordsInput[1] = egVector[1];
						// $vectorCoordsInput[2] = 0;

						// $inputVectorToggled = false;

						// // Reset matrix transform
						// gsap.to($endMatrix, {
						// 	endArray: initMatrix,
						// 	onUpdate: () => {
						// 		$endMatrix = $endMatrix;
						// 	},
						// 	duration
						// });
					},
					onLeave: () => {
						stProps.onLeave();

						$cameraAutoRotate = true;
						$grid3dToggled = true;
					},
					onEnterBack: () => {
						stProps.onEnterBack();

						$cameraAutoRotate = false;
						gsap.to($cameraControls, {
							azimuthAngle: Math.PI * 0.3
						});
					}
				}
			})
			.add("step-0")
			.to(
				$cameraControls.mouseButtons,
				{
					right: CameraControls.ACTION.ROTATE,
					duration: 0.001
				},
				"step-0"
			)
			// Update matrix
			.to(
				{},
				{
					duration: delay
				},
				"step-0"
			)
			.add("step-1")
			// Change camera position
			.to(
				$cameraControls,
				{
					// distance: 8.5,
					distance: 15,
					polarAngle: Math.PI * 0.35,
					// azimuthAngle: `+=${Math.PI * 0.3}`
					azimuthAngle: Math.PI * 0.3
				},
				"step-1"
			)
			// Animate in z basis
			.to(
				zCoords,
				{
					endArray: [0, 0, 0, 0, 0, 1],
					onUpdate: function () {
						zCoords = zCoords;
					}
				},
				"step-1"
			)
			.to(
				props,
				{
					xTexOpacity: 1,
					yTexOpacity: 1,
					xDim3: true,
					yDim3: true,
					zDim3: true,
					vectorDim3: true,
					onUpdate: function () {
						props = props;
					}
				},
				"step-1"
			)
			// Animate in example vector
			.to(
				vectorCoords,
				{
					endArray: [0, 0, 0, ...eg3dVector],
					onUpdate: function () {
						vectorCoords = vectorCoords;
					}
				},
				"step-1"
			)
			// .to(
			// 	$vectorCoordsInput,
			// 	{
			// 		endArray: eg3dVector,
			// 		onUpdate: function () {
			// 			$vectorCoordsInput = $vectorCoordsInput;
			// 		}
			// 	},
			// 	"step-1"
			// )
			.add("step-2")
			.to(
				$matrixTween,
				{
					progress: 0,
					duration: 0.001
				},
				"step-2"
			)
			.to(
				$endMatrix,
				{
					endArray: eg3dMatrix,
					duration: 0.001,
					onUpdate: function () {
						$endMatrix = $endMatrix;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					zTexOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			.to(
				props,
				{
					vectorTexOpacity: 1,
					onUpdate: function () {
						props = props;
					}
				},
				"step-2"
			)
			// Animate in 3d grid
			.to(
				grid3dProps,
				{
					cellThickness: defaultGridProps.cellThickness,
					sectionThickness: defaultGridProps.sectionThickness,
					onUpdate: function () {
						grid3dProps = grid3dProps;
					}
				},
				"step-2"
			)
			.add("step-3")
			.to(
				grid3dProps,
				{
					t: 1,
					onUpdate: function () {
						grid3dProps = grid3dProps;
					}
				},
				"step-3"
			)
			.to(
				{},
				{
					duration: delay
				}
			);

		// Perform linear transformation; in 3D!
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-10",
					end: `+=${scrollUnit * 1}`,
					onEnter: () => {
						stProps.onEnter();

						$vectorCoordsInput[0] = eg3dVector[0];
						$vectorCoordsInput[1] = eg3dVector[1];
						$vectorCoordsInput[2] = eg3dVector[2];
					},
					onLeaveBack: () => {
						stProps.onLeaveBack();

						$vectorCoordsInput[0] = egVector[0];
						$vectorCoordsInput[1] = egVector[1];
						$vectorCoordsInput[2] = 0;
					}
				}
			})
			.add("step-1")
			.to(
				$matrixTween,
				{
					progress: 1.0
				},
				"step-1"
			)
			// Animate to new basis vectors
			.to(
				xCoords,
				{
					endArray: [0, 0, 0, ...eg3dMatrixX],
					onUpdate: function () {
						xCoords = xCoords;
					}
				},
				"step-1"
			)
			.to(
				yCoords,
				{
					endArray: [0, 0, 0, ...eg3dMatrixY],
					onUpdate: function () {
						yCoords = yCoords;
					}
				},
				"step-1"
			)
			.to(
				zCoords,
				{
					endArray: [0, 0, 0, ...eg3dMatrixZ],
					onUpdate: function () {
						zCoords = zCoords;
					}
				},
				"step-1"
			)
			// Animate output vector
			.to(
				vectorCoords,
				{
					endArray: [0, 0, 0, ...eg3dOutputVector],
					onUpdate: function () {
						vectorCoords = vectorCoords;
					}
				},
				"step-1"
			)
			.to(
				{},
				{
					duration: delay
				}
			);

		// TODO: What is the best way to show transformations of space in 3D?
		// FIXME: Do we need this animation again?
		// Show linear combination;  Scale the basis vectors to the transformed vector
		// gsap
		// 	.timeline({
		// 		...timelineProps,
		// 		scrollTrigger: {
		// 			...stProps,
		// 			trigger: "#st-11",
		// 			end: `+=${scrollUnit * 3}`
		// 		}
		// 	})
		// 	.add("step-1")
		// 	// Animate out Tex
		// 	.to(
		// 		props,
		// 		{
		// 			xTexOpacity: 0,
		// 			yTexOpacity: 0,
		// 			zTexOpacity: 0,
		// 			onUpdate: function () {
		// 				props = props;
		// 			}
		// 		},
		// 		"step-1"
		// 	)
		// 	.add("step-2")
		// 	// Show scalars
		// 	.to(
		// 		props,
		// 		{
		// 			duration: 0.2,
		// 			xScalarOpacity: 1,
		// 			yScalarOpacity: 1,
		// 			zScalarOpacity: 1,
		// 			onUpdate: function () {
		// 				props = props;
		// 			}
		// 		},
		// 		"step-2"
		// 	)
		// 	// Scale basis vectors
		// 	.to(
		// 		xCoords,
		// 		{
		// 			endArray: [
		// 				0,
		// 				0,
		// 				0,
		// 				eg3dVector[0] * eg3dMatrixX[0],
		// 				eg3dVector[0] * eg3dMatrixX[1],
		// 				eg3dVector[0] * eg3dMatrixX[2]
		// 			],
		// 			onUpdate: function () {
		// 				xCoords = xCoords;
		// 			}
		// 		},
		// 		"step-2"
		// 	)
		// 	.to(
		// 		yCoords,
		// 		{
		// 			endArray: [
		// 				0,
		// 				0,
		// 				0,
		// 				eg3dVector[1] * eg3dMatrixY[0],
		// 				eg3dVector[1] * eg3dMatrixY[1],
		// 				eg3dVector[1] * eg3dMatrixY[2]
		// 			],
		// 			onUpdate: function () {
		// 				yCoords = yCoords;
		// 			}
		// 		},
		// 		"step-2"
		// 	)
		// 	.to(
		// 		zCoords,
		// 		{
		// 			endArray: [
		// 				0,
		// 				0,
		// 				0,
		// 				eg3dVector[2] * eg3dMatrixZ[0],
		// 				eg3dVector[2] * eg3dMatrixZ[1],
		// 				eg3dVector[2] * eg3dMatrixZ[2]
		// 			],
		// 			onUpdate: function () {
		// 				zCoords = zCoords;
		// 			}
		// 		},
		// 		"step-2"
		// 	)
		// 	// Animate scalar text too
		// 	.to(
		// 		props,
		// 		{
		// 			xScalar: eg3dVector[0],
		// 			yScalar: eg3dVector[1],
		// 			zScalar: eg3dVector[2],
		// 			onUpdate: function () {
		// 				props = props;
		// 			}
		// 		},
		// 		"step-2"
		// 	)
		// 	.to({}, { duration: delay });

		// Maxwell the carryable cat
		gsap
			.timeline({
				...timelineProps,
				scrollTrigger: {
					...stProps,
					trigger: "#st-12",
					end: `+=${scrollUnit * 1}`,
					onLeave: () => {
						stProps.onLeave();

						$dataToggled = "model";

						$inputVectorToggled = true;
					},
					onLeaveBack: () => {
						stProps.onLeaveBack();

						$dataToggled = undefined;
					}
				}
			})
			.to(modelProps, {
				scale: 0.25,
				onUpdate: function () {
					modelProps = modelProps;
				}
			})
			.to(
				{},
				{
					duration: delay
				}
			);

		// Show playground
		const playgroundTl = gsap
			.timeline({
				scrollTrigger: {
					...stPropsAlt,
					trigger: "#st-13",
					start: "top center",
					onEnter: () => {
						$cameraAutoRotate = false;

						$showPlayground = true;

						basisAltProps.vectorVisible = true;
						props.vectorVisible = true;
					},
					onLeaveBack: () => {
						$cameraAutoRotate = true;

						$showPlayground = false;

						// Reset
						$dataToggled = "model";
						$grid3dToggled = true;
						$gridToggled = true;
						$transformedGridToggled = false;

						$show3d = true;

						// Reset playhead
						$matrixTween.progress(1);

						// Reset matrix transform
						gsap.to($endMatrix, {
							endArray: eg3dMatrix,
							onUpdate: () => {
								$endMatrix = $endMatrix;
							},
							duration
						});

						basisAltProps.vectorVisible = false;
						props.vectorVisible = false;
					}
				},
				timelinePropsAlt
			})
			.add("step-1")
			// Make canvas interactable
			.to(
				"#canvas-wrapper",
				{
					pointerEvents: "auto",
					// cursor: "move",
					duration
				},
				"step-1"
			)
			// Show input
			.to(
				"#inputs",
				{
					autoAlpha: 1,
					x: 0,
					duration
				},
				"step-1"
			)
			// Hide basis vectors
			.to(
				props,
				{
					duration,
					xTexOpacity: 0,
					yTexOpacity: 0,
					zTexOpacity: 0,
					vectorTexOpacity: 0,
					xVisible: false,
					yVisible: false,
					zVisible: false,
					onUpdate: function () {
						props = props;
					}
				},
				"step-1"
			)
			// Show alt basis vectors
			.to(
				basisAltProps,
				{
					duration,
					xVisible: true,
					yVisible: true,
					zVisible: true,
					onUpdate: function () {
						basisAltProps = basisAltProps;
					}
				},
				"step-1"
			);

		// $playgroundSt = playgroundTl.scrollTrigger;

		// ScrollTrigger.create({
		// 	trigger: "#article",
		// 	start: "bottom bottom",
		// 	onEnter: () => {
		// 		console.log("enter");
		// 		$showPlayground = false;
		// 	},
		// 	onLeaveBack: () => {
		// 		$showPlayground = true;
		// 	}
		// });

		const test = gsap
			.timeline({
				scrollTrigger: {
					...stPropsAlt,
					trigger: "#article",
					start: "bottom bottom",
					onEnter: () => {
						$showPlayground = false;
					},
					onLeaveBack: () => {
						$showPlayground = true;
					}
				},
				timelinePropsAlt
			})
			.to(
				"#inputs",
				{
					autoAlpha: 0,
					x: -40,
					duration
				},
				"step-1"
			);

		$playgroundSt = test.scrollTrigger;

		// ScrollTrigger.refresh()

		// $arcadeMounted = true

		// Text animations
		gsap.utils.toArray("#article section.animate > *").forEach((el) => {
			let animation;

			if (el.className === "exclude") {
				animation = gsap
					.timeline({ paused: true })
					.from(el, {
						opacity: 0,
						y: 100,
						duration: 0.6
					})
					.from(el.querySelectorAll("li"), {
						x: -40,
						opacity: 0,
						stagger: {
							amount: 0.3
						}
					});
			} else {
				animation = gsap.from(el, {
					opacity: 0,
					y: 20,
					paused: true
				});
			}

			ScrollTrigger.create({
				trigger: el,
				start: "top center",
				animation,
				pinnedContainer: "#article"
			});
		});
	}

	function updateStProgress(progress) {
		gsap.set("#st-progress", {
			scaleY: progress
		});
	}
	function animateInStProgress() {
		gsap.to("#st-progress", {
			opacity: 1,
			duration: 0.5
		});
	}
	function animateOutStProgress() {
		gsap.to("#st-progress", {
			opacity: 0,
			duration: 0.5
		});
	}

	// TODO: Make sure ScrollTriggers are in order
	// DOM / Layout is already mounted
	$: if (!$debug && mounted && $sceneMounted) animate();

	onMount(() => {
		mounted = true;

		// Capture phase on the wrapper runs before camera-controls' own
		// listener on the canvas
		const wrapper = document.querySelector("#canvas-wrapper");
		window.addEventListener("scroll", onPageScroll, { passive: true });
		wrapper.addEventListener("wheel", onCanvasWheel, {
			capture: true,
			passive: true
		});

		return () => {
			window.removeEventListener("scroll", onPageScroll);
			wrapper.removeEventListener("wheel", onCanvasWheel, { capture: true });
		};
	});
</script>

{#if $showHero}
	<Hero />
{/if}

<!-- TODO: Shadows? -->

<!-- TODO: Add sky? -->
<!-- <Sky /> -->

<!-- Peripherals -->
<!-- <Grid {view} {dim} opacity={0.2} {gridColor} {axisColor} />
<Grid view={transformedView} {dim} {gridColor} {axisColor} /> -->

<!-- Example vector -->
<Vector
	{view}
	coords={vectorCoords}
	color={colorVector}
	texOpacity={props.vectorTexOpacity}
	visible={props.xVisible && !$det3dActive}
	dim3={props.vectorDim3}
/>

<!-- Example vector that animates on input -->
<Vector
	view={transformedView}
	coords={[0, 0, 0, ...$vectorCoordsSpring]}
	color={colorVector}
	tex={false}
	visible={basisAltProps.vectorVisible && !$det3dActive}
/>

<!-- Basis vectors -->
<Vector
	{view}
	coords={xCoords}
	color={colorX}
	texOpacity={props.xTexOpacity}
	scalar={props.xScalar}
	scalarOpacity={props.xScalarOpacity}
	scalarAlign={props.xScalarAlign}
	visible={props.xVisible && !$det3dActive}
	dim3={props.xDim3}
/>
<Vector
	{view}
	coords={yCoords}
	color={colorY}
	texOpacity={props.yTexOpacity}
	scalar={props.yScalar}
	scalarOpacity={props.yScalarOpacity}
	scalarAlign={props.yScalarAlign}
	visible={props.yVisible && !$det3dActive}
	dim3={props.yDim3}
/>
<Vector
	{view}
	coords={zCoords}
	color={colorZ}
	texOpacity={props.zTexOpacity}
	scalar={props.zScalar}
	scalarOpacity={props.zScalarOpacity}
	scalarAlign={props.zScalarAlign}
	visible={props.zVisible && !$det3dActive}
	dim3={props.zDim3}
/>

<!-- Basis vectors (that animate on input) -->
<Vector
	view={transformedView}
	coords={[0, 0, 0, 1, 0, 0]}
	color={$highlightedBasis === "x" ? colorHighlight : colorX}
	tex={false}
	visible={basisAltProps.xVisible && track.basis > 0.01 && !$det3dActive}
	width={$highlightedBasis === "x" ? 4 : 3}
	opacity={($highlightedBasis === "y" ? 0.25 : 1) * track.basis}
/>
<Vector
	view={transformedView}
	coords={[0, 0, 0, 0, 1, 0]}
	color={$highlightedBasis === "y" ? colorHighlight : colorY}
	tex={false}
	visible={basisAltProps.yVisible && track.basis > 0.01 && !$det3dActive}
	width={$highlightedBasis === "y" ? 4 : 3}
	opacity={($highlightedBasis === "x" ? 0.25 : 1) * track.basis}
/>
<Vector
	view={transformedView}
	coords={[0, 0, 0, 0, 0, 1]}
	color={colorZ}
	tex={false}
	visible={basisAltProps.zVisible && !$det3dActive}
/>

<DetVolume {view} matrix={$det3dMatrix} opacity={volumeProps.opacity} />

<!-- Unit square -> parallelogram, shaded by determinant sign. The inner
     group makes it the area spanned by two tracked vectors instead of by
     î and ĵ ("The determinant and invertibility") -->
<T.Group renderOrder={-1} matrix={$matrixTransform} matrixAutoUpdate={false}>
	<T.Group matrix={areaMatrix} matrixAutoUpdate={false}>
		<T.Mesh
			position={[0.5, 0.5, 0.002]}
			visible={squareProps.opacity > 0.001}
		>
			<T.PlaneGeometry args={[1, 1]} />
			<T.MeshBasicMaterial
				color={squareColor}
				transparent
				opacity={0.45 *
					squareProps.opacity *
					Math.max(track.basis, track.area)}
				depthWrite={false}
			>
				<T.DoubleSide attach="side" />
			</T.MeshBasicMaterial>
		</T.Mesh>
	</T.Group>
</T.Group>

<!-- Tracked vectors ("The determinant and invertibility"): each one rides the
     transformation, leaving a faded copy and a dashed path behind -->
{#each invPool as n}
	{@const [x, y] = track.starts[n]}
	<Vector
		view={transformedView}
		coords={[0, 0, 0, x, y, 0]}
		color={track.imageColors[n]}
		tex={false}
		visible={track.image[n] > 0.01}
		opacity={track.image[n]}
	/>
	<Vector
		{view}
		coords={[0, 0, 0, x, y, 0]}
		color={track.colors[n]}
		tex={false}
		visible={track.ghost[n] > 0.01}
		opacity={0.3 * track.ghost[n]}
	/>
	<Vector
		{view}
		coords={[x, y, 0, trackImages[n][0], trackImages[n][1], 0]}
		color={track.colors[n]}
		tex={false}
		end={false}
		stroke="dashed"
		width={2}
		visible={track.ghost[n] > 0.01}
		opacity={0.6 * track.ghost[n]}
	/>
	{#if track.mark[n] > 0.01}
		<HTML position={basisLabelPos(x, y)} center>
			<span
				use:noPointer
				class="text-2xl"
				style:color={track.colors[n]}
				style:opacity={track.mark[n]}
			>
				?
			</span>
		</HTML>
	{/if}
{/each}
<!-- Every starting point that lands where the tracked vectors did -->
<Vector
	{view}
	coords={track.fiberCoords}
	color={invColorShared}
	tex={false}
	end={false}
	stroke="dashed"
	width={2}
	visible={track.fiber > 0.01}
	opacity={0.6 * track.fiber}
/>
{#if track.landing > 0.01}
	<HTML
		position={[
			trackImages[0][0] + track.label[0],
			trackImages[0][1] + track.label[1],
			0.01
		]}
	>
		<span
			use:noPointer
			class="whitespace-nowrap text-xl"
			style:color={invColorResult}
			style:opacity={track.landing}
		>
			({trackCoord(trackImages[0][0])}, {trackCoord(trackImages[0][1])})
			<span class="ml-2 italic" style:opacity={track.question}>Reverse?</span>
		</span>
	</HTML>
{/if}

<!-- î / ĵ labels riding the transformed basis vectors (determinant chapter) -->
{#if squareProps.opacity > 0.01 && track.basisLabel > 0.01}
	<HTML
		position={basisTipsMeet
			? basisLabelAside($matrixTransform[0], $matrixTransform[4], 1)
			: basisLabelPos($matrixTransform[0], $matrixTransform[4])}
		center
	>
		<span
			use:noPointer
			class="text-2xl"
			style:color={colorX}
			style:opacity={squareProps.opacity * track.basisLabel}
		>
			{@html katex.renderToString(iHat)}
		</span>
	</HTML>
	<HTML
		position={basisTipsMeet
			? basisLabelAside($matrixTransform[1], $matrixTransform[5], -1)
			: basisLabelPos($matrixTransform[1], $matrixTransform[5])}
		center
	>
		<span
			use:noPointer
			class="text-2xl"
			style:color={colorY}
			style:opacity={squareProps.opacity * track.basisLabel}
		>
			{@html katex.renderToString(jHat)}
		</span>
	</HTML>
{/if}

<!-- FIXME: Change blending mode of grid? -->
<T.Group renderOrder={-3}>
	<Grid {...gridProps} axes={"xyz"} />
</T.Group>

<!-- Transformed elements -->
<!-- TODO: Overlay another grid in the hero for a cool effect? -->
<T.Group renderOrder={-2} matrix={$matrixTransform} matrixAutoUpdate={false}>
	<!-- Grids -->
	<!-- FIXME: Don't do infinite grid? A bit confusing -->

	<Grid {...transformedGridProps} axes={"xyz"} />
</T.Group>

<T.Group renderOrder={-4} matrix={$matrixTransform} matrixAutoUpdate={false}>
	<!-- 3d grid -->
	<Grid
		axes={"xzy"}
		position.z={gridSectionSize * 0}
		position.y={gridSectionSize}
		{...grid3dProps}
	/>
	<Grid
		axes={"zyx"}
		position.z={gridSectionSize * 0}
		position.x={-gridSectionSize}
		{...grid3dProps}
	/>
</T.Group>

<!-- Maxwell the carryable cat -->
<T.Group renderOrder={-4} matrix={$matrixTransform} matrixAutoUpdate={false}>
	{#await useGltf(`${assets}/maxwell.glb`) then model}
		<T
			is={model.scene}
			position.z={0}
			rotation={[Math.PI / 2, 0, 0]}
			{...modelProps}
		/>
	{/await}

	<T.Mesh {...imageProps}>
		<T.PlaneGeometry args={[6, 6]} />
		<!-- {#await useTexture("/maxwell.jpg") then texture}
			<T.MeshBasicMaterial map={texture}>
				<T.DoubleSide attach="side" />
			</T.MeshBasicMaterial>
		{/await} -->
		{#await map then value}
			<T.MeshBasicMaterial map={value}>
				<T.DoubleSide attach="side" />
			</T.MeshBasicMaterial>
		{/await}
	</T.Mesh>
</T.Group>

<!-- Add a plane -->
<!-- <T.Mesh position.z={-0.02}>
	<T.PlaneGeometry args={[40, 40]} />
	<T.MeshStandardMaterial
		color={new Color("hsl(231, 15%, 18%)")}
		opacity={0.8}
		transparent={true}
	>
		<T.DoubleSide attach="side" />
	</T.MeshStandardMaterial>
</T.Mesh> -->

<!-- TODO: Remove objects that are not visible? -->
<!-- Data -->
<Planes view={transformedView} t={planesProps.t} />
<Points view={transformedView} t={pointsProps.t} />
<Planes view={transformedView} t={planes3dProps.t} dim3 />
<Points view={transformedView} t={points3dProps.t} dim3 />
<!-- <Sphere view={transformedView} /> -->
<!-- <Circle view={transformedView} /> -->

<!-- <Plane
	view={transformedView}
	dim={planeDim}
	position={[-planeDim / 2 - 0.5, -planeDim / 2, -planeDim / 2]}
	rotation={[0, -Math.PI / 2, 0]}
	t={grid3dProps.t}
/>
<Plane
	view={transformedView}
	dim={planeDim}
	position={[-planeDim / 2, planeDim / 2 + 0.5, planeDim / 2]}
	rotation={[-Math.PI / 2, 0, 0]}
	t={grid3dProps.t}
/> -->
<Plane
	view={transformedView}
	dim={planeDim}
	position={[-planeDim / 2, -planeDim / 2, -planeDim / 2]}
	rotation={[0, -Math.PI / 2, 0]}
	t={grid3dProps.t}
/>
<Plane
	view={transformedView}
	dim={planeDim}
	position={[-planeDim / 2, planeDim / 2, planeDim / 2]}
	rotation={[-Math.PI / 2, 0, 0]}
	t={grid3dProps.t}
/>

<Vectors
	view={transformedView}
	enter={vectorsProps.enter}
	exit={vectorsProps.exit}
/>
