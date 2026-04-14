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
  const [totalHits, setTotalHits] = useState<number>(0);
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
    setTotalHits(0);
    setData([]);
    setLogs([]);

    // Open connection to backend streaming endpoint (use localhost to match cors)
    const eventSource = new EventSource("http://localhost:5000/api/simulation/stream");
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

      if (parsed.type === 'qps') {
        setTotalHits((prev) => prev + parsed.hits);
        const newPoint: DataPoint = {
          time: parsed.qps,
          timestamp: parsed.timestamp,
          displayTime: new Date(parsed.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        };

        setData((prevData) => {
          const updatedData = [...prevData, newPoint];
          // Keep only data points from the last 60 seconds (60000 ms) to show a proper graph
          return updatedData.filter((d) => (Date.now() - d.timestamp) <= 60000);
        });
      } else if (parsed.type === 'metric' || parsed.time !== undefined) {
        // Keep existing support for legacy format if any
        const timeValue = parsed.time !== undefined ? parsed.time : 0;
        const newPoint: DataPoint = {
          time: timeValue,
          timestamp: parsed.timestamp,
          displayTime: new Date(parsed.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
        };

        // For individual metrics, we just want to log them or handle differently, but here we don't spam the graph 
        // to avoid freezing the UI.
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
        setData(prevData => prevData.filter((d) => (Date.now() - d.timestamp) <= 60000));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isSimulating]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Calculate moving average
  const last5SecData = data.filter(d => (Date.now() - d.timestamp) <= 5000);
  const avgQPS = last5SecData.length > 0 ? (last5SecData.reduce((acc, curr) => acc + curr.time, 0) / last5SecData.length).toFixed(1) : "0.0";
  
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
            <p className="text-sm text-muted-foreground mb-1">Live Avg QPS (last 5s)</p>
            <p className="text-3xl font-bold tracking-tight text-primary">{avgQPS} <span className="text-lg text-muted-foreground font-normal">q/s</span></p>
          </div>
          <div className="p-6 rounded-2xl border border-white/5 bg-card/60 backdrop-blur-xl">
            <p className="text-sm text-muted-foreground mb-1">Total Hits Recorded</p>
            <p className="text-3xl font-bold tracking-tight">{totalHits}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 mb-8">
          <div className="p-6 rounded-3xl border border-white/5 bg-card/60 backdrop-blur-xl relative shadow-2xl overflow-hidden h-125">
            {!isSimulating && data.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/80 z-20 bg-background/90 backdrop-blur-2xl rounded-3xl">
                <Activity className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-xl">Click Start Simulation to begin graphing node metrics.</p>
              </div>
            )}
            
            <div className="w-full h-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.65 0 0 / 0.2)" vertical={false} />
                  <XAxis dataKey="displayTime" stroke="oklch(0.65 0 0)" fontSize={12} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="oklch(0.65 0 0)" fontSize={12} tickFormatter={(val) => `${val}`} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'oklch(0.15 0.01 270 / 0.9)', borderColor: 'oklch(0.2 0 0)', borderRadius: '12px', color: 'oklch(0.98 0 0)' }}
                    itemStyle={{ color: 'oklch(0.65 0.25 25)' }}
                    formatter={(value: number) => [`${value} qps`, 'QPS']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="time" 
                    stroke="oklch(0.65 0.25 25)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "oklch(0.65 0.25 25)" }}
                    activeDot={{ r: 6, fill: "oklch(0.65 0.25 25)", stroke: "oklch(0.05 0.01 270)", strokeWidth: 2 }}
                    animationDuration={300}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
