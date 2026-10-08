<script>
	import { detPresetRequest } from "$stores";
	import { detPresets } from "$data/variables";
	import { Play } from "lucide-svelte";

	// Key into detPresets ("identity", "stretch", ...)
	export let preset;

	const p = detPresets.find((x) => x.key === preset);

	function play() {
		detPresetRequest.set({ key: p.key, m: p.m, n: Math.random() });
	}
</script>

<!-- mousedown|preventDefault: focusing a button inside the pinned article
     makes the browser scroll its layout position into view (see DetPresets) -->
<button
	class="btn btn-sm btn-outline btn-info gap-2 font-sans normal-case"
	on:mousedown|preventDefault
	on:click={play}
>
	<Play size={16} />
	{p.label}
</button>
