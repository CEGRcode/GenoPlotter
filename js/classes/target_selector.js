const targetSelector = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        let self = this;
        this.selected_targets = {};
        this.targets_object = {};

        this.element = d3.select("#" + elementID);
        this.element.append("h5").text("Select targets:");
        this.search_bar = this.element.append("input")
            .classed("target-search-bar", true)
            .classed("inactive", true)
            .attr("type", "text")
            .attr("placeholder", "Search targets...")
            .on("input", function() {
                let search_term = self.search_bar.node().value.toLowerCase();
                self.target_list.selectAll("li")
                    .each(function() {
                        let li = d3.select(this);
                        if (li.select("label").text().toLowerCase().includes(search_term)) {
                            li.style("display", null)
                        } else {
                            li.style("display", "none")
                        }
                    })
            });
        this.selected_counter = this.element.append("div")
            .classed("selected-counter", true)
            .text("Selected targets: " + Object.keys(this.selected_targets).length);
        this.target_list = this.element.append("ul")
            .classed("target-list", true);
        
        this.loadTargets()
    }

    async loadTargets() {
        let res = await fetch(document.URL + "api/bigwig/list", {method: "GET"}),
            targets = await res.json();
        
        this.targets_object = {};
        for (let target of targets) {
            this.targets_object[target.name] = {
                forward: target.forward,
                reverse: target.reverse,
                selected: false
            }
        };

        let sorted_targets = Object.keys(this.targets_object);
        sorted_targets.sort();
        this.updateTargets(sorted_targets)
    }

    updateTargets(targets) {
        let self = this;
        this.search_bar.classed("inactive", false);
        let search_term = self.search_bar.node().value.toLowerCase();
        this.target_list.selectAll("li").data(targets).join("li")
            .each(function(d) {
                let target_item = d3.select(this);
                target_item.selectAll("input")
                    .data([d])
                    .join("input")
                        .attr("type", "checkbox")
                        .attr("id", d + "-checkbox")
                        .style("margin-right", "5px")
                        .classed("target-checkbox", true)
                        .property("checked", self.targets_object[d].selected)
                        .on("change", async function() {
                            let checkbox = d3.select(this),
                                n = Object.keys(self.selected_targets).length;
                            self.targets_object[d].selected = checkbox.property("checked");
                            let sorted_targets = Object.keys(self.targets_object);
                            sorted_targets.sort((a, b) => !(self.targets_object[a].selected ^ self.targets_object[b].selected) ?
                                a.localeCompare(b) : self.targets_object[b].selected - self.targets_object[a].selected);
                            if (checkbox.property("checked")) {
                                let res = await fetch(document.URL + "api/bigwig/normalization", {
                                    method: "POST",
                                    headers: {"Content-Type": "application/json"},
                                    body: JSON.stringify({sample: d.split("_")[0], method: "NCIS"})
                                }),
                                    normData = await res.json();
                                self.selected_targets[d] = n;
                                const compositeDataObj = dataObj.addCompositeData({
                                    idx: n,
                                    name: d,
                                    forward_bw: self.targets_object[d].forward,
                                    reverse_bw: self.targets_object[d].reverse,
                                    normalizationFactor: normData.normFactor
                                });
                                tableObj.addRow(compositeDataObj);
                                if (bedLoaderObj.reference_points.length > 0) {
                                    await compositeDataObj.fetchPileup(bedLoaderObj.reference_points, bedLoaderObj.radius);
                                    await dataObj.autoscaleAxisLimits();
                                    xAxisInputObj.update();
                                    yAxisInputObj.update();
                                    plotObj.updatePlot();
                                    legendObj.updateLegend()
                                }
                            } else {
                                tableObj.removeRow(self.selected_targets[d]);
                                dataObj.removeCompositeData(self.selected_targets[d]);
                                for (let target in self.selected_targets) {
                                    if (self.selected_targets[target] > self.selected_targets[d]) {
                                        self.selected_targets[target]--
                                    }
                                };
                                delete self.selected_targets[d];
                                plotObj.updatePlot();
                                legendObj.updateLegend()
                            };
                            self.updateSelectedCounter();
                            self.updateTargets(sorted_targets)
                        });
                target_item.selectAll("label")
                    .data([d])
                    .join("label")
                        .attr("for", d + "-checkbox")
                        .text(d);
                target_item.style("display", d.toLowerCase().includes(search_term) ? null : "none")
            })
    }

    updateSelectedCounter() {
        this.selected_counter.text("Selected targets: " + Object.keys(this.selected_targets).length)
    }

    parseTargetsFile(content) {
        let lines = content.split("\n"),
            targets_object = {};
        for (let i = 1; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith("#") || line.trim() === "") {
                continue
            };
            let fields = line.split("\t");
            if (fields.length < 3) {
                console.warn("Skipping malformed line: " + line);
                continue
            };
            targets_object[fields[0]] = {
                forward: fields[1],
                reverse: fields[2],
                scale: fields[3] === "" || fields[3] === undefined ? 1 : parseFloat(fields[3])
            }
        };
        return targets_object
    }

    moveTarget(oldIdx, newIdx) {
        for (let target in this.selected_targets) {
            if (this.selected_targets[target] === oldIdx) {
                this.selected_targets[target] = newIdx
            } else if (this.selected_targets[target] > oldIdx && this.selected_targets[target] <= newIdx) {
                this.selected_targets[target]--
            } else if (this.selected_targets[target] < oldIdx && this.selected_targets[target] >= newIdx) {
                this.selected_targets[target]++
            }
        }
    }
}
