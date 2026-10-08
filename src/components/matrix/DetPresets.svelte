<script>
	import { detPresetRequest } from "$stores";
	import { detPresets } from "$data/variables";
	import { formatCoord } from "$utils";
	import Tex from "./Tex.svelte";

	// Track whichever preset was last played, from here or from the
	// PlayPreset buttons in the walk-through beats
	let active = null;
	$: if ($detPresetRequest) active = $detPresetRequest.key;

	function select(preset) {
		detPresetRequest.set({ key: preset.key, m: preset.m, n: Math.random() });
	}

	function matrixTex([a, b, c, d]) {
		return String.raw`\begin{bmatrix} ${formatCoord(a)} & ${formatCoord(
			b
		)} \\ ${formatCoord(c)} & ${formatCoord(d)} \end{bmatrix}`;
	}

	function formatDet(det) {
		if (det === 0) return "0";
		return det > 0 ? `+${formatCoord(det)}` : `−${formatCoord(Math.abs(det))}`;
	}
</script>

<div class="not-prose my-6 flex flex-col gap-2">
	{#each detPresets as preset}
		<!-- mousedown|preventDefault: focusing a button inside the pinned
		     article makes the browser scroll its layout position into view,
		     yanking the reader thousands of pixels away -->
		<button
			class="btn h-auto min-h-0 justify-between gap-4 py-2 normal-case {active ===
			preset.key
				? 'btn-info'
				: 'btn-outline border-neutral'}"
			on:mousedown|preventDefault
			on:click={() => select(preset)}
		>
			<span class="w-24 text-left font-bold">{preset.label}</span>
			<span class="font-serif font-normal"
				><Tex expr={matrixTex(preset.m)} /></span
			>
			<span class="w-24 text-right font-serif font-normal">
				det = {formatDet(preset.det)}
			</span>
		</button>
	{/each}
</div>
