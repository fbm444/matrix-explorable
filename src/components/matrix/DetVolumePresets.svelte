<script>
	import { det3dPresets } from "$data/determinant3d.js";
	import { det3dPresetRequest } from "$stores";
	import { Play } from "lucide-svelte";

	const effects = {
		identity: "Return to the unit cube",
		stretch: "Double the width and volume",
		compress: "Halve the height and volume",
		shear: "Lean sideways; keep the volume",
		rotate: "Quarter turn; keep the volume",
		reflect: "Flip through the xy-plane",
		collapse: "Flatten to a plane; zero volume"
	};
	$: selected = $det3dPresetRequest?.key ?? "identity";
	const signed = (value) =>
		value === 0 ? "0" : `${value > 0 ? "+" : "−"}${Math.abs(value)}`;
	function select(key) {
		det3dPresetRequest.set({ key });
	}
</script>

<div id="det3d-table" class="not-prose my-6">
	<table class="w-full border-collapse text-left text-base">
		<caption class="pb-3 text-left font-sans font-bold"
			>Select a transformation</caption
		>
		<thead class="font-sans text-sm text-neutral-content">
			<tr class="border-b border-neutral">
				<th scope="col" class="py-2 pr-3">Transformation</th>
				<th scope="col" class="py-2 pr-3">What changes</th>
				<th scope="col" class="py-2 text-right">Final det</th>
			</tr>
		</thead>
		<tbody>
			{#each det3dPresets as preset}
				<tr
					class="border-b border-neutral/40"
					class:bg-base-200={selected === preset.key}
				>
					<th scope="row" class="py-2 pr-3">
						<!-- Keep focus from scrolling the pinned article. -->
						<button
							type="button"
							class="btn btn-sm btn-info w-full justify-start gap-2 font-sans normal-case"
							class:btn-outline={selected !== preset.key}
							aria-pressed={selected === preset.key}
							on:mousedown|preventDefault
							on:click={() => select(preset.key)}
						>
							<Play size={14} aria-hidden="true" />{preset.label}
						</button>
					</th>
					<td class="py-2 pr-3 leading-snug">{effects[preset.key]}</td>
					<td class="py-2 text-right tabular-nums">{signed(preset.det)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
