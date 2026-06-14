const yAxisInput = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        const self = this;

        this.element = d3.select("#" + elementID);
        this.label = this.element.append("label")
            .attr("for", "y-axis-min")
            .attr("id", "y-axis-min-label")
            .text("y-axis limits:");
        this.yMinInput = this.element.append("input")
            .attr("type", "text")
            .attr("id", "y-axis-min")
            .classed("axis-limit-input", true)
            .on("change", function() {
                const ymin = parseFloat(this.value);
                if (isNaN(ymin) || ymin >= 0) {
                    self.update();
                    return
                };
                dataObj.globalSettings.ymin = ymin;
                if (dataObj.globalSettings.symmetricY) {
                    dataObj.globalSettings.ymax = -dataObj.globalSettings.ymin;
                    yAxisInputObj.update()
                };
                plotObj.updatePlot();
                referenceLinesObj.updateReferenceLines();
                nucleosomeSliderObj.updateNucleosomeSlider()
            });
        this.yMaxInput = this.element.append("input")
            .attr("type", "text")
            .attr("id", "y-axis-max")
            .classed("axis-limit-input", true)
            .on("change", function() {
                const ymax = parseFloat(this.value);
                if (isNaN(ymax) || ymax <= 0) {
                    self.update();
                    return
                };
                if (dataObj.globalSettings.combined) {
                    const yTotal = ymax;
                    dataObj.globalSettings.ymax = yTotal / 2;
                    dataObj.globalSettings.ymin = -yTotal / 2
                } else {
                    dataObj.globalSettings.ymax = ymax;
                    if (dataObj.globalSettings.symmetricY) {
                        dataObj.globalSettings.ymin = -dataObj.globalSettings.ymax
                    }
                };
                yAxisInputObj.update();
                plotObj.updatePlot();
                referenceLinesObj.updateReferenceLines();
                nucleosomeSliderObj.updateNucleosomeSlider()
            });
            
        this.element.append("br");
        
        this.symmetricYCheckbox = this.element.append("input")
            .attr("type", "checkbox")
            .attr("id", "symmetric-y-checkbox")
            .on("change", function() {
                dataObj.globalSettings.symmetricY = this.checked;
                yAxisInputObj.update();
                plotObj.updatePlot();
                referenceLinesObj.updateReferenceLines();
                nucleosomeSliderObj.updateNucleosomeSlider()
            });
        this.symmetricYLabel = this.element.append("label")
            .attr("for", "symmetric-y-checkbox")
            .attr("id", "symmetric-y-label")
            .classed("checkbox-label", true)
            .text("Symmetric y-axis");

        this.update()
    }

    update() {
        this.symmetricYCheckbox.property("checked", dataObj.globalSettings.symmetricY && !dataObj.globalSettings.combined);
        this.symmetricYCheckbox.property("disabled", dataObj.globalSettings.combined);
        
        if (dataObj.globalSettings.combined) {
            this.yMaxInput.node().value = roundUpWithPrecision(dataObj.globalSettings.ymax - dataObj.globalSettings.ymin).toPrecision(2);
            this.yMinInput.node().value = 0
        } else if (dataObj.globalSettings.symmetricY) {
            this.yMaxInput.node().value = roundUpWithPrecision(Math.max(dataObj.globalSettings.ymax, -dataObj.globalSettings.ymin)).toPrecision(2);
            this.yMinInput.node().value = roundUpWithPrecision(Math.min(-dataObj.globalSettings.ymax, dataObj.globalSettings.ymin)).toPrecision(2)
        } else {
            this.yMaxInput.node().value = roundUpWithPrecision(dataObj.globalSettings.ymax).toPrecision(2);
            this.yMinInput.node().value = roundUpWithPrecision(dataObj.globalSettings.ymin).toPrecision(2)
        }
    }

    lockYmin() {
        this.yMinInput.attr("disabled", true)
    }

    unlockYmin() {
        this.yMinInput.attr("disabled", null)
    }

    lockInputs() {
        this.yMinInput.attr("disabled", true);
        this.yMaxInput.attr("disabled", true)
    }

    unlockInputs() {
        this.yMinInput.attr("disabled", null);
        this.yMaxInput.attr("disabled", null)
    }
}