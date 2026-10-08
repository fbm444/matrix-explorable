<script>
	import { T } from "@threlte/core";
	import { HTML } from "@threlte/extras";
	import { BoxGeometry, EdgesGeometry } from "three";
	import { onDestroy } from "svelte";
	import Vector from "./Vector.svelte";
	import {
		colorX,
		colorY,
		colorZ,
		colorArea,
		colorAreaNeg,
		colorAreaZero
	} from "$data/variables";
	import { determinant3d, matrix3dTo4 } from "$utils/determinant3d.js";

	export let view;
	export let matrix;
	export let opacity = 0;

	const box = new BoxGeometry(1, 1, 1);
	box.translate(0.5, 0.5, 0.5);
	const edges = new EdgesGeometry(box);
	const colors = [colorX, colorY, colorZ];
	const labels = ["î", "ĵ", "k̂"];
	$: transform = matrix3dTo4(matrix);
	$: det = determinant3d(matrix);
	$: color =
		det > 0.005 ? colorArea : det < -0.005 ? colorAreaNeg : colorAreaZero;
	$: tips = [0, 1, 2].map((column) => [
		matrix[column],
		matrix[column + 3],
		matrix[column + 6]
	]);

	function noPointer(node) {
		if (node.parentElement) node.parentElement.style.pointerEvents = "none";
	}
	onDestroy(() => {
		box.dispose();
		edges.dispose();
	});
</script>

<!-- A faint outline keeps the original unit cube visible for comparison. -->
<T.LineSegments geometry={edges} visible={opacity > 0.001}>
	<T.LineBasicMaterial
		color={colorAreaZero}
		transparent
		opacity={0.2 * opacity}
	/>
</T.LineSegments>
<T.Group matrix={transform} matrixAutoUpdate={false} visible={opacity > 0.001}>
	<T.Mesh geometry={box} renderOrder={1}>
		<T.MeshBasicMaterial
			{color}
			transparent
			opacity={0.25 * opacity}
			depthWrite={false}
		>
			<T.DoubleSide attach="side" />
		</T.MeshBasicMaterial>
	</T.Mesh>
	<T.LineSegments geometry={edges} renderOrder={2}>
		<T.LineBasicMaterial {color} transparent {opacity} depthTest={false} />
	</T.LineSegments>
</T.Group>

{#each tips as tip, column}
	<Vector
		{view}
		coords={[0, 0, 0, ...tip]}
		color={colors[column]}
		tex={false}
		visible={opacity > 0.001}
		{opacity}
		width={2}
	/>
	{#if opacity > 0.01}
		<HTML
			position={tip.map((v, axis) => v * 1.2 + (axis === column ? 0.15 : 0))}
			center
		>
			<span
				use:noPointer
				class="text-xl"
				style:color={colors[column]}
				style:opacity>{labels[column]}</span
			>
		</HTML>
	{/if}
{/each}
