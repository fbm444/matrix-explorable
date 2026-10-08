<script>
	import { det3dMatrix } from "$stores";
	import {
		colorX,
		colorY,
		colorZ,
		colorArea,
		colorAreaNeg,
		colorAreaZero
	} from "$data/variables";
	import { determinant3d } from "$utils/determinant3d.js";
	const colors = [colorX, colorY, colorZ];
	$: det = determinant3d($det3dMatrix);
	$: color =
		det > 0.005 ? colorArea : det < -0.005 ? colorAreaNeg : colorAreaZero;
	$: display =
		Math.abs(det) < 0.005
			? "0.00"
			: `${det > 0 ? "+" : "−"}${Math.abs(det).toFixed(2)}`;
	const entry = (value) => (Math.abs(value) < 0.05 ? "0.0" : value.toFixed(1));
</script>

<div
	class="flex flex-col items-center gap-3 bg-base-200 px-6 py-3 font-serif shadow-lg shadow-neutral-content/20"
>
	<p class="font-sans text-sm text-neutral-content">3D determinant · volume</p>
	<div class="flex items-center gap-4 text-xl tabular-nums">
		<span class="italic">det</span>
		<div
			class="matrix grid grid-cols-3 gap-x-3 px-3 py-1"
			aria-label="3 by 3 transformation matrix"
		>
			{#each $det3dMatrix as value, i}
				<span class="w-10 text-right" style:color={colors[i % 3]}
					>{entry(value)}</span
				>
			{/each}
		</div>
		<span>=</span>
		<span class="text-4xl" style:color>{display}</span>
	</div>
	<p class="font-sans text-sm text-neutral-content">
		Signed volume of the transformed unit cube
	</p>
	<p class="font-sans text-xs text-neutral-content">
		Pink î · purple ĵ · orange k̂
	</p>
</div>

<style>
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
		border: 2px solid currentColor;
	}
	.matrix::before {
		left: 0;
		border-right: none;
	}
	.matrix::after {
		right: 0;
		border-left: none;
	}
</style>
