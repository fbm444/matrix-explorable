export function determinant3d([a, b, c, d, e, f, g, h, i]) {
	return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

export function matrix3dTo4(m) {
	return [
		m[0],
		m[1],
		m[2],
		0,
		m[3],
		m[4],
		m[5],
		0,
		m[6],
		m[7],
		m[8],
		0,
		0,
		0,
		0,
		1
	];
}

// Interpolate a transformation from identity. A rotation follows an angle,
// not an entrywise blend, so intermediate frames retain unit volume.
export function interpolateDet3d(preset, progress) {
	const t = Math.max(0, Math.min(1, progress));
	if (preset.key === "rotate") {
		const angle = (t * Math.PI) / 2;
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		return [c, 0, s, 0, 1, 0, -s, 0, c];
	}
	return preset.matrix.map((value, index) => {
		const initial = index % 4 === 0 ? 1 : 0;
		return initial + (value - initial) * t;
	});
}
