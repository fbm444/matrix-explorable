<script>
	import Tex from "./Tex.svelte";
	import {
		matrixVectorFormulaColored,
		vectorAsLinearComb,
		matrixVectorFormulaEg,
		matrixVectorFormula3dEg,
		detFormula,
		iHat,
		jHat,
		entryTex,
		tryBeatTex,
		invVectorTex,
		invResultTex
	} from "$data/tex";
	import DetPresets from "./DetPresets.svelte";
	import DetVolumePresets from "./DetVolumePresets.svelte";
	import Term from "./Term.svelte";
	import ColorText from "./ColorText.svelte";
	import Insight from "./Insight.svelte";
	import Intro from "./Intro.svelte";
	import P from "./P.svelte";
	import Spacer from "./Spacer.svelte";
	import Action from "./Action.svelte";
	import Section from "./Section.svelte";
	import B from "./B.svelte";
	import {
		Grab,
		MoveHorizontal,
		MousePointerClick,
		Play,
		Pointer
	} from "lucide-svelte";
	import ActionIcon from "./ActionIcon.svelte";
	import InteractionsList from "./InteractionsList.svelte";
	import { gsap, ScrollTrigger } from "$utils/gsap.js";
	import { onMount } from "svelte";
	import { arcadeMounted, detTryActive } from "$stores";

	// The reader's editable matrix lives in the readout on the graph; show
	// it once the "Try it" block has scrolled into view, and hide it again
	// when the reader scrolls back above the block
	function trackDetTry(node) {
		const observer = new IntersectionObserver(([entry]) => {
			$detTryActive =
				entry.isIntersecting || entry.boundingClientRect.top < 0;
		});
		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
				$detTryActive = false;
			}
		};
	}

	// let mounted;

	// $: if (mounted && $arcadeMounted) animate();

	// onMount(() => {
	// 	mounted = true;
	// });

	// function animate() {
	// 	gsap.utils.toArray("#article section.animate > *").forEach((el) => {
	// 		let animation;

	// 		if (el.className === "exclude") {
  //       animation = gsap.timeline({ paused: true })
  //         .from(el, {
  //           opacity: 0,
  //           y: 100,
  //           duration: 0.6
  //         })
  //         .from(el.querySelectorAll('li'), {
  //           x: -40,
  //           opacity: 0,
  //           stagger: {
  //             amount: 0.3
  //           }
  //         })
	// 		} else {
	// 			animation = gsap.from(el, {
	// 				opacity: 0,
	// 				y: 20,
	// 				paused: true
	// 			});
	// 		}

	// 		ScrollTrigger.create({
	// 			trigger: el,
	// 			start: "top center",
	// 			animation,
	// 			pinnedContainer: "#article"
	// 		});
	// 	});
	// }
</script>

<div
	id="article"
	class="relative max-w-prose bg-gradient-to-l from-base-100 via-base-300 via-90% py-12"
