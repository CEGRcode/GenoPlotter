const compositeObject = class {
    constructor({idx, name=null, forward_bw=null, reverse_bw=null, xmin=Infinity, xmax=-Infinity, sense=null,
        anti=null, primaryColor=null, secondaryColor=null, scale=1, normalizationFactor=1, minOpacity=null,
        maxOpacity=null, smoothing=null, bpShift=null, shiftOccupancy=0, hideSense=false, hideAnti=false,
        swap=false, sticky=false, ids=null}) {
        this.name = name || "Composite " + idx;
        this.forward_bw = forward_bw;
        this.reverse_bw = reverse_bw;
        this.xmin = xmin;
        this.xmax = xmax;
        this.sense = sense || [];
        this.anti = anti || [];
        this.primaryColor = primaryColor || defaultColors[idx % defaultColors.length];
        this.secondaryColor = secondaryColor;
        this.scale = scale;
        this.normalizationFactor = normalizationFactor;
        this.minOpacity = minOpacity;
        this.maxOpacity = maxOpacity;
        this.smoothing = smoothing;
        this.bpShift = bpShift;
        this.shiftOccupancy = shiftOccupancy;
        this.hideSense = hideSense;
        this.hideAnti = hideAnti;
        this.swap = swap;
        this.sticky = sticky;
        this.ids = ids || [];
        this.filesLoaded = this.ids.length
    }

    changeName(name) {
        this.name = name
    }

    changePrimaryColor(primaryColor) {
        this.primaryColor = primaryColor
    }

    changeSecondaryColor(secondaryColor) {
        this.secondaryColor = secondaryColor
    }

    changeScale(scale) {
        this.scale = scale
    }

    changeMinOpacity(minOpacity) {
        this.minOpacity = minOpacity
    }

    changeMaxOpacity(maxOpacity) {
        this.maxOpacity = maxOpacity
    }

    changeSmoothing(smoothing) {
        this.smoothing = smoothing
    }

    changeBpShift(bpShift) {
        this.bpShift = bpShift
    }

    changeShiftOccupancy(shiftOccupancy) {
        this.shiftOccupancy = shiftOccupancy
    }

    changeHideSense(hideSense) {
        this.hideSense = hideSense
    }

    changeHideAnti(hideAnti) {
        this.hideAnti = hideAnti
    }

    changeSwap(swap) {
        this.swap = swap
    }

    changeSticky(sticky) {
        this.sticky = sticky
    }

    changeBulkSettings(settings) {
        Object.assign(this, settings)
    }

    changeXmin(xmin) {
        this.xmin = xmin
    }

    changeXmax(xmax) {
        this.xmax = xmax
    }

    changeSense(sense) {
        this.sense = sense
    }

    changeAnti(anti) {
        this.anti = anti
    }

    async loadFiles(file_list) {
        const self = this;
        return new Promise(async function(resolve, reject) {
            const promiseArr = await Promise.allSettled(compositeLoaderObj.loadFiles(file_list));

            if (promiseArr.every(p => p.status == "rejected")) {
                self.clearData();
                reject("All loaded files invalid");
                return
            };

            for (const p of promiseArr) {
                if (p.status == "fulfilled") {
                    const id = p.value[0];
                    self.ids.push(id);
                    self.filesLoaded++
                }
            };

            if (promiseArr.some(p => p.value[1])) {
                dataObj.updateAllComposites()
            } else {
                self.updateData()
            };

            resolve()
        })
    }

    updateData() {
        // Get the minimum and maximum x values of the selected files and initialize the sense and anti arrays
        const xmin = Math.min(...this.ids.map(id => dataObj.fileData[id].xmin)),
            xmax = Math.max(...this.ids.map(id => dataObj.fileData[id].xmax)),
            sense = Array(xmax - xmin + 1).fill(0),
            anti = Array(xmax - xmin + 1).fill(0);
        
        // Add the sense and anti values of the selected files to the sense and anti arrays
        for (let x = xmin; x <= xmax; x++) {
            for (let id of this.ids) {
                const file_xmin = dataObj.fileData[id].xmin;
                sense[x - xmin] += dataObj.fileData[id].sense[x - file_xmin] || 0;
                anti[x - xmin] += dataObj.fileData[id].anti[x - file_xmin] || 0
            }
        };

        // Update the composite object
        this.changeXmin(xmin);
        this.changeXmax(xmax);
        this.changeSense(sense);
        this.changeAnti(anti);
        this.filesLoaded = this.ids.length
    }

    fetchPileup(reference_points, radius) {
        let self = this;
        return new Promise(async function(resolve) {
            const xmin = -radius,
                xmax = radius,
                res = await fetch("http://149.165.170.173/api/bigwig/pileup", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        forward: self.forward_bw,
                        reverse: self.reverse_bw,
                        ranges: reference_points
                    })
                }),
                data = await res.json();
            let sense, anti;
            if (dataObj.globalSettings.normalization) {
                sense = data.results.sense.map(d => d * self.normalizationFactor);
                anti = data.results.anti.map(d => d * self.normalizationFactor)
            } else {
                sense = data.results.sense;
                anti = data.results.anti
            };

            self.changeXmin(xmin);
            self.changeXmax(xmax);
            self.changeSense(sense);
            self.changeAnti(anti);

            resolve()
        })
    }

    clearData() {
        this.ids = [];
        this.filesLoaded = 0;
        
        this.changeXmin(Infinity);
        this.changeXmax(-Infinity);
        this.changeSense([]);
        this.changeAnti([])
    }
}