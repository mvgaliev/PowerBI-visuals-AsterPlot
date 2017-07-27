﻿/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    // d3
    import ArcDescriptor = d3.layout.pie.Arc;
    import SvgArc = d3.svg.Arc;

    // powerbi
    import IViewport = powerbi.IViewport;
    import DataView = powerbi.DataView;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import IEnumType = powerbi.IEnumType;
    import IEnumMember = powerbi.IEnumMember;
    import DataViewObjects = powerbi.DataViewObjects;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
    import DataViewValueColumns = powerbi.DataViewValueColumns;
    import DataViewCategoricalColumn = powerbi.DataViewCategoricalColumn;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
    import DataViewValueColumn = powerbi.DataViewValueColumn;
    import IVisual = powerbi.extensibility.IVisual;
    import IDataColorPalette = powerbi.extensibility.IColorPalette;
    import DataViewScopeIdentity = powerbi.DataViewScopeIdentity;
    import IVisualHostServices = powerbi.extensibility.IVisualHost;
    import VisualInitOptions = powerbi.extensibility.VisualConstructorOptions;
    import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
    import VisualDataRoleKind = powerbi.VisualDataRoleKind;

    // powerbi.extensibility.visual
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import translate = powerbi.extensibility.utils.svg.translate;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi.extensibility.utils.formatting
    import TextProperties = powerbi.extensibility.utils.formatting.TextProperties;
    import ValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.chart
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;
    import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import LegendDataModule = powerbi.extensibility.utils.chart.legend.data;
    import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;
    import dataLabelUtils = powerbi.extensibility.utils.chart.dataLabel.utils;
    import legendPosition = powerbi.extensibility.utils.chart.legend.position;
    import createLegend = powerbi.extensibility.utils.chart.legend.createLegend;
    import ILabelLayout = powerbi.extensibility.utils.chart.dataLabel.ILabelLayout;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;
    import positionChartArea = powerbi.extensibility.utils.chart.legend.positionChartArea;
    import DataLabelManager = powerbi.extensibility.utils.chart.dataLabel.DataLabelManager;
    import LabelEnabledDataPoint = powerbi.extensibility.utils.chart.dataLabel.LabelEnabledDataPoint;

    // powerbi.extensibility.utils.interactivity
    import appendClearCatcher = powerbi.extensibility.utils.interactivity.appendClearCatcher;
    import SelectableDataPoint = powerbi.extensibility.utils.interactivity.SelectableDataPoint;
    import createInteractivityService = powerbi.extensibility.utils.interactivity.createInteractivityService;

    // powerbi.extensibility.utils.interactivity
    import IInteractivityService = powerbi.extensibility.utils.interactivity.IInteractivityService;
    import IInteractiveBehavior = powerbi.extensibility.utils.interactivity.IInteractiveBehavior;
    import ISelectionHandler = powerbi.extensibility.utils.interactivity.ISelectionHandler;

    // powerbi.extensibility.utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    // powerbi.extensibility.utils.tooltip
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import ITooltipServiceWrapper = powerbi.extensibility.utils.tooltip.ITooltipServiceWrapper;
    import createTooltipServiceWrapper = powerbi.extensibility.utils.tooltip.createTooltipServiceWrapper;

    let AsterPlotVisualClassName: string = "asterPlot";
    let AsterRadiusRatio: number = 0.9;
    let AsterConflictRatio = 0.9;

    export class AsterPlot implements IVisual {
        private static AnimationDuration: number = 250;

        private static AsterSlices: ClassAndSelector = createClassAndSelector("asterSlices");
        private static AsterSlice: ClassAndSelector = createClassAndSelector("asterSlice");
        private static AsterHighlightedSlice: ClassAndSelector = createClassAndSelector("asterHighlightedSlice");
        private static OuterLine: ClassAndSelector = createClassAndSelector("outerLine");
        private static labelGraphicsContextClass: ClassAndSelector = createClassAndSelector("labels");
        private static linesGraphicsContextClass: ClassAndSelector = createClassAndSelector("lines");
        private static CenterLabelClass: ClassAndSelector = createClassAndSelector("centerLabel");

        private static CenterTextFontHeightCoefficient = 0.4;
        private static CenterTextFontWidthCoefficient = 1.9;

        private layout: VisualLayout;

        private svg: d3.Selection<any>;
        private mainGroupElement: d3.Selection<any>;
        private mainLabelsElement: d3.Selection<any>;
        private slicesElement: d3.Selection<AsterPlotData>;
        private centerText: d3.Selection<any>;
        private clearCatcher: d3.Selection<any>;

        private colors: IDataColorPalette;

        private visualHost: IVisualHost;
        private interactivityService: IInteractivityService;

        private legend: ILegend;
        private data: AsterPlotData;

        private get settings(): AsterPlotSettings {
            return this.data && this.data.settings;
        }

        private behavior: IInteractiveBehavior;

        private tooltipServiceWrapper: ITooltipServiceWrapper;

        constructor(options: VisualConstructorOptions) {
            this.visualHost = options.host;

            this.tooltipServiceWrapper = createTooltipServiceWrapper(
                this.visualHost.tooltipService,
                options.element);

            this.layout = new VisualLayout(null, {
                top: 10,
                right: 10,
                bottom: 15,
                left: 10
            });

            let svg: d3.Selection<any> = this.svg = d3.select(options.element)
                .append("svg")
                .classed(AsterPlotVisualClassName, true)
                .style("position", "absolute");

            this.colors = options.host.colorPalette;
            this.mainGroupElement = svg.append("g");
            this.mainLabelsElement = svg.append("g");

            this.behavior = new AsterPlotWebBehavior();
            this.clearCatcher = appendClearCatcher(this.mainGroupElement);

            this.slicesElement = this.mainGroupElement
                .append("g")
                .classed(AsterPlot.AsterSlices.className, true);

            this.interactivityService = createInteractivityService(options.host);

            this.legend = createLegend(
                options.element,
                options.host && false,
                this.interactivityService,
                true);
        }

        public static converter(dataView: DataView, colors: IDataColorPalette, visualHost: IVisualHost): AsterPlotData {
            let categorical = AsterPlotColumns.getCategoricalColumns(dataView);
            let catValues = AsterPlotColumns.getCategoricalValues(dataView);
            if (!categorical
                || !categorical.Category
                || _.isEmpty(categorical.Category.values)
                || _.isEmpty(categorical.Y)
                || _.isEmpty(categorical.Y[0].values)) {
                return;
            }

            let settings: AsterPlotSettings = AsterPlot.parseSettings(dataView, categorical.Category.source);

            let dataPoints: AsterDataPoint[] = [];
            let highlightedDataPoints: AsterDataPoint[] = [];
            let legendData = <LegendData>{
                dataPoints: [],
                title: null,
                fontSize: settings.legend.fontSize,
                labelColor: LegendDataModule.DefaultLegendLabelFillColor
            };

            let colorHelper: ColorHelper = new ColorHelper(colors);

            let hasHighlights: boolean = !!(categorical.Y[0].highlights);

            let maxValue: number = Math.max(d3.min(<number[]>categorical.Y[0].values));
            let minValue: number = Math.min(0, d3.min(<number[]>categorical.Y[0].values));


            let labelFormatter: IValueFormatter = null;
            labelFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(
                    dataView.metadata.columns[0],
                    true),
            });
            let labelFormatter2: IValueFormatter = null;
            labelFormatter = valueFormatter.create({
                format: valueFormatter.getFormatStringByColumn(
                    categorical.Y[0].source,
                    true),
                precision: settings.labels.precision,
                value: (settings.labels.displayUnits === 0) && (maxValue != null) ? maxValue : settings.labels.displayUnits,
            });

            let categorySourceFormatString = valueFormatter.getFormatStringByColumn(
                categorical.Category.source,
                true);
            let fontSizeInPx: string = PixelConverter.fromPoint(settings.labels.fontSize);

            for (let i = 0; i < catValues.Category.length; i++) {
                let formattedCategoryValue = catValues.Category[i],
                    currentValue = <number>categorical.Y[0].values[i];

                let tooltipInfo: VisualTooltipDataItem[] = tooltipBuilder.createTooltipInfo(
                    dataView.categorical,
                    formattedCategoryValue,
                    currentValue,
                    0);

                if (categorical.Y.length > 1) {
                    let toolTip: VisualTooltipDataItem = tooltipBuilder.createTooltipInfo(
                        dataView.categorical,
                        formattedCategoryValue,
                        categorical.Y[1].values[i],
                        1)[1];

                    if (toolTip) {
                        tooltipInfo.push(toolTip);
                    }

                    currentValue += <number>categorical.Y[1].values[i];
                }
debugger
                let identity: DataViewScopeIdentity = categorical.Category.identity[i],
                    color: string,
                    sliceWidth: number;

                color = colorHelper.getColorForMeasure(
                    categorical.Category.objects && categorical.Category.objects[i],
                    identity.key);

                sliceWidth = Math.max(0, categorical.Y.length > 1 ? <number>categorical.Y[1].values[i] : 1);

                let selectionId: ISelectionId = visualHost.createSelectionIdBuilder()
                    .withCategory(categorical.Category, i)
                    .withMeasure(categorical.Category.source.queryName)
                    .createSelectionId();

                if (sliceWidth > 0) {
                    dataPoints.push({
                        sliceHeight: <number>categorical.Y[0].values[i] - minValue,
                        sliceWidth: sliceWidth,
                        label: labelFormatter.format(<any>currentValue),
                        color: color,
                        identity: selectionId,
                        selected: false,
                        tooltipInfo: tooltipInfo,
                        labelFontSize: fontSizeInPx,
                        highlight: false,
                    });
                }

                // Handle legend data
                if (settings.legend.show) {
                    legendData.dataPoints.push({
                        label: formattedCategoryValue,
                        color: color,
                        icon: LegendIcon.Box,
                        selected: false,
                        identity: selectionId
                    });
                }

                // Handle highlights
                if (hasHighlights) {
                    let notNull: boolean = categorical.Y[0].highlights[i] != null;

                    currentValue = notNull
                        ? categorical.Y[0].highlights[i] as number
                        : 0;

                    tooltipInfo = tooltipBuilder.createTooltipInfo(
                        dataView.categorical,
                        formattedCategoryValue,
                        currentValue,
                        0);

                    if (categorical.Y.length > 1) {
                        let toolTip: VisualTooltipDataItem = tooltipBuilder.createTooltipInfo(
                            dataView.categorical,
                            formattedCategoryValue,
                            categorical.Y[1].highlights[i],
                            1)[1];

                        if (toolTip) {
                            tooltipInfo.push(toolTip);
                        }

                        currentValue += categorical.Y[1].highlights[i] !== null ? <number>categorical.Y[1].highlights[i] : 0;
                    }

                    highlightedDataPoints.push({
                        sliceHeight: notNull ? <number>categorical.Y[0].highlights[i] - minValue : null,
                        sliceWidth: Math.max(0, (categorical.Y.length > 1 && categorical.Y[1].highlights[i] !== null) ? <number>categorical.Y[1].highlights[i] : sliceWidth),
                        label: labelFormatter.format(<any>currentValue),
                        color: color,
                        identity: selectionId,
                        selected: false,
                        tooltipInfo: tooltipInfo,
                        labelFontSize: fontSizeInPx,
                        highlight: true,
                    });
                }
            }

            return dataPoints.length
                ? {
                    dataPoints,
                    settings,
                    hasHighlights,
                    legendData,
                    highlightedDataPoints,
                    labelFormatter: labelFormatter,
                    centerText: categorical.Category.source.displayName
                }
                : null;
        }

        private static parseSettings(dataView: DataView, categorySource: DataViewMetadataColumn): AsterPlotSettings {
            let settings: AsterPlotSettings = AsterPlotSettings.parse<AsterPlotSettings>(dataView);

            settings.labels.precision = Math.min(17, Math.max(0, settings.labels.precision));
            settings.outerLine.thickness = Math.min(25, Math.max(1, settings.outerLine.thickness));

            if (_.isEmpty(settings.legend.titleText)) {
                settings.legend.titleText = categorySource.displayName;
            }

            return settings;
        }

        public update(options: VisualUpdateOptions): void {

            if (!options || options.dataViews === undefined || options.dataViews === null || options.dataViews.length < 1 || options.dataViews[0] === null) {
                return;
            }
            this.layout.viewport = options.viewport;

            let data = AsterPlot.converter(options.dataViews[0], this.colors, this.visualHost);

            if (!data) {
                this.clear();
                return;
            }

            this.data = data;

            if (this.interactivityService) {
                this.interactivityService.applySelectionStateToData(
                    this.data.dataPoints.concat(this.data.highlightedDataPoints),
                    this.data.hasHighlights);
            }

            this.renderLegend();
            this.updateViewPortAccordingToLegend();

            this.svg.attr({
                width: PixelConverter.toString(this.layout.viewport.width),
                height: PixelConverter.toString(this.layout.viewport.height)
            });

            let transformX: number = (this.layout.viewportIn.width + this.layout.margin.right) / 2;
            let transformY: number = (this.layout.viewportIn.height + this.layout.margin.bottom) / 2;

            this.mainGroupElement.attr("transform", translate(transformX, transformY));
            this.mainLabelsElement.attr("transform", translate(transformX, transformY));

            // Move back the clearCatcher
            this.clearCatcher.attr("transform", translate(-transformX, -transformY));

            dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);

            this.renderArcsAndLabels(AsterPlot.AnimationDuration);

            if (this.data.hasHighlights) {
                this.renderArcsAndLabels(AsterPlot.AnimationDuration, true);
            } else {
                this.slicesElement.selectAll(AsterPlot.AsterHighlightedSlice.selectorName).remove();
            }

            if (this.interactivityService) {
                let behaviorOptions: AsterPlotBehaviorOptions = {
                    selection: this.slicesElement.selectAll(AsterPlot.AsterSlice.selectorName + ", " + AsterPlot.AsterHighlightedSlice.selectorName),
                    clearCatcher: this.clearCatcher,
                    interactivityService: this.interactivityService,
                    hasHighlights: this.data.hasHighlights
                };

                this.interactivityService.bind(
                    this.data.dataPoints.concat(this.data.highlightedDataPoints),
                    this.behavior,
                    behaviorOptions);
            }
        }

        private renderArcsAndLabels(duration: number, isHighlight: boolean = false): any {
            let viewportRadius: number = Math.min(this.layout.viewportIn.width, this.layout.viewportIn.height) / 2,
                innerRadius: number = 0.3 * (this.settings.labels.show ? viewportRadius * AsterRadiusRatio : viewportRadius),
                maxScore: number = d3.max(this.data.dataPoints, d => d.sliceHeight),
                totalWeight: number = d3.sum(this.data.dataPoints, d => d.sliceWidth);

            let pie: d3.layout.Pie<AsterDataPoint> = d3.layout.pie<AsterDataPoint>()
                .sort(null)
                .value((dataPoint: AsterDataPoint) => {
                    if (!totalWeight || !dataPoint || isNaN(dataPoint.sliceWidth)) {
                        return 0;
                    }

                    return dataPoint.sliceWidth / totalWeight;
                });

            let arc: d3.svg.Arc<AsterArcDescriptor> = d3.svg.arc<AsterArcDescriptor>()
                .innerRadius(innerRadius)
                .outerRadius((arcDescriptor: AsterArcDescriptor, i: number) => {
                    let height: number = 0;

                    if (maxScore) {
                        let radius: number = viewportRadius - innerRadius,
                            sliceHeight: number = 1;

                        sliceHeight = arcDescriptor
                            && arcDescriptor.data
                            && !isNaN(arcDescriptor.data.sliceHeight)
                            ? arcDescriptor.data.sliceHeight
                            : sliceHeight;

                        height = radius * sliceHeight / maxScore;
                    }

                    // The chart should shrink if data labels are on
                    let heightIsLabelsOn = innerRadius + (this.settings.labels.show ? height * AsterRadiusRatio : height);

                    // Prevent from data to be inside the inner radius
                    return Math.max(heightIsLabelsOn, innerRadius);
                });

            let arcDescriptorDataPoints: ArcDescriptor<AsterDataPoint>[] = pie(isHighlight
                ? this.data.highlightedDataPoints
                : this.data.dataPoints);

            let classSelector: ClassAndSelector = isHighlight
                ? AsterPlot.AsterHighlightedSlice
                : AsterPlot.AsterSlice;

            let selection = this.slicesElement
                .selectAll(classSelector.selectorName)
                .data(
                arcDescriptorDataPoints,
                (d: ArcDescriptor<AsterDataPoint>, i: number) => {
                    return d.data
                        ? (d.data.identity as powerbi.visuals.ISelectionId).getKey()
                        : i as any; // TODO: check it.
                });

            selection
                .enter()
                .append("path")
                .classed(classSelector.className, true)
                .attr("stroke", "#333");

            selection
                .attr("fill", d => d.data.color)
                .call(selection => {
                    return Helpers.setAttrThroughTransitionIfNotResized(
                        selection,
                        s => s.duration(duration),
                        "d",
                        arc,
                        Helpers.interpolateArc(arc),
                        this.layout.viewportChanged);
                });

            selection
                .exit()
                .remove();

            this.tooltipServiceWrapper.addTooltip(selection, (tooltipEvent: TooltipEventArgs<ArcDescriptor<AsterDataPoint>>) => {
                return tooltipEvent.data.data.tooltipInfo;
            });

            // Draw data labels only if they are on and there are no highlights or there are highlights and this is the highlighted data labels
            if (this.settings.labels.show && (!this.data.hasHighlights || (this.data.hasHighlights && isHighlight))) {
                let labelRadCalc = (d: AsterDataPoint) => {
                    let height: number = viewportRadius * (d && !isNaN(d.sliceHeight) ? d.sliceHeight : 1) / maxScore + innerRadius;
                    return Math.max(height, innerRadius);
                };
                let labelArc = d3.svg.arc<AsterArcDescriptor>()
                    .innerRadius(d => labelRadCalc(d.data))
                    .outerRadius(d => labelRadCalc(d.data));

                let lineRadCalc = (d: AsterDataPoint) => {
                    let height: number = (viewportRadius - innerRadius) * (d && !isNaN(d.sliceHeight) ? d.sliceHeight : 1) / maxScore;
                    height = innerRadius + height * AsterRadiusRatio;
                    return Math.max(height, innerRadius);
                };
                let outlineArc = d3.svg.arc<AsterArcDescriptor>()
                    .innerRadius(d => lineRadCalc(d.data))
                    .outerRadius(d => lineRadCalc(d.data));

                let labelLayout = this.getLabelLayout(labelArc, this.layout.viewport);
                this.drawLabels(
                    arcDescriptorDataPoints.filter(x => !isHighlight || x.data.sliceHeight !== null),
                    this.mainLabelsElement,
                    labelLayout,
                    this.layout.viewport,
                    outlineArc,
                    labelArc);
            }
            else {
                dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);
            }

            // Draw center text and outline once for original data points
            if (!isHighlight) {
                this.drawCenterText(innerRadius);
                this.drawOuterLine(innerRadius, _.max(arcDescriptorDataPoints.map(d => arc.outerRadius()(d, undefined))), arcDescriptorDataPoints); // TODO: check it `arc.outerRadius()(d, undefined)`
            }

            return selection;
        }

        private getLabelLayout(arc: SvgArc<AsterArcDescriptor>, viewport: IViewport): ILabelLayout {
            let midAngle = function (d: ArcDescriptor<AsterDataPoint>) { return d.startAngle + (d.endAngle - d.startAngle) / 2; };
            let textProperties: TextProperties = {
                fontFamily: dataLabelUtils.StandardFontFamily,
                fontSize: PixelConverter.fromPoint(this.settings.labels.fontSize),
                text: "",
            };
            let isLabelsHasConflict = function (d: AsterArcDescriptor) {
                let pos = arc.centroid(d);
                textProperties.text = d.data.label;
                let textWidth = textMeasurementService.measureSvgTextWidth(textProperties);
                let horizontalSpaceAvaliableForLabels = viewport.width / 2 - Math.abs(pos[0]);
                let textHeight = textMeasurementService.estimateSvgTextHeight(textProperties);
                let verticalSpaceAvaliableForLabels = viewport.height / 2 - Math.abs(pos[1]);
                d.isLabelHasConflict = textWidth > horizontalSpaceAvaliableForLabels || textHeight > verticalSpaceAvaliableForLabels;
                return d.isLabelHasConflict;
            };

            return {
                labelText: (d: AsterArcDescriptor) => {
                    textProperties.text = d.data.label;
                    let pos = arc.centroid(d);
                    let xPos = isLabelsHasConflict(d) ? pos[0] * AsterConflictRatio : pos[0];
                    let spaceAvaliableForLabels = viewport.width / 2 - Math.abs(xPos);
                    return textMeasurementService.getTailoredTextOrDefault(textProperties, spaceAvaliableForLabels);
                },
                labelLayout: {
                    x: (d: AsterArcDescriptor) => {
                        let pos = arc.centroid(d);
                        textProperties.text = d.data.label;
                        let xPos = d.isLabelHasConflict ? pos[0] * AsterConflictRatio : pos[0];
                        return xPos;
                    },
                    y: (d: AsterArcDescriptor) => {
                        let pos = arc.centroid(d);
                        let yPos = d.isLabelHasConflict ? pos[1] * AsterConflictRatio : pos[1];
                        return yPos;
                    },
                },
                filter: (d: AsterArcDescriptor) => (d != null && !_.isEmpty(d.data.label + "")),
                style: {
                    "fill": this.settings.labels.color,
                    "font-size": textProperties.fontSize,
                    "text-anchor": (d: AsterArcDescriptor) => midAngle(d) < Math.PI ? "start" : "end",
                },
            };
        }

        private drawLabels(data: ArcDescriptor<AsterDataPoint>[],
            context: d3.Selection<AsterArcDescriptor>,
            layout: ILabelLayout,
            viewport: IViewport,
            outlineArc: d3.svg.Arc<AsterArcDescriptor>,
            labelArc: d3.svg.Arc<AsterArcDescriptor>): void {
            // Hide and reposition labels that overlap
            let dataLabelManager = new DataLabelManager();
            let filteredData = dataLabelManager.hideCollidedLabels(viewport, data, layout, true /* addTransform */);

            if (filteredData.length === 0) {
                dataLabelUtils.cleanDataLabels(context, true);
                return;
            }

            // Draw labels
            if (context.select(AsterPlot.labelGraphicsContextClass.selectorName).empty())
                context.append("g").classed(AsterPlot.labelGraphicsContextClass.className, true);

            let labels = context
                .select(AsterPlot.labelGraphicsContextClass.selectorName)
                .selectAll(".data-labels").data<LabelEnabledDataPoint>(
                filteredData,
                (d: ArcDescriptor<AsterDataPoint>) => (d.data.identity as ISelectionId).getKey());

            labels.enter().append("text").classed("data-labels", true);

            if (!labels)
                return;

            labels
                .attr({ x: (d: LabelEnabledDataPoint) => d.labelX, y: (d: LabelEnabledDataPoint) => d.labelY, dy: ".35em" })
                .text((d: LabelEnabledDataPoint) => d.labeltext)
                .style(layout.style as any);

            labels
                .exit()
                .remove();

            // Draw lines
            if (context.select(AsterPlot.linesGraphicsContextClass.selectorName).empty())
                context.append("g").classed(AsterPlot.linesGraphicsContextClass.className, true);

            // Remove lines for null and zero values
            filteredData = _.filter(filteredData, (d: ArcDescriptor<AsterDataPoint>) => d.data.sliceHeight !== null && d.data.sliceHeight !== 0);

            let lines = context
                .select(AsterPlot.linesGraphicsContextClass.selectorName)
                .selectAll("polyline")
                .data<LabelEnabledDataPoint>(
                filteredData,
                (d: ArcDescriptor<AsterDataPoint>) => (d.data.identity as ISelectionId).getKey());

            let labelLinePadding = 4;
            let chartLinePadding = 1.02;

            let midAngle = function (d: ArcDescriptor<AsterDataPoint>) { return d.startAngle + (d.endAngle - d.startAngle) / 2; };

            lines.enter()
                .append("polyline")
                .classed("line-label", true);

            lines
                .attr("points", (d) => {
                    let textPoint = [d.labelX, d.labelY];
                    textPoint[0] = textPoint[0] + ((midAngle(d as any) < Math.PI ? -1 : 1) * labelLinePadding);
                    let chartPoint = outlineArc.centroid(d as any);
                    chartPoint[0] *= chartLinePadding;
                    chartPoint[1] *= chartLinePadding;

                    return [chartPoint, textPoint] as any; // TODO: check it
                }).
                style({
                    "opacity": 0.5,
                    "fill-opacity": 0,
                    "stroke": () => this.settings.labels.color,
                });

            lines
                .exit()
                .remove();

        }

        private renderLegend(): void {
            if (this.settings.legend.show) {

                // Force update for title text
                let legendObject = _.clone(this.settings.legend);
                legendObject.labelColor = <any>{ solid: { color: legendObject.labelColor } };
                LegendDataModule.update(this.data.legendData, <any>legendObject);
                this.legend.changeOrientation(LegendPosition[this.settings.legend.position]);
            }

            this.legend.drawLegend(this.data.legendData, this.layout.viewportCopy);
            positionChartArea(this.svg, this.legend);
        }

        private updateViewPortAccordingToLegend(): void {
            if (!this.settings.legend.show) {
                return;
            }

            let legendMargins: IViewport = this.legend.getMargins();
            let legendPosition: LegendPosition = LegendPosition[this.settings.legend.position];

            switch (legendPosition) {
                case LegendPosition.Top:
                case LegendPosition.TopCenter:
                case LegendPosition.Bottom:
                case LegendPosition.BottomCenter: {
                    this.layout.viewport.height -= legendMargins.height;
                    break;
                }
                case LegendPosition.Left:
                case LegendPosition.LeftCenter:
                case LegendPosition.Right:
                case LegendPosition.RightCenter: {
                    this.layout.viewport.width -= legendMargins.width;
                    break;
                }
                default:
                    break;
            }
        }

        private drawOuterLine(innerRadius: number, radius: number, data: ArcDescriptor<AsterDataPoint>[]): void {
            let mainGroup = this.mainGroupElement;
            let outlineArc = d3.svg.arc()
                .innerRadius(innerRadius)
                .outerRadius(radius);
            if (this.settings.outerLine.show) {
                let OuterThickness: string = this.settings.outerLine.thickness + "px";
                let outerLine = mainGroup.selectAll(AsterPlot.OuterLine.selectorName).data(data);
                outerLine.enter().append("path");
                outerLine.attr("fill", "none")
                    .attr({
                        "stroke": "#333",
                        "stroke-width": OuterThickness,
                        "d": outlineArc as SvgArc<any> // TODO: check it.
                    })
                    .style("opacity", 1)
                    .classed(AsterPlot.OuterLine.className, true);
                outerLine.exit().remove();
            }
            else
                mainGroup.selectAll(AsterPlot.OuterLine.selectorName).remove();
        }

        private drawCenterText(innerRadius: number): void {
            if (_.isEmpty(this.data.centerText) || !this.settings.label.show) {
                this.mainGroupElement.select(AsterPlot.CenterLabelClass.selectorName).remove();
                return;
            }

            let centerTextProperties: TextProperties = {
                fontFamily: dataLabelUtils.StandardFontFamily,
                fontWeight: "bold",
                fontSize: PixelConverter.toString(this.settings.label.fontSize),
                text: this.data.centerText
            };

            if (this.mainGroupElement.select(AsterPlot.CenterLabelClass.selectorName).empty())
                this.centerText = this.mainGroupElement.append("text").classed(AsterPlot.CenterLabelClass.className, true);

            this.centerText
                .style({
                    "line-height": 1,
                    "font-weight": centerTextProperties.fontWeight,
                    "font-size": this.settings.label.fontSize,
                    "fill": this.settings.label.color
                })
                .attr({
                    "dy": "0.35em",
                    "text-anchor": "middle"
                })
                .text(textMeasurementService.getTailoredTextOrDefault(centerTextProperties, innerRadius * AsterPlot.CenterTextFontWidthCoefficient));
        }

        private clear(): void {
            this.mainGroupElement.selectAll("path").remove();
            this.mainGroupElement.select(AsterPlot.CenterLabelClass.selectorName).remove();
            dataLabelUtils.cleanDataLabels(this.mainLabelsElement, true);
            this.legend.drawLegend({ dataPoints: [] }, this.layout.viewportCopy);
        }

        public onClearSelection(): void {
            if (this.interactivityService) {
                this.interactivityService.clearSelection();
            }
        }

        /* This function returns the values to be displayed in the property pane for each object.
         * Usually it is a bind pass of what the property pane gave you, but sometimes you may want to do
         * validation and return other values/defaults
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            return AsterPlotSettings.enumerateObjectInstances(
                this.settings || AsterPlotSettings.getDefault(),
                options);
        }
    }
}
