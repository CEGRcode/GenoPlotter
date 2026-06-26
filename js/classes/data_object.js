const dataObject = class {
    constructor({globalSettings, fileData, compositeData, referenceLines, nucleosomeSlider, bedObj}) {
        this.globalSettings = globalSettings;
        this.fileData = fileData;
        this.compositeData = compositeData;
        this.legendOrder = [...compositeData.keys()];
        this.referenceLines = referenceLines;
        this.nucleosomeSlider = nucleosomeSlider;
        this.bedObj = bedObj
    }

    changeXmin(xmin) {
        if (isFinite(xmin)) {
            this.globalSettings.xmin = xmin
        }
    }

    changeXmax(xmax) {
        if (isFinite(xmax)) {
            this.globalSettings.xmax = xmax
        }
    }

    changeYmin(ymin) {
        if (isFinite(ymin)) {
            this.globalSettings.ymin = ymin
        }
    }

    changeYmax(ymax) {
        if (isFinite(ymax)) {
            this.globalSettings.ymax = ymax
        }
    }

    changeSymmetricY(symmetricY) {
        this.globalSettings.symmetricY = symmetricY
    }

    changeLockAxes(lockAxes) {
        this.globalSettings.lockAxes = lockAxes
    }

    changeMinOpacity(minOpacity) {
        this.globalSettings.minOpacity = minOpacity
    }

    changeMaxOpacity(maxOpacity) {
        this.globalSettings.maxOpacity = maxOpacity
    }

    changeSmoothing(smoothing) {
        this.globalSettings.smoothing = smoothing
    }

    changeBpShift(bpShift) {
        this.globalSettings.bpShift = bpShift
    }

    changeBackdropColor(color) {
        this.globalSettings.backdropColor = color
    }

    changeBackdropOpacity(opacity) {
        this.globalSettings.backdropOpacity = opacity
    }

    changeCombined(combined) {
        this.globalSettings.combined = combined
    }

    changeSeparateColors(separateColors) {
        this.globalSettings.separateColors = separateColors
    }

    changeColorTrace(colorTrace) {
        this.globalSettings.colorTrace = colorTrace
    }

    changeEnableTooltip(enableTooltip) {
        this.globalSettings.enableTooltip = enableTooltip
    }

    changeShowLegend(showLegend) {
        this.globalSettings.showLegend = showLegend
    }

    changeLabel(field, value) {
        this.globalSettings.labels[field] = value
    }

    changeNormalization(normalization) {
        this.globalSettings.normalization = normalization
    }

    addCompositeData({idx, name=null, forward_bw=null, reverse_bw=null,xmin=Infinity, xmax=-Infinity, sense=null,
        anti=null, primaryColor=null, secondaryColor=null, scale=1, minOpacity=null, maxOpacity=null, smoothing=null,
        bpShift=null, shiftOccupancy=0, hideSense=false, hideAnti=false, swap=false, sticky=false, ids=null, normalizationFactor={}}) {
        const compositeDataObj = new compositeObject({idx, name: name, forward_bw: forward_bw, reverse_bw: reverse_bw,
            xmin: xmin, xmax: xmax, sense: sense, anti: anti, primaryColor: primaryColor, secondaryColor: secondaryColor,
            scale: scale, minOpacity: minOpacity, maxOpacity: maxOpacity, smoothing: smoothing, bpShift: bpShift,
            shiftOccupancy: shiftOccupancy, hideSense: hideSense, hideAnti: hideAnti, swap: swap, sticky: sticky, ids: ids,
            normalizationFactor: normalizationFactor});
        this.compositeData[idx] = (compositeDataObj);
        this.legendOrder[idx] = idx;

        return compositeDataObj
    }

    moveCompositeData(oldIdx, newIdx) {
        const compositeDataObj = this.compositeData[oldIdx];
        this.compositeData.splice(oldIdx, 1);
        this.compositeData.splice(newIdx, 0, compositeDataObj);

        for (const i in this.legendOrder) {
            if (this.legendOrder[i] == oldIdx) {
                this.legendOrder[i] = newIdx
            } else if (this.legendOrder[i] > oldIdx && this.legendOrder[i] <= newIdx) {
                this.legendOrder[i]--
            } else if (this.legendOrder[i] < oldIdx && this.legendOrder[i] >= newIdx) {
                this.legendOrder[i]++
            }
        }
    }

    removeCompositeData(idx) {
        this.compositeData.splice(idx, 1);

        for (const i in this.legendOrder) {
            if (this.legendOrder[i] == idx) {
                this.legendOrder.splice(i, 1)
            };
            if (this.legendOrder[i] > idx) {
                this.legendOrder[i]--
            }
        }
    }

    updateAllComposites() {
        for (const compositeDataObj of this.compositeData) {
            if (compositeDataObj.filesLoaded > 0) {
                compositeDataObj.updateData()
            }
        }
    }

    updateGlobalSettings(globalSettings) {
        Object.assign(this.globalSettings, globalSettings)
    }

    autoscaleAxisLimits(changeX=true, changeY=true) {
        if (this.globalSettings.lockAxes) {
            return
        };

        const self = this;
        return new Promise(function(resolve) {
            let xmin = Infinity,
                xmax = -Infinity,
                ymin = Infinity,
                ymax = -Infinity;
            for (const compositeDataObj of self.compositeData) {
                if (compositeDataObj.hideSense && compositeDataObj.hideAnti) {
                    continue
                };
                const smoothing = compositeDataObj.smoothing === null ?
                        self.globalSettings.smoothing : compositeDataObj.smoothing,
                    bpShift = Math.abs(compositeDataObj.bpShift === null ?
                        self.globalSettings.bpShift : compositeDataObj.bpShift);
                xmin = Math.min(xmin, compositeDataObj.xmin - bpShift);
                xmax = Math.max(xmax, compositeDataObj.xmax + bpShift);
                if (!compositeDataObj.hideSense) {
                    ymax = Math.max(ymax, Math.max(...plotObj.slidingWindow(compositeDataObj.sense, smoothing)) *
                        compositeDataObj.scale * (self.globalSettings.normalization !== "none" ?
                            compositeDataObj.normalizationFactor[self.globalSettings.normalization] : 1))
                };
                if (!compositeDataObj.hideAnti) {
                    ymin = Math.min(ymin, -Math.max(...plotObj.slidingWindow(compositeDataObj.anti, smoothing)) *
                        compositeDataObj.scale * (self.globalSettings.normalization !== "none" ?
                            compositeDataObj.normalizationFactor[self.globalSettings.normalization] : 1))
                }
            };
            if (ymin === 0 && ymax === 0) {
                ymin = -1;
                ymax = 1
            };

            if (changeX) {
                self.changeXmin(xmin);
                self.changeXmax(xmax)
            };
            if (changeY) {
                self.changeYmin(ymin);
                self.changeYmax(ymax)
            };

            resolve()
        })
    }

    addHorizontalReferenceLine(y, color, linewidth, linestyle, fontSize, fontColor, textOrientation, labelOffset) {
        const referenceLineObj = {
            y: y,
            color: color,
            linewidth: linewidth,
            linestyle: linestyle,
            fontSize: fontSize,
            fontColor: fontColor,
            textOrientation: textOrientation,
            labelOffset: labelOffset
        };
        this.referenceLines.horizontalLines.push(referenceLineObj);

        return referenceLineObj
    }

    removeHorizontalReferenceLine(idx) {
        this.referenceLines.horizontalLines.splice(idx, 1)
    }

    addVerticalReferenceLine(x, color, linewidth, linestyle, fontSize, fontColor, textOrientation, labelOffset) {
        const referenceLineObj = {
            x: x,
            color: color,
            linewidth: linewidth,
            linestyle: linestyle,
            fontSize: fontSize,
            fontColor: fontColor,
            textOrientation: textOrientation,
            labelOffset: labelOffset
        };
        this.referenceLines.verticalLines.push(referenceLineObj);

        return referenceLineObj
    }

    removeVerticalReferenceLine(idx) {
        this.referenceLines.verticalLines.splice(idx, 1)
    }
    
    async importDataFromJSON(file, local) {
        const self = this;
        return new Promise(async function(resolve_, reject_) {
            const data = await new Promise(function(resolve, reject) {
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        resolve(JSON.parse(reader.result))
                    } catch (e) {
                        alert("Invalid JSON file");
                        reject()
                    }
                };
                reader.onerror = function() {
                    reject()
                };
                reader.readAsText(file)
            });
            if (data.globalSettings && data.compositeData) {
                data.globalSettings.xmin = typeof data.globalSettings.xmin === "number" ? data.globalSettings.xmin : -500;
                data.globalSettings.xmax = typeof data.globalSettings.xmax === "number" ? data.globalSettings.xmax : 500;
                data.globalSettings.ymin = typeof data.globalSettings.ymin === "number" ? data.globalSettings.ymin : -1;
                data.globalSettings.ymax = typeof data.globalSettings.ymax === "number" ? data.globalSettings.ymax : 1;
                data.globalSettings.symmetricY = typeof data.globalSettings.symmetricY === "boolean" ? data.globalSettings.symmetricY : true;
                data.globalSettings.lockAxes = typeof data.globalSettings.lockAxes === "boolean" ? data.globalSettings.lockAxes : false;
                data.globalSettings.minOpacity = typeof data.globalSettings.minOpacity === "number" ? data.globalSettings.minOpacity : .5;
                data.globalSettings.maxOpacity = typeof data.globalSettings.maxOpacity === "number" ? data.globalSettings.maxOpacity : 1;
                data.globalSettings.smoothing = typeof data.globalSettings.smoothing === "number" ? data.globalSettings.smoothing : 7;
                data.globalSettings.bpShift = typeof data.globalSettings.bpShift === "number" ? data.globalSettings.bpShift : 0;
                data.globalSettings.backdropColor = typeof data.globalSettings.backdropColor === "string" ? data.globalSettings.backdropColor : "#FFFFFF";
                data.globalSettings.backdropOpacity = typeof data.globalSettings.backdropOpacity === "number" ? data.globalSettings.backdropOpacity : 1;
                data.globalSettings.combined = typeof data.globalSettings.combined === "boolean" ? data.globalSettings.combined : false;
                data.globalSettings.colorTrace = typeof data.globalSettings.colorTrace === "boolean" ? data.globalSettings.colorTrace : false;
                data.globalSettings.enableTooltip = typeof data.globalSettings.enableTooltip === "boolean" ? data.globalSettings.enableTooltip : true;
                data.globalSettings.showLegend = typeof data.globalSettings.showLegend === "boolean" ? data.globalSettings.showLegend : true;
                data.globalSettings.normalization = typeof data.globalSettings.normalization === "string" ? data.globalSettings.normalization : "none";
                data.globalSettings.labels = typeof data.globalSettings.labels === "object" ? data.globalSettings.labels : {title: "Composite plot", xlabel: "Position (bp)", ylabel: "Occupancy (AU)"};
                data.globalSettings.labels.title = typeof data.globalSettings.labels.title === "string" ? data.globalSettings.labels.title : "Composite plot";
                data.globalSettings.labels.xlabel = typeof data.globalSettings.labels.xlabel === "string" ? data.globalSettings.labels.xlabel : "Position (bp)";
                data.globalSettings.labels.ylabel = typeof data.globalSettings.labels.ylabel === "string" ? data.globalSettings.labels.ylabel : "Occupancy (AU)";
                self.globalSettings = data.globalSettings;

                self.fileData = data.fileData;

                if (data.bedObj) {
                    self.bedObj = data.bedObj
                } else {
                    self.bedObj = {
                        reference_points: [],
                        radius: 500,
                        file_name: "No BED loaded",
                        skipped_lines_list: [],
                    }
                };

                if (local) {
                    self.compositeData = [];
                    for (let idx = 0; idx < data.compositeData.length; idx++) {
                        const compositeObj = new compositeObject(data.compositeData[idx]);
                        compositeObj.updateData();
                        self.compositeData.push(compositeObj)
                    };

                    self.legendOrder = data.legendOrder ? data.legendOrder : [...data.compositeData.keys()]
                } else {
                    const targets_set = new Set(Object.keys(targetSelectorObj.targets_object));
                    self.compositeData = [];
                    self.legendOrder = data.legendOrder ? data.legendOrder : [...data.compositeData.keys()];
                    for (let idx = 0; idx < data.compositeData.length; idx++) {
                        if (targets_set.has(data.compositeData[idx].name)) {
                            const compositeObj = new compositeObject({idx: idx, ...data.compositeData[idx]});
                            self.compositeData.push(compositeObj)
                        } else {
                            for (let j = self.legendOrder.length - 1; j >= 0; j--) {
                                if (self.legendOrder[j] > idx) {
                                    self.legendOrder[j]--
                                } else if (self.legendOrder[j] === idx) {
                                    self.legendOrder.splice(j, 1)
                                }
                            }
                        }
                    };

                    await Promise.all(self.compositeData.map(d => d.fetchPileup(self.bedObj.reference_points, self.bedObj.radius)));
                    self.compositeData.forEach(function(compositeDataObj) {
                        compositeDataObj.ids.forEach(function(id) {
                            self.fileData[id] = {
                                xmin: compositeDataObj.xmin,
                                xmax: compositeDataObj.xmax,
                                sense: compositeDataObj.sense,
                                anti: compositeDataObj.anti
                            }
                        })
                    })
                };

                if (data.referenceLines) {
                    for (const lineObj of data.referenceLines.horizontalLines) {
                        lineObj.y = lineObj.y || 0;
                        lineObj.color = lineObj.color || "#FF0000";
                        lineObj.linewidth = typeof lineObj.linewidth === "number" ? lineObj.linewidth : 1;
                        lineObj.linestyle = lineObj.linestyle || "solid";
                        lineObj.fontSize = typeof lineObj.fontSize === "number" ? lineObj.fontSize : 6;
                        lineObj.fontColor = lineObj.fontColor || "#FF0000";
                        lineObj.textOrientation = lineObj.textOrientation || "horizontal";
                        lineObj.labelOffset = typeof lineObj.labelOffset === "number" ? lineObj.labelOffset : 10
                    };
                    for (const lineObj of data.referenceLines.verticalLines) {
                        lineObj.x = lineObj.x || 0;
                        lineObj.color = lineObj.color || "#FF0000";
                        lineObj.linewidth = typeof lineObj.linewidth === "number" ? lineObj.linewidth : 1;
                        lineObj.linestyle = lineObj.linestyle || "solid";
                        lineObj.fontSize = typeof lineObj.fontSize === "number" ? lineObj.fontSize : 6;
                        lineObj.fontColor = lineObj.fontColor || "#FF0000";
                        lineObj.textOrientation = lineObj.textOrientation || "horizontal";
                        lineObj.labelOffset = typeof lineObj.labelOffset === "number" ? lineObj.labelOffset : 10
                    };
                    self.referenceLines = data.referenceLines
                } else {
                    self.referenceLines = {
                        horizontalLines: [],
                        verticalLines: [{
                            x: 0,
                            color: "#999999",
                            linewidth: 1,
                            linestyle: "dashed",
                            fontSize: 14,
                            fontColor: "#000000",
                            textOrientation: "horizontal",
                            labelOffset: 15
                        }]
                    }
                };

                if (data.nucleosomeSlider) {
                    self.nucleosomeSlider = data.nucleosomeSlider
                } else {
                    self.nucleosomeSlider = {
                        x: 0,
                        lines: []
                    }
                };

                resolve_()
            } else {
                alert("JSON file does not contain the required data");
                reject_()
            }
        })
    }

    exportDataAsJSON() {
        const a = document.createElement("a"),
            e = new MouseEvent("click"),
            self = this;
        a.download = "composite_plot_config.json";
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(
            {
                globalSettings: this.globalSettings,
                fileData: this.fileData,
                compositeData: this.compositeData,
                legendOrder: this.legendOrder,
                referenceLines: this.referenceLines,
                nucleosomeSlider: this.nucleosomeSlider,
                bedObj: this.bedObj
            },
            null, 4
        ));
        a.dispatchEvent(e)
    }
}