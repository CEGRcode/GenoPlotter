import json
import xml.dom.minidom as dom
import math
import argparse

#Python implementation of https://github.com/d3/d3-array/blob/main/src/ticks.js
e10 = math.sqrt(50)
e5 = math.sqrt(10)
e2 = math.sqrt(2)

def tickSpec(start, stop, count=10):
    step = (stop - start) / max(0, count)
    power = math.floor(math.log10(step))
    error = step / math.pow(10, power)
    factor = 10 if error >= e10 else (5 if error >= e5 else (2 if error >= e2 else 1))
    if power < 0:
        inc = pow(10, -power) / factor
        i1 = round(start * inc)
        i2 = round(stop * inc)
        if i1 / inc < start: i1 += 1
        if i2 / inc > stop: i2 -= 1
        inc = -inc
    else:
        inc = pow(10, power) * factor
        i1 = round(start / inc)
        i2 = round(stop / inc)
        if i1 * inc < start: i1 += 1
        if i2 * inc > stop: i2 -= 1
    if i2 < i1 and 0.5 <= count and count < 2:
        return tickSpec(start, stop, count * 2)
    return i1, i2, inc

def ticks(start, stop, count=10):
    if not count > 0:
        return []
    if start == stop:
        return [start]
    reverse = stop < start
    i1, i2, inc = tickSpec(stop, start, count) if reverse else tickSpec(start, stop, count)
    if not i2 >= i1:
        return []
    n = i2 - i1 + 1
    if reverse:
        if inc < 0:
            return [(i2 - i) / -inc for i in range(n)]
        else:
            return [(i2 - i) * inc for i in range(n)]
    else:
        if inc < 0:
            return [(i1 + i) / -inc for i in range(n)]
        else:
            return [(i1 + i) * inc for i in range(n)]

def linearScale(domain, range):
    def scale(val):
        return (val - domain[0]) * (range[1] - range[0]) / (domain[1] - domain[0]) + range[0]
    return scale

def roundUpWithPrecision(value, precision=2):
    absValue = abs(value)
    sign = 1 if value > 0 else (-1 if value < 0 else 0)
    if absValue == 0:
        return 0
    factor = pow(10, math.floor(math.log10(absValue)) - precision + 1)
    return math.ceil(absValue / factor) * factor * sign

def slidingWindow(vec, window):
    if len(vec) < window:
        return []
    val = sum(vec[:window]) / window
    newVec = [val]
    for i in range(len(vec) - window):
        val += (vec[i + window] - vec[i]) / window
        newVec.append(val)
    return newVec

lineStyles = {
    'solid': '0',
    'dashed': '5, 5',
    'dotted': '2, 1'
}

