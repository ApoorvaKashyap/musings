(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const svg = document.getElementById("garden-graph");
    if (!svg || !window.d3 || !window.gardenGraph) return;

    const search = document.getElementById("garden-graph-search");
    const filter = document.getElementById("garden-graph-filter");
    const allNodes = Array.from(new Map(window.gardenGraph.nodes.map((n) => [n.id, n])).values());
    const allLinks = window.gardenGraph.links;

    function render() {
      const term = (search.value || "").toLowerCase();
      const kind = filter.value;
      const nodes = allNodes.filter((node) => {
        const matchesKind = kind === "all" || node.type === kind;
        const matchesTerm = !term || node.title.toLowerCase().includes(term);
        return matchesKind && matchesTerm;
      });
      const ids = new Set(nodes.map((node) => node.id));
      const links = allLinks
        .map((link) => ({
          source: typeof link.source === "object" ? link.source.id : link.source,
          target: typeof link.target === "object" ? link.target.id : link.target,
          type: link.type
        }))
        .filter((link) => ids.has(link.source) && ids.has(link.target));

      const width = svg.clientWidth || 900;
      const height = svg.clientHeight || 560;
      const d3svg = d3.select(svg);
      d3svg.selectAll("*").remove();

      const zoomLayer = d3svg.append("g");
      d3svg.call(d3.zoom().scaleExtent([0.25, 4]).on("zoom", (event) => {
        zoomLayer.attr("transform", event.transform);
      }));

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => d.type === "wiki" ? 90 : 60))
        .force("charge", d3.forceManyBody().strength(-260))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(34));

      const link = zoomLayer.append("g")
        .attr("class", "garden-graph-links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", (d) => "garden-graph-link is-" + d.type);

      const node = zoomLayer.append("g")
        .attr("class", "garden-graph-nodes")
        .selectAll("a")
        .data(nodes)
        .join("a")
        .attr("href", (d) => d.url)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      node.append("circle")
        .attr("r", (d) => d.type === "tag" ? 8 : 12)
        .attr("class", (d) => "garden-graph-node is-" + d.type);

      node.append("text")
        .text((d) => d.title)
        .attr("x", 14)
        .attr("y", 4);

      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
        node.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");
      });

      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }

    search.addEventListener("input", render);
    filter.addEventListener("change", render);
    window.addEventListener("resize", render);
    render();
  });
})();
