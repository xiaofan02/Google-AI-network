import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { DeviceType, DeviceStatus, Device } from '../types';
import { DICTIONARY } from '../types';

export const TopologyView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { topology, language } = useApp();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const t = DICTIONARY[language];

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current || topology.nodes.length === 0) return;

    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // --- Static Hierarchical Layout Calculation ---
    // Instead of simulation, we assign X,Y based on Role
    
    const levels = {
        'CORE': 0,
        'DISTRIBUTION': 1,
        'ACCESS': 2,
        'EDGE': 3
    };

    const nodesByLevel: Record<number, Device[]> = { 0: [], 1: [], 2: [], 3: [] };
    
    topology.nodes.forEach(node => {
        const lvl = levels[node.role || 'EDGE'] || 3;
        // @ts-ignore - appending processed data
        node._level = lvl;
        nodesByLevel[lvl].push(node);
    });

    const levelHeight = 150;
    const startY = 80;

    // Assign Coordinates
    Object.keys(nodesByLevel).forEach(lvlKey => {
        const lvl = parseInt(lvlKey);
        const nodesInLevel = nodesByLevel[lvl];
        const totalNodes = nodesInLevel.length;
        const availableWidth = Math.max(width, totalNodes * 120); // Ensure enough width
        const spacing = availableWidth / (totalNodes + 1);

        nodesInLevel.forEach((node, index) => {
             // @ts-ignore
            node.x = spacing * (index + 1);
             // @ts-ignore
            node.y = startY + (lvl * levelHeight);
        });
    });

    // Center the whole graph if width is small
    const xOffset = 0; 

    // Draw Links (Curved Paths for hierarchy feeling)
    const link = g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(topology.links)
      .join("path")
      .attr("d", (d: any) => {
        const source = topology.nodes.find(n => n.id === d.source);
        const target = topology.nodes.find(n => n.id === d.target);
        if (!source || !target) return "";
        
        // Bezier curve
        // @ts-ignore
        return d3.linkVertical().x(d => d.x).y(d => d.y)({ source, target });
      });

    // Draw Nodes
    const nodeGroup = g.append("g")
      .selectAll("g")
      .data(topology.nodes)
      .join("g")
      // @ts-ignore
      .attr("transform", d => `translate(${d.x + xOffset},${d.y})`)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNodeId(d.id);
        event.stopPropagation();
      });

    // Node Background Circle/Rect
    nodeGroup.append("rect")
      .attr("width", 40)
      .attr("height", 40)
      .attr("x", -20)
      .attr("y", -20)
      .attr("rx", 8)
      .attr("fill", "#1e293b") // Slate 800
      .attr("stroke", (d: Device) => {
        if (d.status === DeviceStatus.CRITICAL) return "#ef4444";
        if (d.status === DeviceStatus.WARNING) return "#eab308";
        return "#3b82f6"; // Default Blue
      })
      .attr("stroke-width", 2);

    // Device Icon/Text
    nodeGroup.append("text")
      .text((d: Device) => {
        if(d.type === DeviceType.ROUTER) return "R";
        if(d.type === DeviceType.SWITCH) return "SW";
        if(d.type === DeviceType.ESXI) return "VMW";
        if(d.type === DeviceType.PROXMOX) return "PVE";
        return "Srv";
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#e2e8f0")
      .style("font-size", "10px")
      .style("font-weight", "bold");

    // Device Label
    nodeGroup.append("text")
      .text((d: Device) => d.name)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .style("font-size", "10px");
      
    // Initial Zoom to center
    // Centering slightly complex with custom layout, default transform is usually okay.

  }, [topology, language]);

  const selectedDevice = topology.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="h-[calc(100vh-6rem)] flex relative">
      <div ref={wrapperRef} className="flex-1 bg-slate-950 relative overflow-hidden rounded-xl border border-slate-800 m-4 shadow-inner">
        <svg ref={svgRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 pointer-events-none z-10">
            <h4 className="font-bold text-slate-200 mb-2">3-Tier Topology</h4>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Core / Distribution</div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Edge / Host</div>
                <div className="mt-2 pt-2 border-t border-slate-700">{t.topologyZoom}</div>
            </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedDevice && (
        <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 absolute right-0 top-0 h-full shadow-xl animate-slide-in-right overflow-y-auto z-20">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-bold text-white">{selectedDevice.name}</h2>
            <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="space-y-4">
             <DetailRow label={t.type} value={selectedDevice.type} />
             <DetailRow label={t.ipAddress} value={selectedDevice.ip} />
             <DetailRow label="OS" value={selectedDevice.os} />
             <div className="py-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                    selectedDevice.status === DeviceStatus.ONLINE ? 'bg-green-500/20 text-green-400' : 
                    selectedDevice.status === DeviceStatus.CRITICAL ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                    {selectedDevice.status}
                </span>
             </div>

             <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">{t.topResources}</h3>
                <ProgressBar label="CPU" value={selectedDevice.cpuUsage} color="bg-blue-500" />
                <ProgressBar label="Memory" value={selectedDevice.memUsage} color="bg-purple-500" />
                <ProgressBar label="Disk" value={selectedDevice.diskUsage} color="bg-orange-500" />
             </div>

             <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">{t.interfaces}</h3>
                {selectedDevice.interfaces.map(iface => (
                    <div key={iface.id} className="bg-slate-800 p-2 rounded mb-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-300 font-mono">{iface.name}</span>
                            <span className={iface.status === 'UP' ? 'text-green-400' : 'text-red-400'}>{iface.status}</span>
                        </div>
                        <div className="flex justify-between mt-1 text-slate-500">
                            <span>Rx: {iface.rxRate.toFixed(1)} Mbps</span>
                            <span>Tx: {iface.txRate.toFixed(1)} Mbps</span>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm text-slate-200 font-medium">{value}</span>
    </div>
);

const ProgressBar: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-200">{value.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
        </div>
    </div>
);