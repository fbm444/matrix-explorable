<script>
	import {
		detValue,
		detMatrixEntries,
		detPresetRequest,
		detTryActive,
		highlightedBasis,
		invNarrative,
		invPair,
		det3dActive
	} from "$stores";
	import NumberSpinner from "svelte-number-spinner";
	import { slide } from "svelte/transition";
	import {
		colorArea,
		colorAreaNeg,
		colorAreaZero,
		colorX,
		colorY,
		detPresets
	} from "$data/variables";
	import { iHat, jHat } from "$data/tex";
	import katex from "katex";
	import { Play, RotateCcw } from "lucide-svelte";
	import DetVolumeReadout from "./DetVolumeReadout.svelte";

	function reverseTransformation() {
		const identity = detPresets.find((preset) => preset.key === "identity");
		detPresetRequest.set({
			key: identity.key,
			m: identity.m,
			n: Math.random()
		});
	}

	$: v = $detValue;
	$: [a, b, c, d] = $detMatrixEntries;

	// What the matrix multiplies: î and ĵ, or — while a collapse beat follows
	// its own vectors — the two of them that span the shaded area. The
	// result's columns are where those two land, and the determinant shown
	// is that result's: the signed area actually shaded on the canvas.
	$: pair = $invNarrative ? $invPair : null;
	$: [[x1, y1], [x2, y2]] = pair?.vectors ?? [
		[1, 0],
		[0, 1]
	];
	$: result = [
		a * x1 + b * y1,
		a * x2 + b * y2,
		c * x1 + d * y1,
		c * x2 + d * y2
	];
	$: area = v * (x1 * y2 - x2 * y1);
	$: colors = pair?.colors ?? [colorX, colorY];
	// Columns of the result: red once both have landed on the same vector
	$: resultColors = pair?.resultColors ?? colors;
	// î ĵ above the middle matrix fade as its columns stop being î and ĵ
	$: basisLabels = pair ? pair.labels : 1;

	function signedValue(value) {
		return Math.abs(value) < 0.005
			? "0.00"
			: `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;
	}
	$: display = signedValue(area);
	$: color =
		area > 0.02 ? colorArea : area < -0.02 ? colorAreaNeg : colorAreaZero;
	// The UI disables reversal near zero; only zero itself means no inverse.
	$: noInverse = Math.abs(v) < 0.05;
	$: reverseStatus =
		Math.abs(v) < 1e-9
			? "No inverse"
			: noInverse
			? "Near zero — reverse unavailable"
			: "Reverse transformation";
	// The closing section of the chapter plays on scroll alone
	$: editable = $detTryActive && !$invNarrative && !$det3dActive;

	// Avoid "-0.0" when a spring settles just below zero
	function entry(x) {
		const s = x.toFixed(1);
		return s === "-0.0" ? "0.0" : s;
	}

	// "Try it" (while the article's block is reached): the transforming
	// matrix of the equation becomes editable. An edit is only staged —
	// nothing moves on the canvas until "Apply transformation" — so while
	// `staged` is set, the equation's left side is the reader's pending
	// matrix and its right side is still what the canvas shows.
	let staged = null;
	let hovered = null;

	// Geometric role of each entry and how it moves the area, in display
	// order a, b, c, d
	const entryAnnotations = [
		"Top left: moves î left or right. Its effect on signed area depends on ĵ's vertical component.",
		"Top right: moves ĵ left or right. Signed area stays unchanged only when î is horizontal.",
		"Bottom left: moves î up or down. Signed area stays unchanged only when ĵ is vertical.",
		"Bottom right: moves ĵ up or down. Its effect on signed area depends on î's horizontal component."
	];

	function round(x) {
		return Math.round(x * 10) / 10 + 0;
	}
	$: shown = staged ?? $detMatrixEntries.map(round);

	// Any transformation that plays (a preset, Reverse, Apply) makes the
	// equation live again, as does leaving the "Try it" block
	$: if ($detPresetRequest) staged = null;
	$: if (!editable) staged = null;

	// The spinner also fires `input` when its value is set from outside
	// (it counts along with the canvas); only a real change is an edit
	function onInput(i, value) {
		if (Math.abs(value - shown[i]) < 1e-9) return;

		staged = [...shown];
		staged[i] = value;
	}

	// Play the matrix as a transformation: from the untouched unit square
	// to wherever it sends î and ĵ
	function apply() {
		detPresetRequest.set({
			key: null,
			m: [...shown],
			replay: true,
			n: Math.random()
		});
	}

	function highlight(i) {
		hovered = i;
		$highlightedBasis = i % 2 === 0 ? "x" : "y";
	}
	function clearHighlight() {
		hovered = null;
		$highlightedBasis = null;
	}
</script>

<!-- The full picture, live during every animation frame: the transformation
     matrix multiplying the unit square's basis vectors (î ĵ = identity),
     the resulting matrix (its columns are where î and ĵ land), and the
     determinant of that result. Shown from the determinant chapter onward,
     animated in/out by Arcade via gsap autoAlpha -->
<div
	id="det-readout"
	class="pointer-events-none invisible fixed left-8 top-8 z-40 opacity-0"
>
	{#if $det3dActive}
		<DetVolumeReadout />
	{:else}
		<div
			class="flex flex-col items-center gap-2 bg-base-200 px-6 py-3 font-serif shadow-lg shadow-neutral-content/20"
		>
			<!-- A [î ĵ] = result. The three matrices share one row; the î ĵ
		     column labels hang above the middle one (the top padding makes
		     room for them) so they don't push its rows out of line. -->
			<div class="flex items-center gap-3 pt-6 text-xl tabular-nums">
				<!-- The transforming matrix (editable in "Try it") -->
				{#if editable}
					<div
						class="matrix pointer-events-auto grid grid-cols-2 gap-x-3 px-3 py-1"
					>
						{#each shown as value, i (i)}
							<!-- svelte-ignore a11y-no-static-element-interactions -->
							<div
								class="h-7 w-10"
								on:mouseenter={() => highlight(i)}
								on:mouseleave={clearHighlight}
								on:focusin={() => highlight(i)}
								on:focusout={clearHighlight}
							>
								<NumberSpinner
									{value}
									step={0.1}
									decimals={1}
									speed={0.1}
									class="det-entry"
									on:input={(e) => onInput(i, e.detail)}
								/>
							</div>
						{/each}
					</div>
				{:else}
					<div class="matrix grid grid-cols-2 gap-x-3 px-3 py-1">
						<span class="w-10 text-right">{entry(a)}</span>
						<span class="w-10 text-right">{entry(b)}</span>
						<span class="w-10 text-right">{entry(c)}</span>
						<span class="w-10 text-right">{entry(d)}</span>
					</div>
				{/if}

				<span aria-label="times">×</span>

				<!-- What is being multiplied: the unit square's basis vectors, or
			     the two tracked vectors -->
				<div class="relative">
					<div
						class="absolute bottom-full left-0 right-0 flex gap-x-3 px-3 pb-1 text-base leading-none"
						style:opacity={basisLabels}
					>
						<span class="w-10 text-center" style:color={colorX}>
							{@html katex.renderToString(iHat)}
						</span>
						<span class="w-10 text-center" style:color={colorY}>
							{@html katex.renderToString(jHat)}
						</span>
					</div>
					<div class="matrix grid grid-cols-2 gap-x-3 px-3 py-1">
						{#each [x1, x2, y1, y2] as value, i (i)}
							<span class="w-10 text-right" style:color={colors[i % 2]}>
								{entry(value)}
							</span>
						{/each}
					</div>
				</div>

				<span class="transition-opacity" class:opacity-30={staged}
					>{staged ? "…" : "="}</span
				>

				<!-- The result: columns are where those two vectors land -->
				<div
					class="matrix grid grid-cols-2 gap-x-3 px-3 py-1 transition-opacity"
					class:opacity-30={staged}
				>
					{#each result as value, i (i)}
						<span class="w-10 text-right" style:color={resultColors[i % 2]}>
							{entry(value)}
						</span>
					{/each}
				</div>
			</div>

			<!-- The determinant of that result -->
			<div class="flex items-baseline gap-3">
				<span class="text-xl italic">det(result)</span>
				<span class="text-xl">=</span>
				<span class="text-4xl tabular-nums" style:color>{display}</span>
			</div>
			<p class="font-sans text-xs text-neutral-content">
				Signed area of the {staged ? "last applied" : "shaded"} shape
			</p>

			{#if $invNarrative}
				<p class="font-sans text-sm text-neutral-content">
					Transformation determinant: <span class="tabular-nums"
						>{signedValue(v)}</span
					>
				</p>
				<p class="font-sans text-sm text-neutral-content">
					{noInverse
						? reverseStatus
						: "Invertible — every input can be recovered"}
				</p>
			{:else}
				<div class="flex flex-wrap justify-center gap-2">
					{#if editable}
						<button
							type="button"
							class="btn btn-info btn-sm pointer-events-auto gap-2 font-sans normal-case"
							class:btn-outline={!staged}
							on:mousedown|preventDefault
							on:click={apply}
						>
							<Play size={16} aria-hidden="true" />
							Apply transformation
						</button>
					{/if}
					<button
						type="button"
						class="btn btn-info btn-outline btn-sm pointer-events-auto gap-2 font-sans normal-case"
						disabled={noInverse}
						on:mousedown|preventDefault
						on:click={reverseTransformation}
					>
						<RotateCcw size={16} aria-hidden="true" />
						{reverseStatus}
					</button>
				</div>
			{/if}

			{#if editable}
				<p
					transition:slide={{ duration: 300 }}
					class="min-h-[2rem] w-0 min-w-full text-center font-sans text-xs text-neutral-content"
				>
					{#if hovered !== null}
						{entryAnnotations[hovered]}
					{:else if staged}
						Edits not applied. Press Apply transformation; the result and signed
						area still describe the last applied matrix.
					{:else}
						The first matrix is yours to edit: drag its numbers, or double click
						to type.
					{/if}
				</p>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss">
	/* Square-bracket caps drawn around each live matrix */
	.matrix {
		position: relative;
	}
	.matrix::before,
	.matrix::after {
		content: "";
		position: absolute;
		top: 0;
		bottom: 0;
		width: 6px;
		border: 2px solid white;
	}
	.matrix::before {
		left: 0;
		border-right: none;
	}
	.matrix::after {
		right: 0;
		border-left: none;
	}

	/* Editable entries of the transforming matrix: same size as the static
	   ones, so the equation doesn't shift when "Try it" switches them in */
	:global(.det-entry) {
		@apply block h-7 w-10 rounded-sm bg-base-100 p-0 text-right text-xl leading-7 transition-all selection:text-inherit;

		&:hover,
		&:focus {
			@apply outline-none ring-1 ring-info;
		}
	}
</style>
