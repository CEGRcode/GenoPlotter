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

def genoplotter_json2svg(dataObj, width=500, height=300, margins={'top': 30, 'right': 190, 'bottom': 35, 'left': 60}):
    left_bound = margins['left']
    right_bound = width - margins['right']
    top_bound = margins['top']
    bottom_bound = height - margins['bottom']

    globalSettings = dataObj['globalSettings']
    if globalSettings['combined']:
        ymin = 0
        ymax = globalSettings['ymax'] - globalSettings['ymin']
    elif globalSettings['symmetricY']:
        absy = max(-globalSettings['ymin'], globalSettings['ymax'])
        ymin, ymax = -absy, absy
    else:
        ymin, ymax = globalSettings['ymin'], globalSettings['ymax']

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
    for idx, compositeObj in enumerate(dataObj['compositeData']):
        if (len(compositeObj['sense']) == 0 and len(compositeObj['anti']) == 0) or \
            (compositeObj['hideSense'] and compositeObj['hideAnti']):
            continue

        minOpacity = compositeObj['minOpacity'] if compositeObj['minOpacity'] is not None else globalSettings['minOpacity']
        maxOpacity = compositeObj['maxOpacity'] if compositeObj['maxOpacity'] is not None else globalSettings['maxOpacity']
        primaryColor = compositeObj['primaryColor']
        secondaryColor = compositeObj['secondaryColor'] or compositeObj['primaryColor'] if \
            globalSettings['separateColors'] and not globalSettings['combined'] else compositeObj['primaryColor']
        smoothing = compositeObj['smoothing'] if compositeObj['smoothing'] is not None else globalSettings['smoothing']
        smoothShift = (smoothing - 1) / 2
        bpShift = compositeObj['bpShift'] if compositeObj['bpShift'] else globalSettings['bpShift']
        scale = compositeObj['scale'] * (compositeObj['normalizationFactor'][globalSettings['normalization']] if \
                                         globalSettings['normalization'] != "none" else 1)

        compositeGroup = compositesGroup.appendChild(document.createElement('g'))

        if globalSettings['combined']:
            pass
        else:
            defs = compositeGroup.appendChild(document.createElement('defs'))
            topGradient = defs.appendChild(document.createElement('linearGradient'))
            topGradient.setAttribute('id', 'composite-gradient-top-{}'.format(idx))
            topGradient.setAttribute('x1', '0%')
            topGradient.setAttribute('x2', '0%')
            topGradient.setAttribute('y1', '0%')
            topGradient.setAttribute('y2', '100%')
            bottomGradient = defs.appendChild(document.createElement('linearGradient'))
            bottomGradient.setAttribute('id', 'composite-gradient-bottom-{}'.format(idx))
            bottomGradient.setAttribute('x1', '0%')
            bottomGradient.setAttribute('x2', '0%')
            bottomGradient.setAttribute('y1', '100%')
            bottomGradient.setAttribute('y2', '0%')

            topLine = compositeGroup.appendChild(document.createElement('path'))

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
        topTickGroup.append(document.createElement('line')).setAttribute('y2', '-6')

        bottomTickGroup = axisBottom.appendChild(document.createElement('g'))
        bottomTickGroup.setAttribute('transform', 'translate({},0)'.format(xscale(x)))
        bottomTickGroup.append(document.createElement('line')).setAttribute('y2', '6')
    
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
        rightTickGroup.append(document.createElement('line')).setAttribute('x2', '6')

        leftTickGroup = axisLeft.appendChild(document.createElement('g'))
        leftTickGroup.setAttribute('transform', 'translate(0,{})'.format(yscale(y)))
        leftTickGroup.append(document.createElement('line')).setAttribute('x2', '-6')

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
            topTickGroup.append(document.createElement('line')).setAttribute('y2', '-6')

            bottomTickGroup = midaxisBottom.appendChild(document.createElement('g'))
            bottomTickGroup.setAttribute('transform', 'translate({},0)'.format(xscale(x)))
            bottomTickGroup.append(document.createElement('line')).setAttribute('y2', '6')

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
    yminLabel.setAttribute('text-anchor', 'middle')
    yminLabel.setAttribute('font-size', '14px')
    yminLabel.appendChild(document.createTextNode('{:.02e}'.format(round(ymin, 2)) if len(str(round(ymin, 2))) > 7 else str(round(ymin, 2))))
    ymaxLabel = svg.appendChild(document.createElement('text'))
    ymaxLabel.setAttribute('x', str(margins['left'] - 10))
    ymaxLabel.setAttribute('y', str(margins['top'] + 10))
    ymaxLabel.setAttribute('text-anchor', 'middle')
    ymaxLabel.setAttribute('font-size', '14px')
    ymaxLabel.appendChild(document.createTextNode('{:.02e}'.format(round(ymax, 2)) if len(str(round(ymax, 2))) > 7 else str(round(ymax, 2))))

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
        xlabel.setAttribute('font-size', '16px')
        xlabel.appendChild(document.createTextNode(globalSettings['labels']['xlabel']))
    if globalSettings['labels']['ylabel']:
        ylabel = svg.appendChild(document.createElement('g')).appendChild(document.createElement('text'))
        ylabel.setAttribute('x', str(margins['left'] - 18))
        ylabel.setAttribute('y', str((margins['top'] + height - margins['bottom']) / 2))
        ylabel.setAttribute('transform', 'rotate(-90 {} {}'.format(margins['left'] - 18, (margins['top'] + height - margins['bottom']) / 2))
        ylabel.setAttribute('text-anchor', 'middle')
        ylabel.setAttribute('font-size', '16px')
        ylabel.appendChild(document.createTextNode(globalSettings['labels']['ylabel']))