"use client";

import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";
import { CinematicBackground } from "@/components/cinematic-background";

interface DataPoint {
  time: number;
  timestamp: number;
  displayTime: string;
}

interface LogEntry {
  raw: string;
  timestamp: number;
  id: string;
}

export default function SimulationPage() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const startSimulation = () => {
    setIsSimulating(true);
    setData([]);
    setLogs([]);

    // Open connection to backend streaming endpoint (use 127.0.0.1 to avoid ipv6 resolution issues)
    const eventSource = new EventSource("http://127.0.0.1:5000/api/simulation/stream");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      
      if (parsed.done) {
        stopSimulation();
        return;
      }

      if (parsed.raw) {
        setLogs(prev => {
          const newLogs = [...prev, { raw: parsed.raw, timestamp: parsed.timestamp, id: Math.random().toString(36).substr(2, 9) }];
          // Keep only the last 100 logs
          if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
          return newLogs;
        });
      }

      if (parsed.type === 'metric' || parsed.time !== undefined) {
        const newPoint: DataPoint = {
          time: parsed.time,
          timestamp: parsed.timestamp,
          displayTime: new Date(parsed.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit', fractionalSecondDigits: 1 }),
        };

        setData((prevData) => {
          const updatedData = [...prevData, newPoint];
          // Keep only data points from the last 5 seconds (5000 ms)
          return updatedData.filter((d) => (Date.now() - d.timestamp) <= 5000);
        });
      }
    };

    eventSource.addEventListener("status", (event) => {
      console.log("Status event:", event.data);
    });

    eventSource.addEventListener("error", (event: any) => {
      const parsed = event.data ? JSON.parse(event.data) : null;
      if (parsed) {
        setLogs(prev => [...prev, { raw: `ERROR: ${parsed.message}`, timestamp: parsed.timestamp, id: Math.random().toString(36).substr(2, 9) }]);
      }
    });

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      // Instead of stopping immediately on any error (which might just be a temporary connection drop),
      // we check if the connection is permanently closed
      if (eventSource.readyState === EventSource.CLOSED) {
        stopSimulation();
      }
    };
  };

  const stopSimulation = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsSimulating(false);
  };

  useEffect(() => {
    // Add a ticking update so the graph slides even when there are no new points coming in instantly
    const interval = setInterval(() => {
      if (isSimulating) {
        setData(prevData => prevData.filter((d) => (Date.now() - d.timestamp) <= 5000));
      }
    }, 100);

    return () => {
      clearInterval(interval);
      stopSimulation(); // Cleanup on unmount
    };
  }, [isSimulating]);

  // Calculate moving average
  const avgQPS = data.length > 0 ? (data.reduce((acc, curr) => acc + curr.time, 0) / data.length).toFixed(3) : "0.000";

  return (
    <div className="relative min-h-screen bg-background text-foreground p-8 overflow-hidden">
      <CinematicBackground />
      <div className="relative z-10 max-w-6xl mx-auto space-y-8 mt-12">
        <header className="flex justify-between items-center bg-card/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 transition-all p-2 rounded-xl flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="w-8 h-8 text-primary" /> 
                QPS Simulation
              </h1>
              <p className="text-muted-foreground mt-1">Live Siege Performance Metrics (5s sliding window)</p>
            </div>
          </div>
          
          <button 
            onClick={isSimulating ? stopSimulation : startSimulation}
            className={`font-bold px-6 py-3 rounded-xl transition-all shadow-lg ${isSimulating ? "bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30 shadow-red-500/20" : "bg-primary text-primary-foreground border-primary/50 hover:bg-primary/90 shadow-primary/25"}`}
          >
            {isSimulating ? "Stop Simulation" : "Start Simulation"}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl border border-white/5 bg-card/60 backdrop-blur-xl">
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <p className="text-2xl font-semibold">
              {isSimulating ? <span className="text-green-500 animate-pulse">Running ({data.length > 0 ? "Receiving Data" : "Connecting..."})</span> : <span className="text-red-500">Idle</span>}
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-card/60 backdrop-blur-xl">
            <p className="text-sm text-muted-foreground mb-1">Live Avg Response Time (last 5s)</p>
            <p className="text-3xl font-bold tracking-tight text-primary">{avgQPS} <span className="text-lg text-muted-foreground font-normal">secs</span></p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-card/60 backdrop-blur-xl">
            <p className="text-sm text-muted-foreground mb-1">Total Hits Recorded</p>
            <p className="text-3xl font-bold tracking-tight">{data.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-6 rounded-3xl border border-white/5 bg-card/60 backdrop-blur-xl relative shadow-2xl overflow-hidden h-[500px]">
            {!isSimulating && data.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/80 z-20 bg-background/90 backdrop-blur-2xl rounded-3xl">
                <Activity className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-xl">Click Start Simulation to begin graphing node metrics.</p>
              </div>
            )}
            
            <div className="w-full h-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" vertical={false} />
                  <XAxis dataKey="displayTime" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val) => `${val}s`} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="time" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    animationDuration={300}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 p-6 rounded-3xl border border-white/5 bg-card/60 backdrop-blur-xl relative shadow-2xl h-[500px] flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-primary shrink-0 flex items-center justify-between">
              <span>Terminal Output</span>
              {logs.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/30">
                  Live
                </span>
              )}
            </h3>
            <div className="flex-1 bg-black/50 border border-white/10 rounded-xl p-4 overflow-y-auto font-mono text-xs md:text-sm text-gray-300 relative custom-scrollbar space-y-1" ref={logContainerRef}>
              {!isSimulating && logs.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                  <p>Awaiting simulation logs...</p>
                </div>
              )}
              {logs.map((log) => {
                // simple colorization
                let colorClass = "text-gray-300";
                if (log.raw.includes("HTTP/1.1 200")) colorClass = "text-green-400";
                else if (log.raw.includes("HTTP/1.1 500") || log.raw.includes("error") || log.raw.includes("WARN")) colorClass = "text-red-400";
                
                return (
                  <div key={log.id} className={`${colorClass} whitespace-pre-wrap break-all`}>
                    {log.raw}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
