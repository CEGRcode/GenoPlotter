const bedLoader = class {
    constructor(elementID) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };

        let self = this;
        this.element = d3.select("#" + elementID);
        this.file_input = this.element.append("input")
            .attr("type", "file")
            .on("change", async function(ev) {
                let bed_data = await new Promise(function(resolve, reject) {
                    let reader = new FileReader();
                    reader.onload = function() {
                        try {
                            resolve(self.parseBedFile(reader.result))
                        } catch (e) {
                            reject("Error parsing BED file: " + e)
                        }
                    };
                    reader.onerror = function() {
                        reject("Error reading BED file: " + reader.error)
                    };
                    reader.readAsText(ev.target.files[0])
                });
                self.reference_points = bed_data.reference_points;
                self.radius = bed_data.radius;
                self.label.text(ev.target.files[0].name + " (N = " + self.reference_points.length + ")");

                if (self.reference_points.length > 0 && Object.keys(targetSelectorObj.selected_targets).length > 0) {
                    plotObj.togglePlaceholder(true)
                };

                const compositeData = await Promise.all(Object.keys(targetSelectorObj.selected_targets).map(d => 
                    targetSelectorObj.targets_object[d].fetchPileup(self.reference_points, self.radius)));
                compositeData.forEach(function(compositeDataObj) {
                    dataObj.fileData[compositeDataObj.name] = {
                        xmin: compositeDataObj.xmin,
                        xmax: compositeDataObj.xmax,
                        sense: compositeDataObj.sense,
                        anti: compositeDataObj.anti
                    }
                });
                await dataObj.autoscaleAxisLimits();
                xAxisInputObj.update();
                yAxisInputObj.update();
                plotObj.updatePlot();
                legendObj.updateLegend();
                for (const compositeData of dataObj.compositeData) {
                    dataObj.fileData[compositeData.name] = {
                        xmin: compositeData.xmin,
                        xmax: compositeData.xmax,
                        sense: compositeData.sense,
                        anti: compositeData.anti
                    }
                }
            });
        this.button = this.element.append("button")
            .classed("panel-action-button", true)
            .text("Load BED file")
            .on("click", function() {self.file_input.node().click()});
        this.label = this.element.append("label")
            .attr("id", "bed-loader-label")
            .text("No BED loaded");
        this.text_input = this.element.append("div")
            .classed("bed-text-input", true)
            .attr("contenteditable", "true")
            .attr("placeholder", "Or paste BED file content here...")
            .on("keydown", function(ev) {
                if (ev.key === "Tab") {
                    ev.preventDefault();
                    const selection = window.getSelection(),
                        range = selection.getRangeAt(0),
                        tabSpan = document.createElement("span");
                    tabSpan.setAttribute("style", "white-space:pre");
                    tabSpan.innerText = "\t";

                    const start = range.startContainer.parentElement,
                        end = range.endContainer.parentElement;
                    selection.deleteFromDocument();
                    if (start === end) {
                        range.insertNode(tabSpan);
                        selection.collapseToEnd()
                    } else {
                        start.appendChild(tabSpan);
                        while (end.firstChild) {
                            start.appendChild(end.firstChild)
                        };
                        end.remove();

                        const newRange = document.createRange();
                        newRange.setStartAfter(tabSpan);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange)
                    }
                }
            });
        this.submit_button = this.element.append("button")
            .classed("panel-action-button", true)
            .text("Load pasted BED")
            .on("click", async function() {
                let bed_data = self.parseBedFile(self.text_input.node().innerText.replace(/\u00A0 \u00A0 /g, "\t"));
                self.reference_points = bed_data.reference_points;
                self.radius = bed_data.radius;
                self.label.text("BED (N = " + self.reference_points.length + ")");

                if (self.reference_points.length > 0 && Object.keys(targetSelectorObj.selected_targets).length > 0) {
                    plotObj.togglePlaceholder(true)
                };

                const compositeData = await Promise.all(Object.keys(targetSelectorObj.selected_targets).map(d => 
                    targetSelectorObj.targets_object[d].fetchPileup(self.reference_points, self.radius)));
                compositeData.forEach(function(compositeDataObj) {
                    dataObj.fileData[compositeDataObj.name] = {
                        xmin: compositeDataObj.xmin,
                        xmax: compositeDataObj.xmax,
                        sense: compositeDataObj.sense,
                        anti: compositeDataObj.anti
                    }
                });
                await dataObj.autoscaleAxisLimits();
                xAxisInputObj.update();
                yAxisInputObj.update();
                plotObj.updatePlot();
                legendObj.updateLegend();
                for (const compositeData of dataObj.compositeData) {
                    dataObj.fileData[compositeData.name] = {
                        xmin: compositeData.xmin,
                        xmax: compositeData.xmax,
                        sense: compositeData.sense,
                        anti: compositeData.anti
                    }
                }
            });

        this.reference_points = [];
        this.radius = 500
    }

    parseBedFile(content) {
        let lines = content.split("\n"),
            midpoints = [],
            radius = 0;
        for (let line of lines) {
            if (line.startsWith("#") || line.trim() === "") {
                continue
            };

            let fields = line.split("\t");
            if (fields.length < 6) {
                console.warn("Skipping malformed BED line: " + line);
                continue
            };

            let chrom = fields[0],
                start = parseInt(fields[1]),
                end = parseInt(fields[2]),
                strand = fields[5];
            if (isNaN(start) || isNaN(end) || start >= end) {
                console.warn("Skipping BED line with invalid coordinates: " + line);
                continue
            };
            let r = Math.ceil((end - 1 - start) / 2),
                _mid = (start + end - 1) / 2,
                mid = strand === "+" ? Math.floor(_mid) : Math.ceil(_mid);
            radius = Math.max(radius, r);

            midpoints.push({chrom: chrom, pos: mid, strand: strand})
        };
        let reference_points = midpoints.map(d => ({
            chrom: d.chrom,
            start: d.pos - radius,
            end: d.pos + radius + 1,
            strand: d.strand
        }));
        return {reference_points: reference_points, radius: radius}
    }
}