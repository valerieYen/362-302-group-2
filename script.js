
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const buttons = Array.from(document.querySelectorAll('[data-tab-target]'));
        const contents = Array.from(document.querySelectorAll('[data-tab-content]'));

        if (!buttons.length || !contents.length) return;

        function hideAll() {
            contents.forEach(c => {
                c.style.display = 'none';
                c.setAttribute('aria-hidden', 'true');
            });
            buttons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
        }
        function updateDisabledState(activeButton) {
            buttons.forEach(b => {
                const isActive = b === activeButton || b.classList.contains('active') || b.getAttribute('aria-selected') === 'true';
                try {
                    b.disabled = isActive;
                } catch (e) {
                    // some elements (like anchors) don't support disabled; fall back to aria/tabindex
                    if (isActive) {
                        b.setAttribute('aria-disabled', 'true');
                        b.setAttribute('tabindex', '-1');
                    } else {
                        b.setAttribute('aria-disabled', 'false');
                        b.removeAttribute('tabindex');
                    }
                }
                b.setAttribute('aria-disabled', isActive ? 'true' : 'false');
            });
        }

        // immediate UI reaction on user interaction
        buttons.forEach(b => {
            b.addEventListener('click', () => updateDisabledState(b));
            b.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    // allow show handler to run too; update state immediately so keyboard users see feedback
                    updateDisabledState(b);
                }
            });
        });

        // keep state in sync if show() or other code updates aria-selected / class
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                if ((m.attributeName === 'class' || m.attributeName === 'aria-selected') && m.target) {
                    const target = m.target;
                    if (target.getAttribute && (target.getAttribute('aria-selected') === 'true' || target.classList.contains('active'))) {
                        updateDisabledState(target);
                        return;
                    }
                }
            }
        });

        buttons.forEach(b => observer.observe(b, { attributes: true, attributeFilter: ['class', 'aria-selected'] }));
        function show(button) {
            const targetId = button.dataset.tabTarget;
            if (!targetId) return;
            const panel = document.getElementById(targetId);
            if (!panel) return;
            hideAll();
            panel.style.display = '';
            panel.setAttribute('aria-hidden', 'false');
            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
        }

        // Activate initial tab: hash -> .active -> first
        const hash = location.hash && location.hash.slice(1);
        let initialButton = buttons.find(b => b.dataset.tabTarget === hash)
                                         || buttons.find(b => b.classList.contains('active'))
                                         || buttons[0];

        hideAll();
        if (initialButton) show(initialButton);

        // Wire clicks (and keyboard Enter/Space)
        buttons.forEach(btn => {
            btn.addEventListener('click', () => show(btn));
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    show(btn);
                }
            });
        });

        // Optional: respond to hash changes (e.g., back/forward)
        window.addEventListener('hashchange', () => {
            const newHash = location.hash && location.hash.slice(1);
            const btn = buttons.find(b => b.dataset.tabTarget === newHash);
            if (btn) show(btn);
        });
    });
})();

