<script>
	import { detPresetRequest } from "$stores";
	import { detPresets } from "$data/variables";
	import { RotateCcw } from "lucide-svelte";

	// The identity preset is the untransformed unit square: det = 1
	const identity = detPresets.find((x) => x.key === "identity");

	function reset() {
		detPresetRequest.set({ key: identity.key, m: identity.m, n: Math.random() });
	}
</script>

<!-- mousedown|preventDefault: see DetPresets.svelte — avoids the browser
     focus-scrolling the pinned article -->
<button
	class="btn btn-sm btn-outline gap-2 font-sans normal-case"
	on:mousedown|preventDefault
	on:click={reset}
>
	<RotateCcw size={16} />
	Reset
</button>
