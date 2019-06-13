d3.json("storm.json").then(json => {
	////////////////////////////////////////////////////////////
	//// Process Data //////////////////////////////////////////
	////////////////////////////////////////////////////////////
	json.forEach(d => {
		d.year = +d.start.slice(0, 4);
		d.date = normalizeYear(d3.isoParse(d.start));
	});

	const data = d3
		.nest()
		.key(d => d.year)
		.sortValues((a, b) =>
			d3.descending(+a.scale[a.scale.length - 1], +b.scale[b.scale.length - 1])
		)
		.entries(json);

	////////////////////////////////////////////////////////////
	//// Setup /////////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const scales = [
		{ key: "EF0", value: "Light Damage(40 – 72 mph)" },
		{ key: "EF1", value: "Moderate Damage(73 – 112 mph)" },
		{ key: "EF2", value: "Significant damage(113 – 157 mph)" },
		{ key: "EF3", value: "Severe Damage(158 – 206 mph)" },
		{ key: "EF4", value: "Devastating Damage(207 – 260 mph)" },
		{ key: "EF5", value: "Incredible Damage(261 – 318 mph)" }
	];
	const color = d3.color("#2f7ebc");
	color.opacity = 0.05;
	const step = 5;
	const radii = d3.range(scales.length).map(d => (d + 1) * step);
	const r = d3
		.scaleOrdinal()
		.domain(scales.map(d => d.key))
		.range(radii);

	const margin = { top: 10, right: 40, bottom: 40, left: 60 };
	const rowHeight = 40;
	const height = rowHeight * data.length + margin.top + margin.bottom;
	let width;

	const x = d3.scaleTime().domain([new Date(2000, 0, 1), new Date(2001, 0, 0)]);
	const y = d3
		.scalePoint()
		.domain(data.map(d => +d.key))
		.range([margin.top, height - margin.bottom])
		.padding(0.5);

	////////////////////////////////////////////////////////////
	//// Render Legend /////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const legendWidth = 340;
	const legendRowHeight = 20;
	const legendHeight = legendRowHeight * scales.length + 5;
	const xSwatch = 30;
	const xLabel = 100;
	const svgLegend = d3
		.select(".legend-svg")
		.attr("width", legendWidth)
		.attr("height", legendHeight);

	svgLegend
		.append("text")
		.attr("x", xSwatch)
		.attr("y", legendRowHeight)
		.attr("text-anchor", "middle")
		.text("EF Scale");

	svgLegend
		.append("g")
		.selectAll("circle")
		.data(scales.slice().reverse())
		.join("circle")
		.attr("cx", xSwatch)
		.attr("cy", d => legendHeight - r(d.key))
		.attr("r", d => r(d.key))
		.attr("fill", "none")
		.attr("stroke", "#aaa");

	svgLegend
		.append("g")
		.selectAll("polyline")
		.data(scales)
		.join("polyline")
		.attr("fill", "none")
		.attr("stroke-dasharray", 2)
		.attr("points", (d, i) => {
			const x0 = xSwatch;
			const y0 = legendHeight - r(d.key) * 2;
			const x1 = (xSwatch + xLabel) / 2;
			const y1 = legendHeight - radii[0] * 2 - i * legendRowHeight;
			const x2 = xLabel;
			const y2 = y1;
			return `${x0},${y0} ${x1},${y1} ${x2},${y2}`;
		});

	svgLegend
		.append("g")
		.selectAll("text")
		.data(scales.slice().reverse())
		.join("text")
		.attr("x", xLabel)
		.attr("y", (d, i) => (i + 1) * legendRowHeight)
		.text(d => `${d.key} - ${d.value}`);

	////////////////////////////////////////////////////////////
	//// Render Chart //////////////////////////////////////////
	////////////////////////////////////////////////////////////
	const xAxis = d3
		.axisBottom(x)
		.ticks(d3.timeMonth.every(1))
		.tickFormat(d =>
			d3
				.timeFormat("%b")(d)
				.toUpperCase()
		)
		.tickSizeInner(-(height - margin.top - margin.bottom));

	const svg = d3.select(".chart-svg").attr("height", height);

	const gXAxis = svg
		.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`);
	svg
		.append("g")
		.attr("transform", `translate(${margin.left}, 0)`)
		.call(
			d3
				.axisLeft(y)
				.tickSize(0)
				.tickPadding(30)
		)
		.call(g => g.select(".domain").remove());

	const canvas = d3.select(".chart-canvas").attr("height", height);
	const context = canvas.node().getContext("2d");

	function drawSvg() {
		svg.attr("width", width);
		x.range([margin.left, width - margin.right]);

		gXAxis
			.call(xAxis)
			.call(g => g.select(".domain").remove())
			.call(g => g.selectAll(".tick line").attr("stroke-dasharray", 2));
	}

	function drawCanvas() {
		canvas.attr("width", width);
		context.clearRect(0, 0, width, height);
		data.forEach(year => {
			year.values.forEach(drawCircle);
		});
	}

	function drawCircle(d) {
		context.beginPath();
		context.fillStyle = color;
		const cx = x(d.date);
		const cy = y(d.year);
		const radius = r(d.scale);
		context.arc(cx, cy, radius, 0, 2 * Math.PI, true);
		context.fill();
	}

	function resize() {
		width = d3.select(".chart-container").node().clientWidth;
		drawSvg();
		drawCanvas();
	}

	resize();

	window.addEventListener("resize", resize);

	////////////////////////////////////////////////////////////
	//// Utilities /////////////////////////////////////////////
	////////////////////////////////////////////////////////////
	function normalizeYear(originalDate) {
		const date = new Date(+originalDate);
		date.setFullYear(2000);
		return date;
	}
});
