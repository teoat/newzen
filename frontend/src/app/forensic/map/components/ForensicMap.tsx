'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertOctagon, 
  Globe, 
  Crosshair, 
  MapPin, 
  CreditCard, 
  Fuel, 
  ShoppingBag, 
  Target, 
  AlertTriangle 
} from 'lucide-react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeoEntity, GeospatialAnomaly } from '../../../../types/graph';
import { MapPosition, geoUrl, DEFAULT_POSITION } from './constants';

interface ForensicMapProps {
  loadingEntities: boolean;
  entities?: GeoEntity[];
  mapMode: 'markers' | 'heatmap' | 'flows' | 'anomalies' | 'storyboard';
  mapPosition: MapPosition;
  setMapPosition: React.Dispatch<React.SetStateAction<MapPosition>>;
  setSelectedEntity: (entity: GeoEntity | null) => void;
  heatmapData?: Array<{ lat: number; lng: number; weight: number }>;
  anomaliesData?: { geospatial_anomalies: GeospatialAnomaly[] };
  storyNodes?: any[];
  storyLines?: any[];
}

export const ForensicMap: React.FC<ForensicMapProps> = ({
  loadingEntities,
  entities,
  mapMode,
  mapPosition,
  setMapPosition,
  setSelectedEntity,
  heatmapData,
  anomaliesData,
  storyNodes,
  storyLines,
}) => {
  const resetMap = () => setMapPosition(DEFAULT_POSITION);

  return (
    <div className="lg:col-span-3 rounded-[3rem] relative overflow-hidden bg-[#020617] border border-white/5 shadow-2xl group">
      <AnimatePresence>
        {loadingEntities && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm"
          >
            <Activity className="w-12 h-12 text-indigo-500 animate-pulse mb-4" />
            <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">Triangulating Node Coordinates...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 opacity-10 pointer-events-none map-grid-pattern" />

      {!loadingEntities && entities?.length === 0 && mapMode !== 'storyboard' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 pointer-events-none">
          <AlertOctagon className="w-16 h-16 text-slate-600 mb-4" />
          <span className="text-slate-500 font-mono text-xs uppercase tracking-[0.3em]">No Geospatial Nodes Found in Sector</span>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: mapPosition.zoom,
          center: mapPosition.coordinates
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-1000 ease-in-out"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#1e293b", outline: "none" },
                  pressed: { fill: "#334155", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {mapMode === 'heatmap' && heatmapData?.map((p, i) => (
          <Marker key={i} coordinates={[p.lng, p.lat]}>
            <circle r={Math.min(20, p.weight * 5)} fill="#f43f5e" fillOpacity={0.15} stroke="#f43f5e" strokeWidth={0.5} strokeDasharray="2,2" className="animate-forensic-pulse" />
            <circle r={2} fill="#f43f5e" />
          </Marker>
        ))}

        {mapMode === 'markers' && entities?.map((entity) => (
          <Marker
            key={entity.id}
            coordinates={[entity.lng, entity.lat]}
            onClick={() => {
              setSelectedEntity(entity);
              setMapPosition({ coordinates: [entity.lng, entity.lat], zoom: 3000 });
            }}
          >
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.5 }}
              className="cursor-pointer"
            >
              <circle 
                r={6} 
                fill={entity.risk_score > 0.7 ? '#f43f5e' : '#6366f1'} 
                fillOpacity={0.2}
                stroke={entity.risk_score > 0.7 ? '#f43f5e' : '#6366f1'}
                strokeWidth={2}
              />
              <circle 
                r={2} 
                fill={entity.risk_score > 0.7 ? '#f43f5e' : '#fff'} 
              />
              {entity.risk_score > 0.7 && (
                <circle 
                  r={10} 
                  fill="none" 
                  stroke="#f43f5e" 
                  strokeWidth={0.5} 
                  className="animate-ping" 
                />
              )}
            </motion.g>
          </Marker>
        ))}

        {mapMode === 'flows' && entities?.filter((e) => e.target_coords).map((flow, i) => (
          <Line
            key={i}
            from={[flow.lng, flow.lat]}
            to={flow.target_coords!}
            stroke={flow.risk_score > 0.7 ? "#f43f5e" : "#818cf8"}
            strokeWidth={1}
            strokeLinecap="round"
            strokeDasharray="4,2"
          />
        ))}

        {mapMode === 'anomalies' && anomaliesData?.geospatial_anomalies?.map((anomaly, i) => {
          const txNode = entities?.find((e) => e.id === anomaly.transaction_id);
          const truthCoords = anomaly.site_gps || (txNode ? [txNode.lng + 0.1, txNode.lat + 0.1] : [0,0]);
          
          return txNode ? (
            <React.Fragment key={i}>
              <Line
                from={[txNode.lng, txNode.lat]}
                to={truthCoords} 
                stroke="#f43f5e"
                strokeWidth={2}
                className="animate-pulse"
              />
              <Marker coordinates={truthCoords}>
                <motion.g animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>
                  <MapPin size={12} fill="#f43f5e" />
                </motion.g>
              </Marker>
            </React.Fragment>
          ) : null;
        })}

        {/* Pillar III: Movement Storyboard Components */}
        {mapMode === 'storyboard' && storyLines?.map((line, i) => (
            <Line
                key={`line-${i}`}
                from={line.from}
                to={line.to}
                stroke={line.isImpossible ? "#f43f5e" : "#6366f1"}
                strokeWidth={line.isImpossible ? 3 : 1}
                strokeDasharray={line.isImpossible ? "none" : "4,2"}
                className={line.isImpossible ? "animate-pulse" : ""}
            />
        ))}

        {mapMode === 'storyboard' && storyNodes?.map((node, i) => (
            <Marker key={`node-${i}`} coordinates={[node.lng, node.lat]}>
                <motion.g 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    whileHover={{ scale: 1.2 }}
                >
                    <circle r={14} fill="#0f172a" stroke={node.isAnomaly ? "#f43f5e" : "#6366f1"} strokeWidth={2} />
                    <g transform="translate(-6, -6)">
                        {node.type === 'ATM' && <CreditCard size={12} className={node.isAnomaly ? 'text-rose-500' : 'text-indigo-400'} />}
                        {node.type === 'GAS_STATION' && <Fuel size={12} className={node.isAnomaly ? 'text-rose-500' : 'text-indigo-400'} />}
                        {node.type === 'MINI_MART' && <ShoppingBag size={12} className={node.isAnomaly ? 'text-rose-500' : 'text-indigo-400'} />}
                        {node.type === 'SITE' && <Target size={12} className={node.isAnomaly ? 'text-rose-500' : 'text-indigo-400'} />}
                    </g>
                    {node.isAnomaly && (
                        <circle r={18} fill="none" stroke="#f43f5e" strokeWidth={1} strokeDasharray="2,2" className="animate-spin-slow" />
                    )}
                </motion.g>
            </Marker>
        ))}

      </ComposableMap>

      <div className="absolute top-8 left-8 space-y-4 pointer-events-none">
        <Card className="p-4 bg-slate-950/80 border-white/5 backdrop-blur-xl shadow-2xl">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">surveillance metrics</div>
          <div className="flex gap-6">
            <div>
              <div className="text-xl font-black text-white">{entities?.length || storyNodes?.length || 0}</div>
              <div className="text-[8px] text-slate-500 uppercase font-bold">Monitored Nodes</div>
            </div>
            <div className="px-px h-8 bg-white/10" />
            <div>
              <div className="text-xl font-black text-rose-500">
                {mapMode === 'storyboard' ? storyNodes?.filter(n => n.isAnomaly).length : entities?.filter((e) => e.risk_score > 0.7).length || 0}
              </div>
              <div className="text-[8px] text-slate-500 uppercase font-bold">Anomalous Clusters</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="absolute bottom-8 right-8 flex gap-4">
        <Button 
          variant="outline" size="icon" 
          onClick={resetMap}
          title="Reset Map View"
          className="w-12 h-12 rounded-2xl bg-slate-950/80 backdrop-blur-xl border-white/5 hover:bg-white/10 active:scale-95 transition-all"
        >
          <Globe className="w-5 h-5 text-indigo-400" />
        </Button>
        <Button 
          variant="outline" size="icon" 
          onClick={() => setMapPosition(prev => ({ ...prev, zoom: Math.min(8000, prev.zoom + 500) }))}
          title="Center Map"
          className="w-12 h-12 rounded-2xl bg-slate-950/80 backdrop-blur-xl border-white/5 hover:bg-white/10 active:scale-95 transition-all"
        >
          <Crosshair className="w-5 h-5 text-indigo-400" />
        </Button>
      </div>
    </div>
  );
};
