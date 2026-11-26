import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  isPlaying: boolean;
}

export const SpectralPeakChart: React.FC<Props> = ({ isPlaying }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 140;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Generate transient peak data
    const data = Array.from({ length: 50 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.3) * 30 + Math.random() * 50 + (i % 7 === 0 ? 70 : 20)
    }));

    const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([0, w]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([h, 0]);

    // Area generator
    const area = d3.area<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y0(h)
      .y1(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'spectral-gradient')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#00f2fe').attr('stop-opacity', 0.6);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#8a2be2').attr('stop-opacity', 0.05);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#spectral-gradient)')
      .attr('d', area);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#00f2fe')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Highlight transient peaks (> 70)
    g.selectAll('.peak-dot')
      .data(data.filter(d => d.y > 65))
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 3.5)
      .attr('fill', '#f72585');

  }, [isPlaying]);

  return (
    <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 space-y-2 shadow-xl">
      <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-2">
        <span className="text-[#00f2fe] font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse"></span>
          D3.JS SPECTRAL PEAK &amp; TRANSIENT HIGHLIGHTS
        </span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[10px]">Zoom:</span>
          <button 
            onClick={() => setZoom(z => Math.max(1, z - 0.5))} 
            className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-[#00f2fe] font-bold w-9 text-center">{zoom.toFixed(1)}x</span>
          <button 
            onClick={() => setZoom(z => Math.min(4, z + 0.5))} 
            className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button 
            onClick={() => setZoom(1)} 
            className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-[10px] font-bold cursor-pointer"
            title="Reset Zoom"
          >
            1x
          </button>
        </div>
      </div>
      <div className="relative w-full h-36 bg-slate-950 rounded-lg overflow-x-auto custom-scroll">
        <div 
          className="w-full h-full"
          style={{ 
            transform: `scaleX(${zoom})`, 
            transformOrigin: 'left center', 
            transition: 'transform 0.25s ease' 
          }}
        >
          <svg ref={svgRef} className="w-full h-full block"></svg>
        </div>
      </div>
    </div>
  );
};
