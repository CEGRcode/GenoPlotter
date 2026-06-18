const compositeRow = class {
    constructor(table, row, idx, compositeDataObj, local=true) {
        this.table = table;
        this.row = row;
        this.idx = idx;
        this.compositeDataObj = compositeDataObj;
        this.local = local;
        
        const self = this;
        this.row
            .on("mouseover", function() {self.mouseHighlight()})
            .on("mouseleave", function() {self.mouseUnhighlight()});
        if (local) {
            this.row.on("dragover", function(ev) {
                ev.preventDefault();
                if (ev.dataTransfer.types[0] === "Files") {
                    self.fileDragHighlight()
                }
            })
            .on("dragleave", function() {self.fileDragUnhighlight()})
            .on("drop", function(ev) {
                self.fileDragUnhighlight();
                ev.preventDefault();
                if (ev.dataTransfer.items[0].kind === "file") {
                    const files = [];
                    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                        files.push(ev.dataTransfer.items[i].getAsFile())
                    };
                    self.loadFiles(files)
                }
            });
        } else {
            this.row.on("dragover", function(ev) {ev.preventDefault()})
            .on("drop", function(ev) {ev.preventDefault()})
        };

        // Add the drag column
        this.dragIcon = this.row.append("td").append("div")
            .classed("drag-col", true)
            .attr("title", "Drag to reorder")
            .append("i")
                .classed("drag-icon fa-solid fa-2xl fa-bars", true);
                // .classed("drag-icon fa-solid fa-2xl fa-grip-lines", true);

        // Add the name column
        this.nameInput = this.row.append("td").classed("name-col", true).append("div");
        if (local) {
            this.nameInput
                .classed("name-div", true)
                .on("mousedown", function() {self.disableDrag()})
                .on("mouseup", function() {self.enableDrag()})
                .on("mouseleave", function() {self.enableDrag()})
                .attr("contenteditable", true)
                .on("input", function(ev) {
                    self.compositeDataObj.changeName(ev.target.textContent);
                    plotObj.updatePlot();
                    legendObj.updateLegend()
                })
        };

        // Add the color column
        const colorCol = this.row.append("td").classed("color-col", true);
        this.primaryColorInput = colorCol.append("input")
            .attr("type", "color")
            .classed("color-1", true)
            .on("change", function(ev) {
                self.compositeDataObj.changePrimaryColor(ev.target.value);
                if (self.compositeDataObj.secondaryColor === null) {
                    colorCol.select(".color-2").node().value = ev.target.value
                };
                plotObj.updatePlot();
                legendObj.updateLegend()
            });
        this.secondaryColorInput = colorCol.append("input")
            .attr("type", "color")
            .classed("color-2", true)
            .on("change", function(ev) {
                self.compositeDataObj.changeSecondaryColor(ev.target.value);
                plotObj.updatePlot();
                legendObj.updateLegend()
            });
        
        // Add the scale column
        const scaleDiv = this.row.append("td")
            .classed("scale-col", true)
            .append("div")
                .classed("slider-div", true);
        this.scaleTextInput = scaleDiv.append("input")
            .attr("type", "text")
            .classed("setting-text", true)
            .on("change", function(ev) {
                let scale = parseFloat(ev.target.value);
                if (isNaN(scale) || scale <= 0) {
                    ev.target.value = self.compositeDataObj.scale;
                    return
                };
                scale = roundNearestWithPrecision(ev.target.value);
                ev.target.value = scale.toPrecision(2);
                scaleDiv.select(".scale-slider").node().value = Math.log10(scale) * 50 + 50;
                self.compositeDataObj.changeScale(scale);
                plotObj.updatePlot()
            })
            .on("mousedown", function() {self.disableDrag()})
            .on("mouseup", function() {self.enableDrag()})
            .on("mouseleave", function() {self.enableDrag()});
        this.scaleSliderInput = scaleDiv.append("input")
            .attr("type", "range")
            .classed("scale-slider", true)
            .attr("min", 0)
            .attr("max", 100)
            .on("input", function(ev) {
                const scale = roundNearestWithPrecision(Math.pow(10, (ev.target.value - 50) / 50));
                scaleDiv.select(".setting-text").node().value = scale.toPrecision(2);
                self.compositeDataObj.changeScale(scale);
                plotObj.updatePlot()
            })
            .on("mousedown", function() {self.disableDrag()})
            .on("mouseup", function() {self.enableDrag()});
        if (!local) {
            this.normalizationFactorDisplay = scaleDiv.append("div")
                .classed("normalization-factor-display", true)
                .style("display", dataObj.globalSettings.normalization === "none" ? "none" : null)
                .text("(" + (dataObj.globalSettings.normalization === "none" ||
                    self.compositeDataObj.normalizationFactor[dataObj.globalSettings.normalization].toPrecision(3)) + ")");
        };

        // Add the opacity column
        const opacityCol = this.row.append("td").classed("opacity-col", true);
        this.minOpacityInput = opacityCol.append("input")
            .attr("type", "text")
            .attr("placeholder", dataObj.globalSettings.minOpacity)
            .classed("setting-text", true)
            .on("change", function(ev) {
                let minOpacity;
                if (ev.target.value === "") {
                    minOpacity = null
                } else {
                    minOpacity = parseFloat(ev.target.value);
                    if (isNaN(minOpacity)) {
                        ev.target.value = self.compositeDataObj.minOpacity;
                        return
                    };
                    minOpacity = Math.max(Math.min(minOpacity,
                        self.compositeDataObj.maxOpacity === null ?
                            dataObj.globalSettings.maxOpacity : self.compositeDataObj.maxOpacity),
                    0)
                }
                ev.target.value = minOpacity;
                self.compositeDataObj.changeMinOpacity(minOpacity);
                plotObj.updatePlot();
            })
            .on("mousedown", function() {self.disableDrag()})
            .on("mouseup", function() {self.enableDrag()})
            .on("mouseleave", function() {self.enableDrag()});
            opacityCol.append("span")
            .text(" - ");
        this.maxOpacityInput = opacityCol.append("input")
            .attr("type", "text")
            .attr("placeholder", dataObj.globalSettings.maxOpacity)
            .classed("setting-text", true)
            .on("change", function(ev) {
                let maxOpacity;
                if (ev.target.value === "") {
                    maxOpacity = null
                } else {
                    maxOpacity = parseFloat(ev.target.value);
                    if (isNaN(maxOpacity)) {
                        ev.target.value = self.compositeDataObj.maxOpacity;
                        return
                    };
                    maxOpacity = Math.min(Math.max(maxOpacity,
                        self.compositeDataObj.minOpacity === null ?
                            dataObj.globalSettings.minOpacity : self.compositeDataObj.minOpacity),
                    1)
                };
                ev.target.value = maxOpacity;
                self.compositeDataObj.changeMaxOpacity(maxOpacity);
                plotObj.updatePlot()
            })
            .on("mousedown", function() {self.disableDrag()})
            .on("mouseup", function() {self.enableDrag()})
            .on("mouseleave", function() {self.enableDrag()});
        
        // Add the smoothing column
        const smoothingCol = this.row.append("td");
        this.smoothingInput = smoothingCol.append("input")
            .attr("type", "text")
            .attr("placeholder", dataObj.globalSettings.smoothing)
            .classed("setting-text", true)
            .on("change", function(ev) {
                let smoothing;
                if (ev.target.value === "") {
                    smoothing = null
                } else {
                    smoothing = Math.floor(parseInt(ev.target.value) / 2) * 2 + 1;
                    if (isNaN(smoothing)) {
                        ev.target.value = self.compositeDataObj.smoothing;
                        return
                    };
                    smoothing = Math.max(smoothing, 1)
                };
                ev.target.value = smoothing;
                self.compositeDataObj.changeSmoothing(smoothing);
                plotObj.updatePlot()
            })
            .on("mousedown", function() {self.disableDrag()})
            .on("mouseup", function() {self.enableDrag()})
            .on("mouseleave", function() {self.enableDrag()});
        
        // Add the bp shift column
        const bpShiftCol = this.row.append("td");
        this.shiftInput = bpShiftCol.append("input")
            .attr("type", "text")
            .attr("placeholder", dataObj.globalSettings.bpShift)
            .classed("setting-text", true)
            .on("change", function(ev) {
                let bpShift;
                if (ev.target.value === "") {
                    bpShift = null
                } else {
                    bpShift = parseInt(ev.target.value);
                    if (isNaN(bpShift)) {
                        ev.target.value = self.compositeDataObj.bpShift;
                        return
                    };
                };
                ev.target.value = bpShift;
                self.compositeDataObj.changeBpShift(bpShift);
                plotObj.updatePlot()
            })
            .on("mousedown", function() {self.disableDrag()})
            .on("mouseup", function() {self.enableDrag()})
            .on("mouseleave", function() {self.enableDrag()});

        // Add the actions column (swap, hide, sticky)
        const actionsCol = this.row.append("td").classed("actions-col", true)
            .append("div").classed("actions-col-inner", true);

        // Add swap icon (swap and unswap icons swap in place over the same area)
        const swapToggle = actionsCol.append("div").classed("swap-container", true);
        this.unSwapIcon = swapToggle.append("i")
            .classed("swap-icon", true)
            .attr("title", "Unswap strands")
            .on("click", function() {
                self.compositeDataObj.changeSwap(!self.compositeDataObj.swap);
                plotObj.updatePlot();

                self.enableSwap()
            });
        const unSwapIconSvg = this.unSwapIcon.append("svg")
                .attr("baseProfile", "full")
                .attr("viewBox", "0 0 100 100")
                .attr("version", "1.1")
                .attr("xmlns", "http://www.w3.org/2000/svg");
        unSwapIconSvg.append("path")
            .attr("d", "M77.323 37.277L62.15 52.447h9.934c-.377 8.756-7.598 15.769-16.445 15.769h-37.3v10.409h37.3c14.589 0 26.492-11.68 26.872-26.178H92.5l-15.177-15.17z")
            .attr("fill", "#ddd");
        unSwapIconSvg.append("path")
            .attr("d", "M17.489 47.553H7.5l15.177 15.17 15.173-15.17h-9.934c.377-8.756 7.598-15.769 16.445-15.769h37.3V21.375h-37.3c-14.588 0-26.492 11.68-26.872 26.178z")
            .attr("fill", "#ddd");
        this.swapIcon = swapToggle.append("i")
            .classed("swap-icon", true)
            .attr("title", "Swap strands")
            .on("click", function() {
                self.compositeDataObj.changeSwap(!self.compositeDataObj.swap);
                plotObj.updatePlot();

                self.disableSwap()
            });
        const swapIconSvg = this.swapIcon.append("svg")
                .attr("baseProfile", "full")
                .attr("viewBox", "0 0 100 100")
                .attr("version", "1.1")
                .attr("xmlns", "http://www.w3.org/2000/svg");
        swapIconSvg.append("path")
            .attr("d", "M77.323 37.277L62.15 52.447h9.934c-.377 8.756-7.598 15.769-16.445 15.769h-37.3v10.409h37.3c14.589 0 26.492-11.68 26.872-26.178H92.5l-15.177-15.17z")
            .attr("fill", "#f00");
        swapIconSvg.append("path")
            .attr("d", "M17.489 47.553H7.5l15.177 15.17 15.173-15.17h-9.934c.377-8.756 7.598-15.769 16.445-15.769h37.3V21.375h-37.3c-14.588 0-26.492 11.68-26.872 26.178z")
            .attr("fill", "#00f");

        // Add hide icon (eye-open and eye-closed swap in place over the same area)
        const hideToggle = actionsCol.append("div").classed("hide-container", true);
        this.eyeOpenIcon = hideToggle.append("i")
            .classed("hide-icon eye-open fas fa-xl fa-eye", true)
            .attr("title", "Hide this composite")
            .on("click", function() {
                self.compositeDataObj.changeHideSense(true);
                self.compositeDataObj.changeHideAnti(true);
                plotObj.updatePlot();
                legendObj.updateLegend();

                self.closeEyeIcon()
            });
        this.eyeClosedIcon = hideToggle.append("i")
            .classed("hide-icon eye-closed fas fa-xl fa-eye-slash", true)
            .attr("title", "Show this composite")
            .on("click", function() {
                self.compositeDataObj.changeHideSense(false);
                self.compositeDataObj.changeHideAnti(false);
                plotObj.updatePlot();
                legendObj.updateLegend();

                self.openEyeIcon()
            });

        // Add sticky icon (pin and unpin swap in place over the same area)
        const stickyToggle = actionsCol.append("div").classed("sticky-container", true);
        this.stickyIcon = stickyToggle.append("i")
            .classed("sticky-icon fa-solid fa-xl fa-thumbtack highlight-color", true)
            .attr("title", "Unpin row from top")
            .on("click", function() {
                self.compositeDataObj.changeSticky(false);
                self.row.classed("sticky", false);
                const resizeObserver = new ResizeObserver(function() {tableObj.updateStickyRows()});
                for (const row of tableObj.table.selectAll("tr.composite-row.sticky").nodes()) {
                    resizeObserver.observe(row)
                };
                self.disableSticky()
            });
        this.noStickyIcon = stickyToggle.append("i")
            .classed("sticky-icon fa-solid fa-xl fa-thumbtack-slash", true)
            .attr("title", "Pin row to top")
            .on("click", function() {
                self.compositeDataObj.changeSticky(true);
                self.row.classed("sticky", true);
                const resizeObserver = new ResizeObserver(function() {tableObj.updateStickyRows()});
                for (const row of tableObj.table.selectAll("tr.composite-row.sticky").nodes()) {
                    resizeObserver.observe(row)
                };
                self.enableSticky()
            });

        if (local) {
            // Add file upload column
            const uploadCol = this.row.append("td").classed("upload-col", true),
                fileInput = uploadCol.append("input")
                    .attr("type", "file")
                    .property("multiple", true)
                    .style("display", "none")
                    .on("input", async function(ev) {
                        self.loadFiles(ev.target.files)
                    });
            uploadCol.append("button")
                .classed("upload-button", true)
                .attr("title", "Upload file(s)")
                .on("click", function() {fileInput.node().click()})
                .append("i")
                .classed("upload-icon fas fa-upload", true);
            this.uploadLabel = uploadCol.append("label")
                .classed("upload-label", true)
                .style("padding-left", "10px");

            // Add clear data column
            this.row.append("td").append("button")
                .classed("clear-button", true)
                .text("Clear")
                .on("click", function() {
                    for (const id of self.compositeDataObj.ids) {
                        compositeLoaderObj.referenceCounter[id]--
                    };
                    self.compositeDataObj.clearData();
                    plotObj.updatePlot();
                    legendObj.updateLegend();
                    self.updateInputs()
                });

            // Add remove column
            const removeIcon = this.row.append("td").append("i")
                .classed("remove-icon fa-solid fa-2xl fa-times-circle", true)
                .on("click", function() {
                    for (const id of self.compositeDataObj.ids) {
                        compositeLoaderObj.referenceCounter[id]--
                    };
                    tableObj.removeRow(self.idx);
                    dataObj.removeCompositeData(self.idx);
                    plotObj.updatePlot();
                    legendObj.updateLegend();
                    tableObj.updateStickyRows()
                })
        };
        
        this.updateInputs()
    }

    updateIndex(idx) {
        this.idx = idx
    }

    updateInputs() {
        this.nameInput.text(this.compositeDataObj.name);
        this.primaryColorInput.node().value = this.compositeDataObj.primaryColor;
        this.secondaryColorInput.style("display", dataObj.globalSettings.separateColors && !dataObj.globalSettings.combined ? null : "none");
        this.secondaryColorInput.node().value = this.compositeDataObj.secondaryColor || this.compositeDataObj.primaryColor;
        this.scaleTextInput.node().value = this.compositeDataObj.scale;
        this.scaleSliderInput.node().value = Math.log10(this.compositeDataObj.scale) * 50 + 50;
        this.minOpacityInput.node().value = this.compositeDataObj.minOpacity || "";
        this.maxOpacityInput.node().value = this.compositeDataObj.maxOpacity || "";
        this.smoothingInput.node().value = this.compositeDataObj.smoothing || "";
        this.shiftInput.node().value = this.compositeDataObj.bpShift || "";

        if (this.compositeDataObj.swap) {
            this.enableSwap()
        } else {
            this.disableSwap()
        };
        
        if (this.compositeDataObj.hideSense && this.compositeDataObj.hideAnti) {
            this.closeEyeIcon()
        } else {
            this.openEyeIcon()
        };

        if (this.compositeDataObj.sticky) {
            this.row.classed("sticky", true);
            this.enableSticky()
        } else {
            this.row.classed("sticky", false);
            this.disableSticky()
        };

        if (this.local) {
            this.uploadLabel.text(
                this.compositeDataObj.filesLoaded === 1 ? "1 file loaded" : this.compositeDataObj.filesLoaded + " files loaded"
            )
        }
    } 

    enableSwap() {
        this.swapIcon.classed("hidden", false);
        this.unSwapIcon.classed("hidden", true)
    }

    disableSwap() {
        this.swapIcon.classed("hidden", true);
        this.unSwapIcon.classed("hidden", false)
    }

    openEyeIcon() {
        this.eyeOpenIcon.classed("hidden", false);
        this.eyeClosedIcon.classed("hidden", true)
    }

    closeEyeIcon() {
        this.eyeOpenIcon.classed("hidden", true);
        this.eyeClosedIcon.classed("hidden", false)
    }

    enableSticky() {
        this.stickyIcon.classed("hidden", false);
        this.noStickyIcon.classed("hidden", true)
    }

    disableSticky() {
        this.stickyIcon.classed("hidden", true);
        this.noStickyIcon.classed("hidden", false)
    }

    disableDrag() {
        this.table.sortable.option("disabled", true)
    }

    enableDrag() {
        this.table.sortable.option("disabled", false)
    }

    mouseHighlight() {
        this.row.classed("mouse-highlight", true)
    }

    mouseUnhighlight() {
        this.row.classed("mouse-highlight", false)
    }

    fileDragHighlight() {
        this.row.classed("file-drag-highlight", true)
    }

    fileDragUnhighlight() {
        this.row.classed("file-drag-highlight", false)
    }

    async loadFiles(files) {
        await this.compositeDataObj.loadFiles(files)
        await dataObj.autoscaleAxisLimits();
        xAxisInputObj.update();
        yAxisInputObj.update();
        plotObj.updatePlot();
        legendObj.updateLegend();
        referenceLinesObj.updateReferenceLines();
        nucleosomeSliderObj.updateNucleosomeSlider();
        this.updateInputs()
    }

    remove() {
        this.row.remove()
    }
}