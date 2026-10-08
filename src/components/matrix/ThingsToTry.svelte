<script>
	import { endMatrix } from "$stores";
	import { gsap } from "$utils/gsap.js";
	import { Play } from "lucide-svelte";

	// One-click guided experiments for the 2D playground.
	// Relative targets are computed from the current matrix at click time.
	const experiments = [
		{
			label: "Double a",
			watch: "î gets twice as long; the whole grid stretches horizontally.",
			target: (m) => {
				m[0] *= 2;
				return m;
			}
		},
		{
			label: "Set d to 0",
			watch: "ĵ collapses onto the origin; every point lands on the x-axis.",
			target: (m) => {
				m[5] = 0;
				return m;
			}
		},
		{
			label: "Negate a",
			watch: "î flips; the grid is mirrored across the y-axis.",
			target: (m) => {
				m[0] *= -1;
				return m;
			}
		},
		{
			label: "Shear: b = 1",
			watch: "ĵ leans right; squares become parallelograms. This is a shear.",
			target: () => to16(1, 1, 0, 1)
		},
		{
			label: "Quarter turn",
			watch:
				"Both basis vectors turn 90° counterclockwise. This is a rotation.",
			target: () => to16(0, -1, 1, 0)
		}
	];

	function to16(a, b, c, d) {
		return [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	}

	function run(experiment) {
		const target = experiment.target([...$endMatrix]);

		gsap.to($endMatrix, {
			endArray: target,
			duration: 1.5,
			ease: "power2.inOut",
			onUpdate: () => {
				$endMatrix = $endMatrix;
			}
		});
	}
</script>

<table class="not-prose my-6 w-full border-collapse text-left">
	<thead>
		<tr class="border-b border-neutral font-sans text-sm text-neutral">
			<th class="py-2 pr-4 font-bold">Experiment</th>
			<th class="py-2 font-bold">What to watch for</th>
		</tr>
	</thead>
	<tbody>
		{#each experiments as experiment}
			<tr class="border-b border-neutral/40 last:border-b-0">
				<td class="whitespace-nowrap py-3 pr-4 align-middle">
					<!-- mousedown|preventDefault: see DetPresets.svelte — avoids the
					     browser focus-scrolling the pinned article -->
					<button
						class="btn btn-sm btn-outline btn-info w-full justify-start gap-2 font-sans normal-case"
						on:mousedown|preventDefault
						on:click={() => run(experiment)}
					>
						<Play size={16} />
						{experiment.label}
					</button>
				</td>
				<td
					class="py-3 align-middle text-base leading-snug text-base-content/80"
				>
					{experiment.watch}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
