const referenceLinesInput = class {
    constructor(elementID, defaultColor="#FF0000", defaultLineWidth=1,
        defaultLineStyle="dashed", defaultFontSize=6, defaultLabelOffset=10
    ) {
        if (document.getElementById(elementID) === null) {
            throw "Element ID " + elementID + " not found"
        };
        this.container = d3.select("#" + elementID);

        this.defaultColor = defaultColor;
        this.defaultLineStyle = defaultLineStyle;
        this.defaultLineWidth = defaultLineWidth;
        this.defaultFontColor = defaultColor;
        this.defaultFontSize = defaultFontSize;
        this.defaultLabelOffset = defaultLabelOffset;

        const self = this;

        // Add intro block: title + description + help button
        this.introSection = this.container.append("div")
            .classed("settings-panel-intro", true);
        // this.headerSection = this.introSection.append("div")
        //     .classed("settings-panel-header", true);
        // this.headerSection.append("h5")
        //     .classed("settings-section-title", true)
        //     .text("Reference lines");
        this.introSection.append("div")
            .style("width", "calc(100% - 30px)")
            .style("display", "inline-block")
            .append("span")
                .classed("settings-header-description", true)
                .text("Add horizontal or vertical reference lines at fixed positions, with custom color, width, style, and labels.");
        this.introSection.append("div")
            .style("width", "25px")
            .style("display", "inline-block")
            .style("vertical-align", "top")
            .append("i")
                .classed("highlight-color fa-solid fa-lg fa-circle-question", true)
                .attr("title", "How do I add reference lines?")
                .on("click", function() {self.displayHelp()});

        this.horizontalLinesSection = this.container.append("div")
            .classed("ref-line-section", true);
        this.horizontalLinesHeader = this.horizontalLinesSection.append("div")
            .classed("ref-line-header-section", true);
        this.horizontalLinesHeader.append("span")
            .classed("ref-line-header-title", true)
            .text("Horizontal lines");
        this.horizontalLinesHeader.append("i")
            .classed("add-row-icon fa-solid fa-lg fa-circle-plus", true)
            .attr("title", "Add horizontal line")
            .on("click", function() {
                const y = (plotObj.yscale.domain()[0] + plotObj.yscale.domain()[1]) / 2;
                dataObj.addHorizontalReferenceLine(y, self.defaultColor, self.defaultLineWidth,
                    self.defaultLineStyle, self.defaultFontSize, self.defaultFontColor,
                    "horizontal", self.defaultLabelOffset);
                self.update("horizontal");
                referenceLinesObj.updateReferenceLines()
            });
        this.addColumnHeader(this.horizontalLinesSection, "y");
        this.horizontalLinesTable = this.horizontalLinesSection.append("table")
            .classed("ref-line-table", true);

        this.verticalLinesSection = this.container.append("div")
            .classed("ref-line-section", true);
        this.verticalLinesHeader = this.verticalLinesSection.append("div")
            .classed("ref-line-header-section", true);
        this.verticalLinesHeader.append("span")
            .classed("ref-line-header-title", true)
            .text("Vertical lines");
        this.verticalLinesHeader.append("i")
            .classed("add-row-icon fa-solid fa-lg fa-circle-plus", true)
            .attr("title", "Add vertical line")
            .on("click", function() {
                const x = Math.floor((dataObj.globalSettings.xmin + dataObj.globalSettings.xmax) / 2);
                dataObj.addVerticalReferenceLine(x, self.defaultColor, self.defaultLineWidth,
                    self.defaultLineStyle, self.defaultFontSize, self.defaultFontColor,
                    "horizontal", self.defaultLabelOffset);
                self.update("vertical");
                referenceLinesObj.updateReferenceLines()
            });
        this.addColumnHeader(this.verticalLinesSection, "x");
        this.verticalLinesTable = this.verticalLinesSection.append("table")
            .classed("ref-line-table", true);

        referenceLinesObj.updateReferenceLines();
        this.updateAll();

        d3.select(document).on("click.refLineStyleSelector", function() {
            d3.selectAll(".ref-line-style-selector").classed("hidden", true)
        })
    }

    addColumnHeader(section, axis) {
        const headerRow = section.append("div").classed("ref-line-column-header", true);
        headerRow.append("span").classed("ref-line-pos-col", true).text(axis + " =");
        headerRow.append("span").classed("ref-line-color-col", true).text("Color");
        headerRow.append("span").classed("ref-line-width-col", true).text("Width");
        headerRow.append("span").classed("ref-line-style-col", true).text("Style");
        headerRow.append("span").classed("text-orientation-col", true).text("");
        headerRow.append("span").classed("font-color-col", true).text("");
        headerRow.append("span").classed("font-size-col", true).text("Font Size");
        headerRow.append("span").classed("label-offset-col", true).text("Offset (px)");
        headerRow.append("span").classed("ref-line-remove-col", true).text("")
    }

    // Pop-up of scrollable help display
    displayHelp() {
        // console.log("Help Pop-up: nucleosome slider");
        const overlay = d3.select("body").append("div")
            .attr("id", "ref-line-help-overlay")
            .on("click", function() {overlay.remove()});
        const prompt = overlay.append("div")
            .attr("id", "ref-line-help-prompt")
            .on("click", function(ev) {ev.stopPropagation()});

        prompt.append("i")
            .classed("remove-icon fa-solid fa-lg fa-times-circle", true)
            .attr("id", "ref-line-help-close")
            .on("click", function() {overlay.remove()});

        prompt.append("h5").text("Reference lines");

        // Describe how to add horizontal or vertical lines
        prompt.append("p").text(
            "Click the \"+\" icon next to \"Horizontal lines\" or \"Vertical lines\" to add a new " +
            "reference line, centered on the plot by default."
        );
        prompt.append("img")
            .classed("ref-line-help-image", true)
            .attr("src", "images/help_settings-refpt_add-row.png")
            .attr("alt", "Adding a horizontal or vertical reference line");

        // Describe how to change properties of reference lines
        prompt.append("p").text(
            "Each line's position, color, width, dash style, and label settings " +
            "(font size, font color, text orientation, and offset) can all be edited directly in its row."
        );
        const editingImageRow = prompt.append("div")
            .classed("ref-line-help-image-row", true);
        editingImageRow.append("img")
            .classed("ref-line-help-image", true)
            .attr("src", "images/help_settings-refpt_multi-line-plot.png")
            .attr("alt", "Reference lines and labels on the plot");
        editingImageRow.append("img")
            .classed("ref-line-help-image", true)
            .attr("src", "images/help_settings-refpt_multi-line-tables.png")
            .attr("alt", "Reference line settings tables");

        // Describe how to move lines
        prompt.append("p").text(
            "Lines can also be repositioned by dragging them directly on the plot."
        );
        prompt.append("img")
            .classed("ref-line-help-image", true)
            .attr("src", "images/help_settings-refpt_move-lines.gif")
            .attr("alt", "Dragging a reference line on the plot");

        // Describe how to remove lines
        prompt.append("p").text(
            "Click the \"x\" icon in a line's row to remove it."
        );
    }

    update(hv) {
        const table = hv === "horizontal" ? this.horizontalLinesTable : this.verticalLinesTable,
            referenceLinesArr = hv === "horizontal" ? dataObj.referenceLines.horizontalLines :
                dataObj.referenceLines.verticalLines,
            axis = hv === "horizontal" ? "y" : "x",
            rowsSelector = table.selectAll("tr.ref-line-row")
                .data(referenceLinesArr)
                .join("tr")
                    .classed("ref-line-row", true)
                    .selectAll("table")
                        .data((d, i) => [{data: d, index: i}])
                        .join("table"),
            lineSettingsSelector = rowsSelector.selectAll("tr.ref-line-line-settings")
                .data(d => [d])
                .join("tr")
                    .classed("ref-line-line-settings", true);
            self = this;

        // Add a column for the position input
        const posColSelector = lineSettingsSelector.selectAll("td.ref-line-pos-col")
            .data(d => [d])
            .join("td")
                .classed("ref-line-pos-col", true);
        posColSelector.selectAll("input.ref-line-pos-input")
            .data(d => [d])
            .join("input")
                .attr("type", "text")
                .attr("title", axis + " position")
                .classed("ref-line-pos-input", true)
                .each(function(d) {
                    this.value = d.data[axis];
                    d3.select(this).on("change", function() {
                        if (isNaN(this.value) || this.value.trim() === "") {
                            this.value = referenceLinesArr[d.index][axis]
                        } else {
                            referenceLinesArr[d.index][axis] = parseFloat(this.value);
                            referenceLinesObj.updateReferenceLines()
                        }
                    })
                });

        // Add a column for the color input
        lineSettingsSelector.selectAll("td.ref-line-color-col")
            .data(d => [d])
            .join("td")
                .classed("ref-line-color-col", true)
                .selectAll("input.ref-line-color-input")
                    .data(d => [d])
                    .join("input")
                        .attr("type", "color")
                        .classed("ref-line-color-input", true)
                        .each(function(d) {
                            this.value = d.data.color;
                            d3.select(this).on("change", function() {
                                referenceLinesArr[d.index].color = this.value;
                                referenceLinesObj.updateReferenceLines();
                                self.defaultColor = this.value
                            })
                        });

        // Add a column for the line width input
        const widthColSelector = lineSettingsSelector.selectAll("td.ref-line-width-col")
            .data(d => [d])
            .join("td")
                .classed("ref-line-width-col", true);
        widthColSelector.selectAll("input.ref-line-width-input")
            .data(d => [d])
            .join("input")
                .attr("type", "text")
                .attr("title", "Width")
                .classed("ref-line-width-input", true)
                .each(function(d) {
                    this.value = d.data.linewidth;
                    d3.select(this).on("change", function() {
                        if (isNaN(this.value) || this.value.trim() === "" || parseFloat(this.value) < 0) {
                            this.value = referenceLinesArr[d.index].linewidth
                        } else {
                            referenceLinesArr[d.index].linewidth = parseFloat(this.value);
                            referenceLinesObj.updateReferenceLines();
                            self.defaultLineWidth = parseFloat(this.value)
                        }
                    })
                });
        
        // Add a column for the line style selector
        const styleColSelector = lineSettingsSelector.selectAll("td.ref-line-style-col")
            .data(d => [d])
            .join("td")
                .classed("ref-line-style-col", true);
        styleColSelector.selectAll("svg.ref-line-style-svg")
            .data(d => [d])
            .join("svg")
                .classed("ref-line-style-svg", true)
                .classed("main-line-style-svg", true)
                .each(function(d) {
                    const selector = d3.select(this);
                    self.createStyleSVG(selector, d.data.linestyle)
                })
                .on("click", function(ev) {
                    ev.stopPropagation();
                    const thisSelector = d3.select(this.parentNode).select(".ref-line-style-selector"),
                        wasHidden = thisSelector.classed("hidden");
                    d3.selectAll(".ref-line-style-selector").classed("hidden", true);
                    thisSelector.classed("hidden", !wasHidden)
                });
        styleColSelector.selectAll("div.ref-line-style-selector")
            .data(d => [d])
            .join("div")
                .classed("ref-line-style-selector", true)
                .classed("hidden", true)
                .on("click", function(ev) {ev.stopPropagation()})
                .selectAll("svg.ref-line-style-svg")
                    .data(d => Object.keys(lineStyles).map(s => ({style: s, index: d.index, currentStyle: d.data.linestyle})))
                    .join("svg")
                        .classed("ref-line-style-svg", true)
                        .classed("selected", d => d.style === d.currentStyle)
                        .each(function(d) {
                            const selector = d3.select(this);
                            self.createStyleSVG(selector, d.style);
                            selector.on("click", function() {
                                referenceLinesArr[d.index].linestyle = d.style;
                                referenceLinesObj.updateReferenceLines();
                                self.defaultLineStyle = d.style;
                                table.select("tr.ref-line-row:nth-child(" + (d.index + 1) + ")")
                                    .select("svg.main-line-style-svg")
                                    .selectAll("line")
                                        .data(() => [null])
                                        .join("line")
                                            .attr("stroke-dasharray", lineStyles[d.style]);
                                d3.selectAll(".ref-line-style-svg.selected").classed("selected", false);
                                d3.select(this.parentNode).classed("hidden", true)
                                    .selectAll("svg.ref-line-style-svg")
                                        .classed("selected", s => s.style === d.style)
                            })
                        });

        // Add a column for the text orientation toggle
        lineSettingsSelector.selectAll("td.text-orientation-col")
            .data(d => [d])
            .join("td")
                .classed("text-orientation-col", true)
                .selectAll("div.text-orientation-toggle")
                    .data(d => [d])
                    .join("div")
                        .classed("text-orientation-toggle", true)
                        .text("T")
                        .each(function(d) {
                            const toggle = d3.select(this),
                                setOrientation = orientation => toggle
                                    .classed("vertical", orientation === "vertical")
                                    .attr("title", orientation === "vertical" ?
                                        "Vertical label (click to make horizontal)" :
                                        "Horizontal label (click to make vertical)");
                            setOrientation(d.data.textOrientation);
                            toggle.on("click", function() {
                                const newOrientation = referenceLinesArr[d.index].textOrientation === "vertical" ?
                                    "horizontal" : "vertical";
                                referenceLinesArr[d.index].textOrientation = newOrientation;
                                referenceLinesObj.updateReferenceLines();
                                self.defaultTextOrientation = newOrientation;
                                setOrientation(newOrientation)
                            })
                        });

        // Add a column for the font color input
        lineSettingsSelector.selectAll("td.font-color-col")
            .data(d => [d])
            .join("td")
                .classed("font-color-col", true)
                .selectAll("input")
                    .data(d => [d])
                    .join("input")
                        .attr("type", "color")
                        .attr("title", "Font color")
                        .classed("ref-line-font-color-input", true)
                        .each(function(d) {
                            this.value = d.data.fontColor;
                            d3.select(this).on("change", function() {
                                referenceLinesArr[d.index].fontColor = this.value;
                                referenceLinesObj.updateReferenceLines();
                                self.defaultFontColor = this.value
                            })
                        });

        // Add a column for the font size input
        const fontSizeCol = lineSettingsSelector.selectAll("td.font-size-col")
            .data(d => [d])
            .join("td")
                .classed("font-size-col", true);
        fontSizeCol.selectAll("input")
            .data(d => [d])
            .join("input")
                .classed("font-size-input", true)
                .attr("type", "number")
                .attr("min", 0)
                .attr("title", "Font size")
                .each(function(d) {
                    this.value = d.data.fontSize;
                    d3.select(this).on("change", function() {
                        if (this.value.trim() === "" || parseFloat(this.value) < 0) {
                            this.value = referenceLinesArr[d.index].fontSize
                        } else {
                            referenceLinesArr[d.index].fontSize = parseFloat(this.value);
                            referenceLinesObj.updateReferenceLines();
                            self.defaultFontSize = parseFloat(this.value)
                        }
                    })
                });

        // Add a column for the label offset input
        const offsetCol = lineSettingsSelector.selectAll("td.label-offset-col")
            .data(d => [d])
            .join("td")
                .classed("label-offset-col", true);
        offsetCol.selectAll("input")
            .data(d => [d])
            .join("input")
                .attr("type", "number")
                .classed("label-offset-input", true)
                .attr("title", "Label offset")
                .each(function(d) {
                    this.value = d.data.labelOffset;
                    d3.select(this).on("change", function() {
                        if (this.value.trim() === "") {
                            this.value = referenceLinesArr[d.index].labelOffset
                        } else {
                            referenceLinesArr[d.index].labelOffset = parseFloat(this.value);
                            referenceLinesObj.updateReferenceLines();
                            self.defaultLabelOffset = parseFloat(this.value)
                        }
                    })
                });

        // Add a column for the remove icon
        lineSettingsSelector.selectAll("td.ref-line-remove-col")
            .data(d => [d])
            .join("td")
                .classed("ref-line-remove-col", true)
                .selectAll("i.remove-icon")
                    .data(d => [d])
                    .join("i")
                        .classed("remove-icon fa-solid fa-lg fa-times-circle", true)
                        .each(function(d) {
                            d3.select(this).on("click", function() {
                                referenceLinesArr.splice(d.index, 1);
                                referenceLinesObj.updateReferenceLines();
                                self.update(hv)
                            })
                        })
    }

    updateAll() {
        this.update("horizontal");
        this.update("vertical")
    }

    createStyleSVG(selector, style) {
        selector
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .attr("viewBox", "0 0 40 40")
            .attr("width", "28")
            .attr("height", "28");
        selector.append("rect")
            .attr("x", 2)
            .attr("y", 2)
            .attr("width", 36)
            .attr("height", 36)
            .attr("rx", 3)
            .attr("stroke", "#000000")
            .attr("stroke-width", 2)
            .attr("fill", "none");
        selector.append("line")
            .attr("x1", 2)
            .attr("y1", 38)
            .attr("x2", 38)
            .attr("y2", 2)
            .attr("stroke", "#000000")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", lineStyles[style])
    }
}