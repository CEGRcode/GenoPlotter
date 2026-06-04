const normalizationSelect = class {
    constructor(elementID, methods=[]) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        const self = this;
        this.element = d3.select("#" + elementID);
        this.label = this.element.append("label")
            .attr("for", "normalization-dropdown")
            .attr("id", "normalization-dropdown-label")
            .text("Normalization:");
        this.dropdown = this.element.append("select")
            .attr("id", "normalization-dropdown")
            .on("change", async function() {
                const value = this.value;
                dataObj.changeNormalization(value);
                d3.selectAll(".normalization-factor-display")
                    .style("display", value === "none" ? "none" : null)
                    .data(Object.keys(targetSelectorObj.selected_targets))
                    .join("div")
                        .text(d => "(" + (value === "none" ? "" : tableObj.rows[targetSelectorObj.selected_targets[d]]
                            .compositeDataObj.normalizationFactor[dataObj.globalSettings.normalization].toPrecision(3)) + ")");
                await dataObj.autoscaleAxisLimits(false, true);
                xAxisInputObj.update();
                yAxisInputObj.update();
                plotObj.updatePlot()
            });
        
        this.loadMethods()
    }

    async loadMethods() {
        let res = await fetch(document.URL + "api/bigwig/normalization_methods", {method: "GET"}),
            methods = await res.json();
        this.dropdown.selectAll("option")
            .data(["none", ...methods.methods])
            .join("option")
                .attr("value", d => d)
                .text(d => d);
        this.update()
    }

    update() {
        this.dropdown.attr("value", dataObj.globalSettings.normalization)
    }
}