(function(){
            const rows = [
              { id: "P1", busyness: 0.40, terp: 0.40, yak: 0.70 },
              { id: "P2", busyness: 0.60, terp: 0.50, yak: 0.85 },
              { id: "P3", busyness: 0.40, terp: 0.55, yak: 0.45 },
              { id: "P4", busyness: 0.40, terp: 0.75, yak: 0.60 },
              { id: "P5", busyness: 0.05, terp: 0.65, yak: 0.55 }
            ];

            function makeChart(targetSelector, series, strokeClass, swatchColor) {
              const svg = d3.select(targetSelector);
              const { width } = svg.node().getBoundingClientRect();
              const height = +svg.attr("height") || 352;
              const margin = { top: 16, right: 20, bottom: 48, left: 56 };
              const innerW = Math.max(120, width - margin.left - margin.right);
              const innerH = Math.max(120, height - margin.top - margin.bottom);
              svg.attr("width", width).attr("height", height);
              const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

              const x = d3.scaleLinear().domain([0,1]).nice().range([0, innerW]);
              const y = d3.scaleLinear().domain([0,1]).nice().range([innerH, 0]);

              // gridlines
              g.append("g")
                .attr("class", "fv-gridline")
                .attr("transform", `translate(0,${innerH})`)
                .call(d3.axisBottom(x).ticks(10).tickSize(-innerH).tickFormat(""));

              g.append("g")
                .attr("class", "fv-gridline")
                .call(d3.axisLeft(y).ticks(10).tickSize(-innerW).tickFormat(""));

              // axes
              const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format(".0%"));
              const yAxis = d3.axisLeft(y).ticks(10).tickFormat(d3.format(".0%"));
              g.append("g").attr("class","fv-axis").attr("transform",`translate(0,${innerH})`).call(xAxis);
              g.append("g").attr("class","fv-axis").call(yAxis);

              // labels
              g.append("text").attr("x", innerW/2).attr("y", innerH + 36).attr("text-anchor","middle").attr("fill","#111827").text("Sentiment");
              g.append("text").attr("transform","rotate(-90)").attr("x",-innerH/2).attr("y",-42).attr("text-anchor","middle").attr("fill","#111827").text("Busyness");

                            // tooltip: support either '#fv-tooltip' (original) or '#tooltip' (split-file)
                            let tip = d3.select("#fv-tooltip");
                            if (tip.empty()) {
                                tip = d3.select("#tooltip");
                            }
                            // if still empty, create a minimal tooltip container so code won't break
                            if (tip.empty()) {
                                tip = d3.select("body").append("div").attr("id", "tooltip").attr("class", "tooltip").style("opacity", 0);
                            }
              const fmt = d3.format(".2f");
              function showTip(event, d){
                                const [mx,my] = d3.pointer(event, document.body);
                tip.html(`<strong>${d.id}</strong><br>${series} sentiment: ${fmt(d[series])}<br>Busyness: ${fmt(d.busyness)}`)
                   .style("left", mx + "px")
                   .style("top", (my - 12) + "px")
                   .style("opacity", 1);
              }
              function hideTip(){ tip.style("opacity", 0); }

              // points
              g.selectAll(".fv-point")
                .data(rows)
                .join("circle")
                .attr("class","fv-point")
                .attr("r", 4.5)
                .attr("cx", d => x(d[series]))
                .attr("cy", d => y(d.busyness))
                .attr("fill", swatchColor)
                .on("mouseenter", showTip)
                .on("mousemove", showTip)
                .on("mouseleave", hideTip);

              // regression & R2
              const pts = rows.map(d => [d[series], d.busyness]);
              const n = pts.length;
              const sx = d3.sum(pts, p => p[0]);
              const sy = d3.sum(pts, p => p[1]);
              const sxx = d3.sum(pts, p => p[0]*p[0]);
              const syy = d3.sum(pts, p => p[1]*p[1]);
              const sxy = d3.sum(pts, p => p[0]*p[1]);

              const denom = n * sxx - sx * sx;
              const m = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
              const b = (sy - m * sx) / n;

              const yMean = sy / n;
              const ssTot = d3.sum(pts, p => (p[1] - yMean) ** 2);
              const ssRes = d3.sum(pts, p => (p[1] - (m * p[0] + b)) ** 2);
              const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

              const x0 = 0, x1 = 1;
              const y0 = m * x0 + b;
              const y1 = m * x1 + b;

              g.append("line")
                .attr("class", "fv-fit " + strokeClass)
                .attr("x1", x(x0)).attr("y1", y(y0))
                .attr("x2", x(x1)).attr("y2", y(y1));

              g.append("text")
                .attr("class","fv-r2")
                .attr("x", innerW - 8)
                .attr("y", 16)
                .attr("text-anchor","end")
                .text(`R² = ${d3.format(".2f")(r2)}`);
            }

              // Build charts with colors.
              // Support both id conventions: '#fv-chart-terp' (original) and '#chart-terp' (split-file)
              const terpTarget = document.querySelector('#fv-chart-terp') ? '#fv-chart-terp' : '#chart-terp';
              const yakTarget  = document.querySelector('#fv-chart-yak')  ? '#fv-chart-yak'  : '#chart-yak';
              makeChart(terpTarget, "terp", "fv-fit-terp", "#2563eb");
              makeChart(yakTarget,  "yak",  "fv-fit-yak",  "#f59e0b");
          })();