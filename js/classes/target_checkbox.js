const targetCheckbox = class {
    constructor(element, name, forward, reverse, parent) {
        this.element = element;
        this.name = name;
        this.forward = forward;
        this.reverse = reverse;
        this.parent = parent;

        this.selected = false;
        this.compositeDataObj = null;

        const self = this;

        this.checkbox = element.append("input")
            .attr("type", "checkbox")
            .attr("id", name + "-checkbox")
            .classed("target-checkbox", true)
            .on("change", async function() {
                if (this.checked) {
                    await self.select(Object.keys(self.parent.selected_targets).length);
                    if (bedLoaderObj.reference_points.length > 0) {
                        await self.fetchPileup(bedLoaderObj.reference_points, bedLoaderObj.radius);
                        dataObj.fileData[self.name] = {
                            xmin: self.compositeDataObj.xmin,
                            xmax: self.compositeDataObj.xmax,
                            sense: self.compositeDataObj.sense,
                            anti: self.compositeDataObj.anti
                        };
                        await dataObj.autoscaleAxisLimits();
                        xAxisInputObj.update();
                        yAxisInputObj.update();
                        plotObj.updatePlot();
                        legendObj.updateLegend()
                    }
                } else {
                    self.unselect();
                    plotObj.updatePlot();
                    legendObj.updateLegend()
                }
            });

        this.loadingCircle = element.append("div")
            .classed("loading-circle", true)
            .style("display", "none");
        
        this.label = element.append("label")
            .attr("for", name + "-checkbox")
            .text(name)
    }

    select(composite_idx) {
        const self = this;
        return new Promise(async function(resolve) {
            self.selected = true;

            let res = await fetch(document.URL + "api/bigwig/normalization", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({sample: self.name})
                }),
                normData = await res.json();

            self.compositeDataObj = dataObj.addCompositeData({
                idx: composite_idx,
                name: self.name,
                ids: [],
                forward_bw: self.forward,
                reverse_bw: self.reverse,
                normalizationFactor: normData.normFactor
            });

            self.parent.selected_targets[self.name] = composite_idx;
            self.parent.updateSelectedCounter();
            self.parent.sortTargets();
            tableObj.addRow(self.compositeDataObj);

            resolve()
        })
    }

    unselect() {
        this.selected = false;

        const idx = this.parent.selected_targets[this.name];

        dataObj.removeCompositeData(idx);
        tableObj.removeRow(idx);

        for (let sample in this.parent.selected_targets) {
            if (this.parent.selected_targets[sample] > idx) {
                this.parent.selected_targets[sample]--
            }
        };
        delete this.parent.selected_targets[this.name];
        this.parent.updateSelectedCounter();
        this.parent.sortTargets();

        this.compositeDataObj = null;
        delete dataObj.fileData[this.name]
    }

    fetchPileup(reference_points, radius) {
        const self = this;
        return new Promise(async function(resolve) {
            self.checkbox.attr("disabled", true).style("display", "none");
            self.loadingCircle.style("display", null);
            await self.compositeDataObj.fetchPileup(reference_points, radius);
            self.checkbox.property("disabled", false).style("display", null);
            self.loadingCircle.style("display", "none");

            resolve(self.compositeDataObj)
        })
    }
}