def genoplotter_json2svg(dataObj, width=500, height=300, margins={'top': 30, 'right': 190, 'bottom': 35, 'left': 60},
                         with_labels=True, with_reference_lines=True):
    left_bound = margins['left']
    right_bound = width - margins['right']
    top_bound = margins['top']
    bottom_bound = height - margins['bottom']

    globalSettings = dataObj['globalSettings']
    if globalSettings['combined']:
        ymin = 0
        ymax = roundUpWithPrecision(globalSettings['ymax'] - globalSettings['ymin'])
    elif globalSettings['symmetricY']:
        absy = roundUpWithPrecision(max(-globalSettings['ymin'], globalSettings['ymax']))
        ymin, ymax = -absy, absy
    else:
        ymin, ymax = roundUpWithPrecision(globalSettings['ymin']), roundUpWithPrecision(globalSettings['ymax'])

    xscale = linearScale([globalSettings['xmin'], globalSettings['xmax']], [left_bound, right_bound])
    yscale = linearScale([ymin, ymax], [bottom_bound, top_bound])

    document = dom.Document()
    svg = document.appendChild(document.createElement('svg'))
    svg.setAttribute('baseProfile', 'full')
    svg.setAttribute('version', '1.1')
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('font-family', 'Helvetica')
    svg.setAttribute('viewBox', '0 0 {} {}'.format(width, height))
    
    compositesGroup = svg.appendChild(document.createElement('g'))
    for idx, compositeObj in reversed(list(enumerate(dataObj['compositeData']))):
        if (len(compositeObj['sense']) == 0 and len(compositeObj['anti']) == 0) or \
            (compositeObj['hideSense'] and compositeObj['hideAnti']):
            continue

        minOpacity = compositeObj['minOpacity'] if compositeObj['minOpacity'] is not None else globalSettings['minOpacity']
        maxOpacity = compositeObj['maxOpacity'] if compositeObj['maxOpacity'] is not None else globalSettings['maxOpacity']
        primaryColor = compositeObj['primaryColor']
        secondaryColor = compositeObj['secondaryColor'] or compositeObj['primaryColor'] if \
            globalSettings['separateColors'] and not globalSettings['combined'] else compositeObj['primaryColor']
        smoothing = compositeObj['smoothing'] if compositeObj['smoothing'] is not None else globalSettings['smoothing']
        smoothShift = (smoothing - 1) // 2
        bpShift = compositeObj['bpShift'] if compositeObj['bpShift'] else globalSettings['bpShift']
        scale = compositeObj['scale'] * (compositeObj['normalizationFactor'][globalSettings['normalization']] if \
                                         'normalizationFactor' in compositeObj and 'normalization' in globalSettings and \
                                          globalSettings['normalization'] != 'none' else 1)
        shiftOccupancy = compositeObj['shiftOccupancy'] if 'shiftOccupancy' in compositeObj else 0

        compositeGroup = compositesGroup.appendChild(document.createElement('g'))
        defs = compositeGroup.appendChild(document.createElement('defs'))
        topGradient = defs.appendChild(document.createElement('linearGradient'))
        topGradient.setAttribute('id', 'composite-gradient-top-{}'.format(idx))
        topGradient.setAttribute('x1', '0%')
        topGradient.setAttribute('x2', '0%')
        topGradient.setAttribute('y1', '0%')
        topGradient.setAttribute('y2', '100%')
        stop1 = topGradient.appendChild(document.createElement('stop'))
        stop1.setAttribute('offset', '0')
        stop1.setAttribute('stop-color', primaryColor)
        stop1.setAttribute('stop-opacity', str(maxOpacity))
        stop2 = topGradient.appendChild(document.createElement('stop'))
        stop2.setAttribute('offset', '1')
        stop2.setAttribute('stop-color', primaryColor)
        stop2.setAttribute('stop-opacity', str(minOpacity))

        if globalSettings['combined']:
            if bpShift > 0:
                shiftedSense = compositeObj['sense'][:-2 * bpShift]
                shiftedAnti = compositeObj['anti'][2 * bpShift:]
            else:
                shiftedSense = compositeObj['sense'][2 * bpShift:]
                shiftedAnti = compositeObj['anti'][:len(compositeObj['anti']) - 2 * bpShift]
            combinedOccupancy = shiftedSense + shiftedAnti
            smoothedOccupancy = slidingWindow(combinedOccupancy, smoothing)
            smoothedXmin = compositeObj['xmin'] + abs(bpShift) + smoothShift
            smoothedXmax = compositeObj['xmax'] - abs(bpShift) - smoothShift
            truncatedXmin = max(globalSettings['xmin'], smoothedXmin)
            truncatedXmax = min(globalSettings['xmax'], smoothedXmax)
            truncatedOccupancy = smoothedOccupancy[truncatedXmin - smoothedXmin:
                len(smoothedOccupancy) - smoothedXmax + truncatedXmax]
            scaledOccupancy = [occ * scale + shiftOccupancy for occ in truncatedOccupancy]
            d = ''.join('M {} {} '.format(xscale(truncatedXmin + i), yscale(y)) for i, y in enumerate(scaledOccupancy))

            compositePath = compositeGroup.appendChild(document.createElement('path'))
            compositePath.setAttribute('fill', 'url(#composite-gradient-top-{})'.format(idx))
            if not globalSettings['colorTrace']:
                compositePath.setAttribute('stroke', '#FFFFFF')
            compositePath.setAttribute('stroke-width', '1')
            compositePath.setAttribute('d', 'M {} {} {} M {} {} Z'.format(xscale(truncatedXmin),
                yscale(scaledOccupancy[0]), d, xscale(truncatedXmax), yscale(scaledOccupancy[-1])))
            
            compositeLine = compositeGroup.appendChild(document.createElement('path'))
            compositeLine.setAttribute('stroke', primaryColor if globalSettings['colorTrace'] else '#000000')
            compositeLine.setAttribute('stroke-width', '.5')
            compositeLine.setAttribute('d', d)
        else:
            bottomGradient = defs.appendChild(document.createElement('linearGradient'))
            bottomGradient.setAttribute('id', 'composite-gradient-bottom-{}'.format(idx))
            bottomGradient.setAttribute('x1', '0%')
            bottomGradient.setAttribute('x2', '0%')
            bottomGradient.setAttribute('y1', '100%')
            bottomGradient.setAttribute('y2', '0%')
            stop1 = bottomGradient.appendChild(document.createElement('stop'))
            stop1.setAttribute('offset', '0')
            stop1.setAttribute('stop-color', secondaryColor)
            stop1.setAttribute('stop-opacity', str(maxOpacity))
            stop2 = bottomGradient.appendChild(document.createElement('stop'))
            stop2.setAttribute('offset', '1')
            stop2.setAttribute('stop-color', secondaryColor)
            stop2.setAttribute('stop-opacity', str(minOpacity))

            smoothedSense = slidingWindow(compositeObj['sense'], smoothing)
            smoothedAnti = slidingWindow(compositeObj['anti'], smoothing)
            truncatedXminSense = max(globalSettings['xmin'], compositeObj['xmin'] + smoothShift + bpShift)
            truncatedXmaxSense = min(globalSettings['xmax'], compositeObj['xmax'] - smoothShift + bpShift)
            truncatedXminAnti = max(globalSettings['xmin'], compositeObj['xmin'] + smoothShift - bpShift)
            truncatedXmaxAnti = min(globalSettings['xmax'], compositeObj['xmax'] - smoothShift - bpShift)
            truncatedSense = smoothedSense[truncatedXminSense - compositeObj['xmin'] - smoothShift - bpShift:
                len(smoothedSense) - compositeObj['xmax'] + truncatedXmaxSense + smoothShift - bpShift]
            scaledSense = [occ * scale + shiftOccupancy for occ in truncatedSense]
            truncatedAnti = smoothedAnti[truncatedXminAnti - compositeObj['xmin'] - smoothShift + bpShift:
                len(smoothedAnti) - compositeObj['xmax'] + truncatedXmaxAnti + smoothShift + bpShift]
            scaledAnti = [occ * scale + shiftOccupancy for occ in truncatedAnti]

            if not compositeObj['hideSense']:
                compositeLineTop = compositeGroup.appendChild(document.createElement('path'))
                compositeLineTop.setAttribute('fill', 'none')
                compositeLineTop.setAttribute('stroke-width', '1')
                compositePathTop = compositeGroup.appendChild(document.createElement('path'))
                compositePathTop.setAttribute('fill', 'url(#composite-gradient-top-{})'.format(idx))
                compositePathTop.setAttribute('stroke', primaryColor if globalSettings['colorTrace'] else '#000000')
                compositePathTop.setAttribute('stroke-width', '.5')

            if not compositeObj['hideAnti']:
                compositeLineBottom = compositeGroup.appendChild(document.createElement('path'))
                compositeLineBottom.setAttribute('fill', 'none')
                compositeLineBottom.setAttribute('stroke-width', '1')
                compositePathBottom = compositeGroup.appendChild(document.createElement('path'))
                compositePathBottom.setAttribute('fill', 'url(#composite-gradient-bottom-{})'.format(idx))
                compositePathBottom.setAttribute('stroke', globalSettings['secondaryColor'] if globalSettings['colorTrace'] else '#000000')
                compositePathBottom.setAttribute('stroke-width', '.5')
            
            if not globalSettings['colorTrace']:
                compositeLineTop.setAttribute('stroke', '#FFFFFF')
                compositeLineBottom.setAttribute('stroke', '#FFFFFF')

            if not compositeObj['swap']:
                if not compositeObj['hideSense']:
                    dTop = ''.join('L{:.3f},{:.3f}'.format(xscale(truncatedXminSense + i), yscale(y)) for i, y in enumerate(scaledSense))
                    compositePathTop.setAttribute('d', 'M{:.3f},{:.3f}{}L{:.3f},{:.3f}Z'.format(xscale(truncatedXminSense),
                        yscale(0), dTop, xscale(truncatedXmaxSense), yscale(0)))
                    compositeLineTop.setAttribute('d', 'M{}Z'.format(dTop[1:]))
                
                if not compositeObj['hideAnti']:
                    dBottom = ''.join('L{:.3f},{:.3f}'.format(xscale(truncatedXminAnti + i), yscale(-y)) for i, y in enumerate(scaledAnti))
                    compositePathBottom.setAttribute('d', 'M{:.3f},{:.3f}{}L{:.3f},{:.3f}Z'.format(xscale(truncatedXminAnti),
                        yscale(0), dBottom, xscale(truncatedXmaxAnti), yscale(0)))
                    compositeLineBottom.setAttribute('d', 'M{}Z'.format(dBottom[1:]))
            else:
                if not compositeObj['hideAnti']:
                    dTop = ''.join('L{:.3f},{:.3f}'.format(xscale(truncatedXminAnti + i), yscale(y)) for i, y in enumerate(scaledAnti))
                    compositePathTop.setAttribute('d', 'M{:.3f},{:.3f}{}L{:.3f},{:.3f}Z'.format(xscale(truncatedXminAnti),
                        yscale(0), dTop, xscale(truncatedXmaxAnti), yscale(0)))
                    compositeLineTop.setAttribute('d', 'M{}Z'.format(dTop[1:]))
                
                if not compositeObj['hideSense']:
                    dBottom = ''.join('L{:.3f},{:.3f}'.format(xscale(truncatedXminSense + i), yscale(-y)) for i, y in enumerate(scaledSense))
                    compositePathBottom.setAttribute('d', 'M{:.3f},{:.3f}{}L{:.3f},{:.3f}Z'.format(xscale(truncatedXminSense),
                        yscale(0), dBottom, xscale(truncatedXmaxSense), yscale(0)))
                    compositeLineBottom.setAttribute('d', 'M{}Z'.format(dBottom[1:]))

    xticks = ticks(globalSettings['xmin'], globalSettings['xmax'])
    yticks = ticks(ymin, ymax)

    axisTop = svg.appendChild(document.createElement('g'))
    axisTop.setAttribute('transform', 'translate(0 {})'.format(bottom_bound))
    axisTop.setAttribute('fill', 'none')
    axisTop.setAttribute('stroke', '#000000')
    axisTop.appendChild(document.createElement('path')).setAttribute('d', 'M{},-6V0H{}V-6'.format(margins['left'], width - margins['right']))
    axisBottom = svg.appendChild(document.createElement('g'))
    axisBottom.setAttribute('transform', 'translate(0 {})'.format(top_bound))
    axisBottom.setAttribute('fill', 'none')
    axisBottom.setAttribute('stroke', '#000000')
    axisBottom.appendChild(document.createElement('path')).setAttribute('d', 'M{},6V0H{}V6'.format(margins['left'], width - margins['right']))
    for x in xticks:
        topTickGroup = axisTop.appendChild(document.createElement('g'))
        topTickGroup.setAttribute('transform', 'translate({},0)'.format(xscale(x)))
        topTickGroup.appendChild(document.createElement('line')).setAttribute('y2', '-6')

        bottomTickGroup = axisBottom.appendChild(document.createElement('g'))
        bottomTickGroup.setAttribute('transform', 'translate({},0)'.format(xscale(x)))
        bottomTickGroup.appendChild(document.createElement('line')).setAttribute('y2', '6')
    
    axisRight = svg.appendChild(document.createElement('g'))
    axisRight.setAttribute('transform', 'translate({} 0)'.format(left_bound))
    axisRight.setAttribute('fill', 'none')
    axisRight.setAttribute('stroke', '#000000')
    axisRight.appendChild(document.createElement('path')).setAttribute('d', 'M6,{}H0V{}H6'.format(height - margins['bottom'], margins['top']))
    axisLeft = svg.appendChild(document.createElement('g'))
    axisLeft.setAttribute('transform', 'translate({} 0)'.format(right_bound))
    axisLeft.setAttribute('fill', 'none')
    axisLeft.setAttribute('stroke', '#000000')
    axisLeft.appendChild(document.createElement('path')).setAttribute('d', 'M-6,{}H0V{}H-6'.format(height - margins['bottom'], margins['top']))
    for y in yticks:
        rightTickGroup = axisRight.appendChild(document.createElement('g'))
        rightTickGroup.setAttribute('transform', 'translate(0,{})'.format(yscale(y)))
        rightTickGroup.appendChild(document.createElement('line')).setAttribute('x2', '6')

        leftTickGroup = axisLeft.appendChild(document.createElement('g'))
        leftTickGroup.setAttribute('transform', 'translate(0,{})'.format(yscale(y)))
        leftTickGroup.appendChild(document.createElement('line')).setAttribute('x2', '-6')

    if not globalSettings['combined']:
        midaxisTop = svg.appendChild(document.createElement('g'))
        midaxisTop.setAttribute('transform', 'translate(0 {})'.format(yscale(0)))
        midaxisTop.setAttribute('fill', 'none')
        midaxisTop.setAttribute('stroke', '#000000')
        midaxisTop.appendChild(document.createElement('path')).setAttribute('d', 'M{},-6V0H{}V-6'.format(margins['left'], width - margins['right']))
        midaxisBottom = svg.appendChild(document.createElement('g'))
        midaxisBottom.setAttribute('transform', 'translate(0 {})'.format(yscale(0)))
        midaxisBottom.setAttribute('fill', 'none')
        midaxisBottom.setAttribute('stroke', '#000000')
        midaxisBottom.appendChild(document.createElement('path')).setAttribute('d', 'M{},6V0H{}V6'.format(margins['left'], width - margins['right']))
        for x in xticks:
            topTickGroup = midaxisTop.appendChild(document.createElement('g'))
            topTickGroup.setAttribute('transform', 'translate({},0)'.format(xscale(x)))
            topTickGroup.appendChild(document.createElement('line')).setAttribute('y2', '-6')

            bottomTickGroup = midaxisBottom.appendChild(document.createElement('g'))
            bottomTickGroup.setAttribute('transform', 'translate({},0)'.format(xscale(x)))
            bottomTickGroup.appendChild(document.createElement('line')).setAttribute('y2', '6')

    if with_labels:
        xminLabel = svg.appendChild(document.createElement('text'))
        xminLabel.setAttribute('x', str(margins['left']))
        xminLabel.setAttribute('y', str(height - margins['bottom'] + 15))
        xminLabel.setAttribute('text-anchor', 'middle')
        xminLabel.setAttribute('font-size', '14px')
        xminLabel.appendChild(document.createTextNode(str(globalSettings['xmin'])))
        xmaxLabel = svg.appendChild(document.createElement('text'))
        xmaxLabel.setAttribute('x', str(width - margins['right']))
        xmaxLabel.setAttribute('y', str(height - margins['bottom'] + 15))
        xmaxLabel.setAttribute('text-anchor', 'middle')
        xmaxLabel.setAttribute('font-size', '14px')
        xmaxLabel.appendChild(document.createTextNode(str(globalSettings['xmax'])))

        yminLabel = svg.appendChild(document.createElement('text'))
        yminLabel.setAttribute('x', str(margins['left'] - 10))
        yminLabel.setAttribute('y', str(height - margins['bottom']))
        yminLabel.setAttribute('text-anchor', 'end')
        yminLabel.setAttribute('font-size', '14px')
        yminLabel.appendChild(document.createTextNode('{:.02e}'.format('{:.2g}'.format(ymin)) if len('{:.2g}'.format(ymin)) > 7 else '{:.2g}'.format(ymin)))
        ymaxLabel = svg.appendChild(document.createElement('text'))
        ymaxLabel.setAttribute('x', str(margins['left'] - 10))
        ymaxLabel.setAttribute('y', str(margins['top'] + 10))
        ymaxLabel.setAttribute('text-anchor', 'end')
        ymaxLabel.setAttribute('font-size', '14px')
        ymaxLabel.appendChild(document.createTextNode('{:.02e}'.format('{:.2g}'.format(ymax)) if len('{:.2g}'.format(ymax)) > 7 else '{:.2g}'.format(ymax)))

        if globalSettings['labels']['title']:
            title = svg.appendChild(document.createElement('g')).appendChild(document.createElement('text'))
            title.setAttribute('x', str((margins['left'] + width - margins['right']) / 2))
            title.setAttribute('y', '20')
            title.setAttribute('text-anchor', 'middle')
            title.setAttribute('font-size', '16px')
            title.appendChild(document.createTextNode(globalSettings['labels']['title']))
        if globalSettings['labels']['xlabel']:
            xlabel = svg.appendChild(document.createElement('g')).appendChild(document.createElement('text'))
            xlabel.setAttribute('x', str((margins['left'] + width - margins['right']) / 2))
            xlabel.setAttribute('y', str(height - 5))
            xlabel.setAttribute('text-anchor', 'middle')
            xlabel.setAttribute('font-size', '14px')
            xlabel.appendChild(document.createTextNode(globalSettings['labels']['xlabel']))
        if globalSettings['labels']['ylabel']:
            ylabel = svg.appendChild(document.createElement('g')).appendChild(document.createElement('text'))
            ylabel.setAttribute('x', str(margins['left'] - 18))
            ylabel.setAttribute('y', str((margins['top'] + height - margins['bottom']) / 2))
            ylabel.setAttribute('transform', 'rotate(-90 {} {})'.format(margins['left'] - 18, (margins['top'] + height - margins['bottom']) / 2))
            ylabel.setAttribute('text-anchor', 'middle')
            ylabel.setAttribute('font-size', '14px')
            ylabel.appendChild(document.createTextNode(globalSettings['labels']['ylabel']))
    
        if globalSettings['showLegend']:
            legend = svg.appendChild(document.createElement('g'))
            legend.setAttribute('transform', 'translate({} {})'.format(width - margins['right'] + 25, margins['top']))
            
            i = 0
            for compositeIdx in dataObj['legendOrder']:
                compositeObj = dataObj['compositeData'][compositeIdx]
                if (compositeObj['hideSense'] and compositeObj['hideAnti']) or (len(compositeObj['sense']) == 0 and len(compositeObj['anti']) == 0):
                    continue

                primaryColor = compositeObj['primaryColor']
                secondaryColor = compositeObj['secondaryColor'] or compositeObj['primaryColor'] if \
                    globalSettings['separateColors'] and not globalSettings['combined'] else compositeObj['primaryColor']
                
                legendElement = legend.appendChild(document.createElement('g'))
                legendElement.setAttribute('transform', 'translate(0 {})'.format(24 * i))

                rectOutline = legendElement.appendChild(document.createElement('rect'))
                rectOutline.setAttribute('width', '15')
                rectOutline.setAttribute('height', '15')
                rectOutline.setAttribute('stroke', '#000000')
                rectOutline.setAttribute('stroke-width', '1')
                rectOutline.setAttribute('fill', 'none')
                if not compositeObj['hideSense']:
                    senseColor = legendElement.appendChild(document.createElement('polygon'))
                    senseColor.setAttribute('points', '0,0 15,0 15,15 0,15')
                    senseColor.setAttribute('fill', primaryColor)
                if not compositeObj['hideAnti']:
                    antiColor = legendElement.appendChild(document.createElement('polygon'))
                    antiColor.setAttribute('points', '15,0 15,15 0,15')
                    antiColor.setAttribute('fill', secondaryColor)
                
                legendLabel = legendElement.appendChild(document.createElement('text'))
                legendLabel.setAttribute('x', '20')
                legendLabel.setAttribute('y', '10')
                legendLabel.setAttribute('font-size', '10px')
                legendLabel.appendChild(document.createTextNode(compositeObj['name']))

                i += 1
        
        if with_reference_lines:
            horizontalLineGroup = svg.appendChild(document.createElement('g'))
            for lineObj in dataObj['referenceLines']['horizontalLines']:
                if ymin < lineObj['y'] < ymax:
                    stroke = lineObj['color'] if 'color' in lineObj else '#999999'
                    lineWidth = lineObj['linewidth'] if 'linewidth' in lineObj else 1
                    lineStyle = lineObj['linestyle'] if 'linestyle' in lineObj else 'dashed'
                    labelOffset = lineObj['labelOffset'] if 'labelOffset' in lineObj else 10
                    fontSize = lineObj['fontSize'] if 'fontSize' in lineObj else 6
                    fontColor = lineObj['fontColor'] if 'fontColor' in lineObj else '#000000'

                    horizontalLine = horizontalLineGroup.appendChild(document.createElement('line'))
                    horizontalLine.setAttribute('stroke', str(stroke))
                    horizontalLine.setAttribute('stroke-width', str(lineWidth))
                    horizontalLine.setAttribute('stroke-dasharray', lineStyles[lineStyle])
                    horizontalLine.setAttribute('opacity', '.7')
                    horizontalLine.setAttribute('x1', str(margins['left']))
                    horizontalLine.setAttribute('x2', str(width - margins['right']))
                    horizontalLine.setAttribute('y1', str(yscale(lineObj['y'])))
                    horizontalLine.setAttribute('y2', str(yscale(lineObj['y'])))

                    horizontalLineLabel = horizontalLineGroup.appendChild(document.createElement('text'))
                    horizontalLineLabel.setAttribute('text-anchor', 'middle')
                    horizontalLineLabel.setAttribute('x', str(width - margins['right'] + labelOffset))
                    horizontalLineLabel.setAttribute('y', str(yscale(lineObj['y']) + 2))
                    if lineObj['textOrientation'] == 'vertical':
                        horizontalLineLabel.setAttribute('transform', 'rotate(-90 {} {})'.format(
                            width - margins['right'] + labelOffset,
                            yscale(lineObj['y'] + 2)
                        ))
                    horizontalLineLabel.setAttribute('font-size', '{}px'.format(fontSize))
                    horizontalLineLabel.setAttribute('fill', fontColor)
                    horizontalLineLabel.appendChild(document.createTextNode(str(lineObj['y'])))

            verticalLineGroup = svg.appendChild(document.createElement('g'))
            for lineObj in dataObj['referenceLines']['verticalLines']:
                if globalSettings['xmin'] < lineObj['x'] < globalSettings['xmax']:
                    stroke = lineObj['color'] if 'color' in lineObj else '#999999'
                    lineWidth = lineObj['linewidth'] if 'linewidth' in lineObj else 1
                    lineStyle = lineObj['linestyle'] if 'linestyle' in lineObj else 'dashed'
                    labelOffset = lineObj['labelOffset'] if 'labelOffset' in lineObj else 10
                    fontSize = lineObj['fontSize'] if 'fontSize' in lineObj else 6
                    fontColor = lineObj['fontColor'] if 'fontColor' in lineObj else '#000000'

                    verticalLine = verticalLineGroup.appendChild(document.createElement('line'))
                    verticalLine.setAttribute('stroke', str(stroke))
                    verticalLine.setAttribute('stroke-width', str(lineWidth))
                    verticalLine.setAttribute('stroke-dasharray', lineStyles[lineStyle])
                    verticalLine.setAttribute('opacity', '.7')
                    verticalLine.setAttribute('x1', str(xscale(lineObj['x'])))
                    verticalLine.setAttribute('x2', str(xscale(lineObj['x'])))
                    verticalLine.setAttribute('y1', str(margins['top']))
                    verticalLine.setAttribute('y2', str(height - margins['bottom']))

                    verticalLineLabel = verticalLineGroup.appendChild(document.createElement('text'))
                    verticalLineLabel.setAttribute('text-anchor', 'middle')
                    verticalLineLabel.setAttribute('x', str(xscale(lineObj['x'])))
                    verticalLineLabel.setAttribute('y', str(height - margins['bottom'] + labelOffset))
                    if lineObj['textOrientation'] == 'vertical':
                        verticalLineLabel.setAttribute('transform', 'rotate(-90 {} {})'.format(
                            xscale(lineObj['x']),
                            height - margins['bottom'] + labelOffset
                        ))
                    verticalLineLabel.setAttribute('font-size', '{}px'.format(fontSize))
                    verticalLineLabel.setAttribute('fill', fontColor)
                    verticalLineLabel.appendChild(document.createTextNode(str(lineObj['x'])))

    return document

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Create a plot from a json file')
    parser.add_argument('json', type=str, help='json file')
    parser.add_argument('--width', type=int, default=500, help='width of the plot')
    parser.add_argument('--height', type=int, default=300, help='height of the plot')
    parser.add_argument('--margin-top', type=int, default=30, help='top margin')
    parser.add_argument('--margin-bottom', type=int, default=35, help='bottom margin')
    parser.add_argument('--margin-left', type=int, default=60, help='left margin')
    parser.add_argument('--margin-right', type=int, default=190, help='right margin')
    parser.add_argument('--no-labels', action='store_true', help='do not include labels and legend in plot')
    parser.add_argument('--no-reference-lines', action='store_true', help='do not include reference lines')
    parser.add_argument('--output', type=str, default='genoplotter_plot.svg', help='output svg file')
    args = parser.parse_args()

    with open(args.json, 'r') as f:
        dataObj = json.load(f)
    
    doc = genoplotter_json2svg(dataObj, width=args.width, height=args.height,
        margins={'top': args.margin_top, 'bottom': args.margin_bottom,
                 'left': args.margin_left, 'right': args.margin_right},
        with_labels=not args.no_labels, with_reference_lines=not args.no_reference_lines)
    
    with open(args.output, 'w') as f:
        doc.writexml(f, addindent='\t', newl='\n')