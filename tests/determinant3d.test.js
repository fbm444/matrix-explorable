import test from "node:test";
import assert from "node:assert/strict";
import { Matrix4, Vector3 } from "three";
import { det3dPresets } from "../src/data/determinant3d.js";
import {
	determinant3d,
	interpolateDet3d,
	matrix3dTo4
} from "../src/utils/determinant3d.js";

const preset = (key) => det3dPresets.find((item) => item.key === key);
const close = (actual, expected) =>
	assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("all examples start at identity and reach their stated determinant", () => {
	for (const example of det3dPresets) {
		interpolateDet3d(example, 0).forEach((entry, i) =>
			close(entry, preset("identity").matrix[i])
		);
		const end = interpolateDet3d(example, 1);
		end.forEach((entry, i) => close(entry, example.matrix[i]));
		close(determinant3d(end), example.det);
	}
});

test("rotation preserves volume and edge lengths at intermediate frames", () => {
	for (let frame = 0; frame <= 100; frame++) {
		const m = interpolateDet3d(preset("rotate"), frame / 100);
		close(determinant3d(m), 1);
		for (let col = 0; col < 3; col++) {
			close(Math.hypot(m[col], m[col + 3], m[col + 6]), 1);
		}
	}
});

test("reflection passes through zero volume before its sign changes", () => {
	for (const [progress, expected] of [
		[0, 1],
		[0.25, 0.5],
		[0.5, 0],
		[0.75, -0.5],
		[1, -1]
	]) {
		close(
			determinant3d(interpolateDet3d(preset("reflect"), progress)),
			expected
		);
	}
});

test("shear preserves volume throughout", () => {
	for (let frame = 0; frame <= 20; frame++) {
		close(determinant3d(interpolateDet3d(preset("shear"), frame / 20)), 1);
	}
});

test("cube geometry and colored column vectors use the same row-major matrix", () => {
	// Nonsymmetric examples catch transposition errors in the Threlte matrix prop.
	for (const example of [preset("shear"), preset("rotate")]) {
		const m = interpolateDet3d(example, 0.6);
		const transform = new Matrix4().set(...matrix3dTo4(m));
		const columns = [
			new Vector3(1, 0, 0),
			new Vector3(0, 1, 0),
			new Vector3(0, 0, 1)
		].map((v) => v.applyMatrix4(transform));
		columns.forEach((column, i) => {
			column.toArray().forEach((entry, row) => close(entry, m[row * 3 + i]));
		});
		close(
			columns[0].dot(columns[1].clone().cross(columns[2])),
			determinant3d(m)
		);
	}
});

test("collapse preserves the square base but maps different heights to one point", () => {
	const transform = new Matrix4().set(
		...matrix3dTo4(preset("collapse").matrix)
	);
	assert.deepEqual(
		new Vector3(1, 1, 0).applyMatrix4(transform).toArray(),
		[1, 1, 0]
	);
	assert.deepEqual(
		new Vector3(1, 1, 3).applyMatrix4(transform).toArray(),
		[1, 1, 0]
	);
	close(determinant3d(preset("collapse").matrix), 0);
});