>
	<div id="title-spacer" class="h-[2500px]" />

	<Intro />

	<div class="h-[500px]" />

	<!-- <section id="section-1" class="prose prose-xl [&>*]:px-10 [&>*]:rounded-xl"> -->
	<Section id="section-1" classNames="animate">
		<!-- <section class="prose prose-xl max-w-[50ch]"> -->
		<!-- <h2>Matrix as Linear Transformations</h2> -->

		<p>
			A vector multiplied by a matrix returns yet another vector — it <B
				>transforms</B
			> a vector into a new vector. Let's visualize this transformation with an example.
		</p>

		<!-- <h3>Vectors as a Linear Combination of Basis Vectors</h3> -->

		<Spacer />

		<P id="st-1">
			Let's first think about what the coordinates of a <ColorText color="in"
				>vector</ColorText
			> represent.
		</P>

		<!-- TODO: Animate the text decoration, syncing it with the rest of the animations -->
		<!-- TODO: On hover, highlights all the matching elements -->
		<P id="st-2">
			In the <Tex expr={"xy"} />-coordinate plane, any vector can be thought of
			as the sum of two scaled vectors: the unit vector in the
			<nobr><ColorText color="p"><Tex expr="x" />-direction</ColorText></nobr>,
			and the unit vector in the <ColorText color="s"
				><Tex expr="y" />-direction</ColorText
			>.
		</P>

		<!-- <P id="st-3">
			<Tex expr={vectorAsLinearComb} display color />
      The unit-vector in the x-direction is scaled by the x-coordinate of the vector, and the unit-vector in the y-direction is scaled by the y-coordinate of the vector.
    </P> -->

		<!-- <Tex
      expr={vectorAsLinearCombAlt}
      display
    /> -->

		<!-- TODO: Do text highlighting that syncs with the corresponding animation -->
		<P id="st-3">
			<Tex expr={vectorAsLinearComb} display color />
			These are also known as our <Term>standard basis vectors</Term>. The
			vector's coordinates encode the amount to scale each individual basis
			vector, before adding them up.
		</P>

		<p>
			This scaling and addition of vectors is called a <Term
				>linear combination</Term
			>, and every vector can be expressed as a linear combination of basis
			vectors.
		</p>

		<Spacer />

		<Tex expr={matrixVectorFormulaColored} display />

		<p>
			Did you notice anything similar with the expression for matrix-vector
			multiplication? A vector multiplied with a matrix can also be expressed as
			a linear combination; only this time the standard basis vectors are
			replaced by the columns of the matrix.
		</p>

		<Tex expr={matrixVectorFormulaEg} display color />

		<P id="st-4">
			In other words, a matrix can be viewed as a way of packaging information
			about the new basis vectors that we want. This is the core insight: a
			matrix transforms a vector by <B
				>transforming the original basis vectors</B
			>; creating an entirely new coordinate system.
		</P>

		<P id="st-5">
			Again, the transformed vector is a linear combination of the new basis
			vectors, which are scaled by the coordinates of the original vector.
		</P>

		<Spacer />

		<p>
			In that vein, a matrix transformation appears to warp and transform space.
			To get a visceral feel of this, let's visualize what happens to not just a
			single vector, but <B>a sample of vectors in space</B>, each multiplied by
			the same matrix.
		</p>

		<P id="st-6">
			In order to make the space less visually cluttered, we can represent each
			vector with just its tip as a point in space. We'll transform the grid
			lines along too, overlaying on top a copy of the original.
		</P>

		<P id="st-7">
			The transformation appears to rotate and stretch the space, accordingly
			with where the new basis vectors land.
		</P>

		<P>
			As we'll see when you have a chance to tinker around with different basis
			vectors, a matrix performs a particular kind of transformation, called a <Term
				>linear transformation</Term
			>. Visually, you'll notice that:
		</P>

		<ul class="ml-4 marker:text-info marker:text-2xl">
			<li>
				All lines in the original space remain as lines, without getting curved,
				and
			</li>
			<li>Origin remains fixed in place.</li>
		</ul>

		<p>
			As an example, all grid lines stay parallel and evenly spaced after the
			transformation.
		</p>

		<Spacer />

		<!-- TODO: Have a kind of recap at the end -->
		<div class="exclude">
			<Tex expr={matrixVectorFormulaColored} display />
			<Insight>
				<ul>
					<li>
						Any vector can be expressed as the addition of scaled basis vectors,
						i.e.
						<B>a linear combination of basis vectors</B>.
					</li>
					<li>
						A matrix can be viewed as a way to <B
							>package information about a linear transformation</B
						>. The columns of a matrix represent where the new basis vectors
						land after the transformation.
					</li>
					<li>
						Matrix-vector multiplication is a way to compute where a given
						vector lands after the transformation defined by a matrix.
					</li>
				</ul>
			</Insight>
		</div>

		<Spacer />

		<div class="exclude">
			<P id="st-8">
				With our understanding so far, try to tinker about and figure out what
				kinds of transformations are possible with matrices!
			</P>
			<p>
				What basis vectors should you choose in order to scale space uniformly
				in all directions? How about a reflection, rotation or a shear?
			</p>
			<Action>
				<!-- TODO: Allow users to grab the basis vectors too? -->
				<ul class="list-none">
					<InteractionsList />
				</ul>
			</Action>

			<p>
				Not sure where to start? Hover over any entry of the matrix to see its
				geometric role — or keep scrolling, and we'll play through each kind of
				transformation in turn. Each one starts over from the untouched grid, so
				you can see exactly what a single change to the matrix does.
			</p>
		</div>

		<Spacer />

		<P id="st-try-1">
			<B>Stretch</B>: <Tex expr={entryTex.a} /> doubles, from <Tex expr="1" /> to
			<Tex expr="2" />. <ColorText color="p"><Tex expr={iHat} /></ColorText> gets
			twice as long, and the whole grid stretches horizontally.
			<Tex expr={tryBeatTex.stretch} display />
		</P>

		<Spacer />

		<P id="st-try-2">
			<B>Reflect</B>: <Tex expr={entryTex.a} /> is negated, from <Tex expr="1" />
			to <Tex expr="-1" />. <ColorText color="p"><Tex expr={iHat} /></ColorText>
			flips to point the other way, and the grid is mirrored across the
			<Tex expr="y" />-axis.
			<Tex expr={tryBeatTex.reflect} display />
		</P>

		<Spacer />

		<P id="st-try-3">
			<B>Shear</B>: <Tex expr={entryTex.b} /> goes from <Tex expr="0" /> to
			<Tex expr="1" />. <ColorText color="s"><Tex expr={jHat} /></ColorText> leans
			to the right while <ColorText color="p"><Tex expr={iHat} /></ColorText> stays
			put, and every square becomes a parallelogram.
			<Tex expr={tryBeatTex.shear} display />
		</P>

		<Spacer />

		<P id="st-try-4">
			<B>Rotate</B>: all four entries change together. Both basis vectors turn
			<Tex expr="90^\circ" /> counterclockwise and the grid turns with them — nothing
			stretches, nothing leans.
			<Tex expr={tryBeatTex.rotate} display />
		</P>

		<Spacer />

		<P id="st-try-5">
			<B>Flatten</B>: <Tex expr={entryTex.d} /> drops from <Tex expr="1" /> to
			<Tex expr="0" />. <ColorText color="s"><Tex expr={jHat} /></ColorText>
			collapses onto the origin, and every point lands on the
			<Tex expr="x" />-axis.
			<Tex expr={tryBeatTex.flatten} display />
		</P>

		<Spacer />

		<p>
			The matrix is still yours to drag — pick up from any of these and keep
			experimenting. Not all linear transformations look alike — some rotate,
			some stretch, some flatten space outright. Next, let's find a
			<B>single number</B> that measures the difference.
		</p>
	</Section>

	<Section id="section-det" classNames="animate">
		<!-- Chapter break: what the determinant is, before any of the geometry -->
		<div>
			<hr class="mb-10 mt-0 border-neutral" />
			<div class="font-sansAlt text-xl text-neutral">New chapter</div>
			<h2 class="mt-2 text-neutral">The Determinant</h2>

			<p>
				A matrix tells us where <ColorText color="p"
					><Tex expr={iHat} /></ColorText
				> and <ColorText color="s"><Tex expr={jHat} /></ColorText> land. The grid
				shows how those two moves stretch, tilt, or flip the rest of the plane.
			</p>
			<p>
				For a <Tex expr="2 \times 2" /> matrix, the <Term>determinant</Term> is a
				number whose size, ignoring its sign, tells us how much the transformation
				scales area and whose sign tells us whether it flips the plane over. Every
				square matrix — one with as many rows as columns — has a determinant, in
				any number of dimensions. We'll start in two dimensions, where we can see
				its meaning as area.
			</p>
			<p>
				A determinant of <Tex expr="2" /> doubles every area, while
				<Tex expr="0.5" /> halves it. Let's see where that number comes from by following
				a square of area <Tex expr="1" />.
			</p>
		</div>

		<Spacer />

		<h2 class="text-neutral">What the Determinant Measures</h2>

		<P id="st-det-0">
			Start with the unchanged grid, with <ColorText color="p"
				><Tex expr={iHat} /></ColorText
			> and <ColorText color="s"><Tex expr={jHat} /></ColorText> at their original
			positions. They form two sides of the unit square: one unit wide and one unit
			tall.
		</P>

		<Spacer />

		<P id="st-det-1">
			The identity matrix leaves this square unchanged, so its determinant is
			<Tex expr="+1" />. After a transformation, the square's area gives the
			size of the determinant; we attach a minus sign if the square has flipped
			over, which is what we mean by <B>signed area</B>. Scroll through the
			examples: each starts from the unit square, and the top-left readout shows
			its signed area as it changes.
		</P>

		<Spacer />

		<P id="st-det-2">
			<B>Stretch</B>: <ColorText color="p"><Tex expr={iHat} /></ColorText> lands
			twice as far from the origin, while <ColorText color="s"
				><Tex expr={jHat} /></ColorText
			>
			stays in place. The square becomes a <Tex expr="2 \times 1" /> rectangle: twice
			the area, with no flip, so the determinant is <Tex expr="+2" />.
		</P>

		<Spacer />

		<P id="st-det-3">
			<B>Compress</B>: <ColorText color="s"><Tex expr={jHat} /></ColorText> becomes
			half as long, while the square's width stays <Tex expr="1" />. The area is
			now <Tex expr="0.5" />, with no flip, so the determinant is
			<Tex expr="+0.5" />.
		</P>

		<Spacer />

		<P id="st-det-4">
			<B>Shear</B>: <ColorText color="s"><Tex expr={jHat} /></ColorText> leans to
			the right, turning the square into a parallelogram. Its base and perpendicular
			height are still <Tex expr="1" />, so its area and determinant both stay <Tex
				expr="1"
			/> even though its shape changes.
		</P>

		<Spacer />

		<P id="st-det-5">
			<B>Rotate</B>: both basis vectors turn <Tex expr="90^\circ" />
			counterclockwise around the origin, carrying the square with them. The square
			keeps its area and does not flip over, so the determinant stays <Tex
				expr="+1"
			/>.
		</P>

		<Spacer />

		<P id="st-det-6">
			<B>Reflect</B>: <ColorText color="s"><Tex expr={jHat} /></ColorText> moves
			below the <Tex expr="x" />-axis, flipping the square over.
			<Term>Orientation</Term> describes whether the turn from the first basis vector
			to the second, through the smaller angle, is counterclockwise or clockwise;
			this reflection reverses it. The final area is still
			<Tex expr="1" />, but the determinant is <Tex expr="-1" />: the minus sign
			records the flip, not a negative amount of area.
		</P>
		<p>
			During the flip, the square flattens to a line before opening below the
			axis. At that instant its area and determinant are both <Tex expr="0" />.
			A continuous change from a positive determinant to a negative one must
			pass through zero.
		</p>

		<Spacer />

		<div class="exclude">
			<Tex expr={detFormula} display />

			<P id="st-det-8">
				Here <Tex expr="a, b, c, d" /> are the four entries of the matrix, and <Tex
					expr="\det"
				/> means determinant. This formula computes the same signed area we've been
				watching. Choose a transformation below to compare its matrix, its final
				determinant, and the shape it produces.
			</P>

			<DetPresets />
		</div>

		<Spacer />

		<div id="det-try" class="exclude" use:trackDetTry>
			<p>
				Now it's your turn: edit the leftmost matrix in the top-left readout.
				Your edits are held until you press <B>Apply transformation</B>; the
				shape and determinant continue to show the last applied matrix. Applying
				your matrix first returns to the unit square, then animates where its
				two sides land.
			</p>
			<Action>
				<ul class="list-none">
					<li>
						<ActionIcon icon={MoveHorizontal} /><B>Drag the numbers</B> of the first
						matrix in the equation to increase or decrease them
					</li>
					<li>
						<ActionIcon icon={MousePointerClick} /><B
							>Double click the numbers</B
						> to input your own values
					</li>
					<li>
						<ActionIcon icon={Pointer} /><B>Hover over an entry</B> to see which
						basis vector it moves and how it can affect area
					</li>
					<li>
						<ActionIcon icon={Play} /><B>Apply the transformation</B> when your matrix
						is ready, to watch it act on the untouched square
					</li>
				</ul>
			</Action>

			<p>
				Can you make the determinant <Tex expr="+2" />, doubling the area
				without a flip? Can you make it <Tex expr="-1" />, keeping the area but
				flipping the square? Then try <Tex expr="0" />: squash the square flat,
				leaving no area.
			</p>
		</div>
	</Section>

	<!-- Still the determinant chapter: what a determinant of 0 costs -->
	<Section id="section-inv" classNames="animate">
		<h2 class="text-neutral">The Determinant and Invertibility</h2>

		<P id="st-inv-0">
			A transformation is <Term>invertible</Term> if it can be undone so that every
			output returns to exactly one original input. A determinant of
			<Tex expr="0" /> tells us this is impossible: the plane has collapsed onto
			a line or a point. Let's follow a few vectors to see what gets lost.
		</P>
		<p>
			The shaded shape now follows two chosen vectors, so its starting area may
			differ from <Tex expr="1" />. The readout labels its signed area
			separately from the transformation's determinant: the determinant tells us
			how that starting area is scaled.
		</p>

		<Spacer />

		<P id="st-inv-1">
			Here are two different vectors, <Tex expr={invVectorTex(0, "(1, 1)")} />
			and <Tex expr={invVectorTex(1, "(1, 3)")} />, which span a parallelogram
			of area <Tex expr="2" />. As you scroll, a <B>collapse</B> sends the whole
			plane onto the <Tex expr="x" />-axis, and both vectors land at the same
			point,
			<span class="whitespace-nowrap"
				><Tex expr={invResultTex("(1, 0)")} />.</span
			>
			The shaded area shrinks to <Tex expr="0" />, the transformation's
			determinant is <Tex expr="0" />, and the faded arrows show the two
			different starting vectors.
		</P>

		<Spacer />

		<P id="st-inv-2">
			The same happens to these three vectors: their tips all have
			<Tex expr="x = -2" />, but different heights. They all land at
			<Tex expr={invResultTex("(-2, 0)")} /> because this collapse preserves each
			vector's x-coordinate and discards its y-coordinate.
		</P>

		<Spacer />

		<P id="st-inv-3">
			Now collapse onto the <Tex expr="y" />-axis. These three vectors all have <Tex
				expr="y = 2"
			/>, so they land together at <Tex expr="(0, 2)" />: this time their
			x-coordinates are lost. The shaded area and determinant both fall to <Tex
				expr="0"
			/> again.
		</P>

		<Spacer />

		<P id="st-inv-4">
			The line doesn't have to be an axis: here
			<Tex expr={invVectorTex(0, "(2, 0)")} /> and
			<Tex expr={invVectorTex(1, "(0, 2)")} /> both land at
			<Tex expr={invResultTex("(1, 1)")} /> on the diagonal line. A line has no two-dimensional
			area, so the square they span is flattened from area <Tex expr="4" /> to <Tex
				expr="0"
			/>. The factor that scales a nonzero area to zero is <Tex expr="0" /> — that
			is why this transformation's determinant is zero.
		</P>

		<Spacer />

		<P id="st-inv-5">
			Now try to <B>reverse</B> the first collapse, using only its output
			<Tex expr={invResultTex("(1, 0)")} />. Did it come from
			<Tex expr={invVectorTex(0, "(1, 1)")} /> or from
			<Tex expr={invVectorTex(1, "(1, 3)")} />? Both inputs gave the same
			output, so the output alone cannot tell us which one to recover.
		</P>

		<Spacer />

		<P id="st-inv-6">
			In fact, <B>every</B> vector whose tip lies on this dashed line lands at
			<Tex expr={invResultTex("(1, 0)")} />. No single reverse rule can recover
			all their original heights from that one output. Scrolling backward can
			replay the starting points we saved for the animation, but the collapsed
			output itself does not contain that information.
		</P>

		<Spacer />

		<P id="st-inv-7">
			The horizontal stretch doubles each x-coordinate and keeps each
			y-coordinate. Its determinant of <Tex expr="+2" /> scales the shaded area from
			<Tex expr="2" /> to <Tex expr="4" />. To undo it, halve each output's <B
				>x-coordinate</B
			> and keep its y-coordinate — every vector returns to its own starting point,
			so the transformation is invertible.
		</P>

		<Spacer />

		<P id="st-inv-8">
			The reflection across the <Tex expr="x" />-axis has determinant
			<Tex expr="-1" />: it flips orientation and preserves area. Reflect again
			across the same axis, and every vector returns to where it started. A
			negative determinant still allows an inverse; a zero determinant does not.
		</P>

		<Spacer />

		<p>
			The determinant's size, ignoring its sign, tells us how much area is
			scaled, and its sign tells us whether orientation is preserved or
			reversed. A determinant of
			<Tex expr="0" /> means the plane collapses onto a line or a point, losing the
			information needed to recover every input. A square matrix is
			<B>invertible exactly when its determinant is nonzero</B>.
		</p>
	</Section>

	<Section id="section-det3d" classNames="animate">
		<h2 class="text-neutral">Beyond Two Dimensions: Determinant</h2>
		<p>
			In three dimensions, add a third basis vector, <ColorText color="a"
				><Tex expr={"\\hat{k}"} /></ColorText
			>, along the z-axis: the three vectors span a unit cube of volume
			<Tex expr="1" />. A <Tex expr="3 \times 3" /> matrix sends those three vectors
			to new places, and its determinant gives the cube's signed volume: size measures
			volume, and a minus sign records a flip.
		</p>
		<p>
			Click a transformation below. Each first returns to the unit cube, then
			plays your choice; click again to replay it. The faint outline marks the
			original cube; the colored solid and readout change together.
		</p>
		<DetVolumePresets />
		<p>
			Area and volume are just the two- and three-dimensional cases of
			<B>n-dimensional volume</B>. The same idea works for an
			<Tex expr="n \times n" /> matrix in any dimension. An
			<Term>n-dimensional parallelotope</Term> is a possibly slanted box built from
			n independent edge vectors — a parallelogram in two dimensions, a solid like
			the sheared cube in three, and their counterpart in higher dimensions.
		</p>
		<p>
			The matrix transforms the unit n-dimensional cube into the parallelotope
			spanned by its columns. Its n-dimensional volume is the <B
				>absolute value of the determinant</B
			>, and that same factor scales the volume of any other parallelotope under
			the transformation.
		</p>
		<p>
			In every dimension, a positive determinant preserves orientation and a
			negative one reverses it. A zero determinant flattens the parallelotope
			into fewer dimensions, leaving zero n-dimensional volume and losing
			information. The transformation is invertible exactly when its determinant
			is nonzero.
		</p>
	</Section>

	<!-- TODO: How about 3D? -->
	<Section id="section-2" classNames="animate">
		<h2 class="text-neutral">Beyond Two-Dimensions</h2>

		<p>
			We've seen what a determinant measures in three dimensions. Now let's
			look at how a <Tex expr="3 \times 3" /> matrix moves an individual vector,
			using the same column-by-column reasoning as before.
		</p>

		<P id="st-9">
			To make up three dimensions, we have yet another standard basis vector —
			the unit vector in the <ColorText color="a"
				><Tex expr="z" />-direction</ColorText
			>. This also means we're now fiddling around with vectors of length <Tex
				expr="3"
			/> — representing the <Tex expr="xyz" /> coordinates — and matrices of size
			<nobr><Tex expr="3\times3" /></nobr>.
		</P>

		<P id="st-10">
			The concept of matrix transformations in 3D is exactly the same. The three
			basis vectors are transformed to their new locations, warping space along
			with them. These locations are completely determined by the columns of the
			matrix.
		</P>

		<Tex expr={matrixVectorFormula3dEg} display color />

		<P id="st-11">
			Originally, any vector is composed of a linear combination of these three
			standard basis vectors. To figure out the where the vector lands after the
			transformation, it is a linear combination of the transformed basis
			vectors, each scaled by the respective coordinates in the starting vector.
		</P>

		<P id="st-12">
			From these visually-focused examples we've seen thus far, the most obvious application
			of matrix transformations would be that of computer graphics. In fact,
			this is precisely how this article was built! Matrices provide a language
			to rotate, scale and translate vectors and points and consequently entire
			objects in 2D or 3D space.
		</P>

		<!-- <p>
			Talk about application in computer graphics... give a concrete example
			visually. Give other examples of applications of matrices... From the
			visual examples we've seen thus far, the most obvious application of
			matrix transformations would be that of computer. In fact,
		</p> -->
		<Spacer />
		<div class="exclude">
			<p id="st-13">
				Go forth and wrap your head around matrix transformations in 3D! Now you
				have a whole additional dimension to fidget around with.
			</p>
			<Action>
				<ul class="list-none">
					<InteractionsList />
					<li>
						<ActionIcon icon={Grab} />
						<B>Right click and drag</B> to rotate around the space
					</li>
				</ul>
			</Action>
		</div>
	</Section>

	<!-- TODO: Composition of matrices -->
</div>
