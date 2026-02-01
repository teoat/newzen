/**
 * Forensic Chronology Timeline Component
 * Interactive timeline visualization for forensic event sequences
 */

'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Filter, ZoomIn, ZoomOut, Download, Calendar } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TimelineEventMetadata } from '../../schemas';

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  type: 'transaction' | 'evidence' | 'milestone' | 'risk_flag' | 'alert' | 'document' | 'user_action';
  entity?: string;
  amount?: number;
  currency?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
  details?: string;
  tags?: string[];
  related_entities?: string[];
  metadata?: TimelineEventMetadata;
}

interface ForensicChronologyProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  height?: number;
  allowFilter?: boolean;
  allowExport?: boolean;
}

export function ForensicChronology({
  events,
  onEventClick,
  height = 500,
  allowFilter = true,
  allowExport = true
}: ForensicChronologyProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>(events);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['transaction', 'evidence', 'milestone', 'risk_flag']));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Update filtered events when selection changes
  useEffect(() => {
    const filtered = events.filter(event => selectedTypes.has(event.type));
    setFilteredEvents(filtered);
  }, [events, selectedTypes]);

  // Toggle event type filter
  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  // Get color for event type
  const getEventColor = (event: TimelineEvent): string => {
    if (event.riskLevel === 'critical') return 'bg-red-500';
    if (event.riskLevel === 'high') return 'bg-orange-500';
    if (event.riskLevel === 'medium') return 'bg-yellow-500';
    
    switch (event.type) {
      case 'transaction':
        return 'bg-blue-500';
      case 'evidence':
        return 'bg-purple-500';
      case 'milestone':
        return 'bg-green-500';
      case 'risk_flag':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get icon for event type
  const getEventIcon = (type: string): string => {
    switch (type) {
      case 'transaction': return '💰';
      case 'evidence': return '📄';
      case 'milestone': return '🎯';
      case 'risk_flag': return '⚠️';
      default: return '•';
    }
  };

  // Export timeline as JSON
  const exportTimeline = () => {
    const dataStr = JSON.stringify(filteredEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forensic-chronology-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sort events by timestamp
  const sortedEvents = useMemo(() =>
    [...filteredEvents].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    ),
    [filteredEvents]
  );

// Flatten events into a single list for virtualization
  const virtualItems = useMemo(() => {
    const items: Array<{ type: 'date' | 'event'; data: any; index: number }> = [];
    const groupedByDate = sortedEvents.reduce((groups, event) => {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
      return groups;
    }, {} as Record<string, TimelineEvent[]>);

    let idx = 0;
    Object.entries(groupedByDate).forEach(([date, dayEvents]) => {
      // Add date header
      items.push({ type: 'date', data: date, index: idx++ });
      // Add events for this date
      dayEvents.forEach(event => {
        items.push({ type: 'event', data: event, index: idx++ });
      });
    });

    return items;
  }, [sortedEvents]);

  // Virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = virtualItems[index];
      return item?.type === 'date' ? 60 : 140; // Date headers are smaller
    },
    overscan: 5, // Render 5 items outside viewport for smooth scrolling
  });

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 flex flex-col forensic-glass-panel" style={{ height }}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Forensic Chronology</h3>
          <span className="text-slate-400 text-sm">({filteredEvents.length} events)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            className="p-2 hover:bg-slate-800 rounded text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-slate-400 text-sm">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
            className="p-2 hover:bg-slate-800 rounded text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Filter Toggle */}
          {allowFilter && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-300'}`}
              title="Toggle Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          )}

          {/* Export */}
          {allowExport && (
            <button
              onClick={exportTimeline}
              className="p-2 hover:bg-slate-800 rounded text-slate-300"
              title="Export Timeline"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex gap-3 flex-wrap">
            {['transaction', 'evidence', 'milestone', 'risk_flag'].map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.has(type)}
                  onChange={() => toggleType(type)}
                  className="rounded"
                />
                <span className="text-sm text-slate-300 capitalize">
                  {getEventIcon(type)} {type.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Virtualized Timeline Content */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-6 tactical-scrollbar"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
      >
        {virtualItems.length > 0 ? (
          <div 
            className="relative"
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
  {/* Vertical Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

            {/* Virtualized Items */}
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = virtualItems[virtualRow.index];
              
              if (item.type === 'date') {
                return (
                  <div
                    key={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="mb-4">
                      <h4 className="text-cyan-400 font-mono text-sm">
                        {new Date(item.data).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                    </div>
                  </div>
                );
              }

              // Event item
              const event = item.data as TimelineEvent;
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className="relative pl-12 cursor-pointer hover:bg-slate-800/30 rounded-lg p-3 -ml-3 transition-colors"
                    onClick={() => onEventClick?.(event)}
                  >
                    {/* Event Dot */}
                    <div className={`absolute left-2.5 top-5 w-3 h-3 rounded-full ${getEventColor(event)} ring-4 ring-slate-900`} />

                    {/* Event Card */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getEventIcon(event.type)}</span>
                          <h5 className="text-white font-medium">{event.title}</h5>
                          {event.riskLevel && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              event.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                              event.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              event.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {event.riskLevel.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs font-mono">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-slate-300 text-sm mb-2">{event.description}</p>

                      {/* Metadata */}
                      <div className="flex gap-4 text-xs text-slate-400">
                        {event.entity && (
                          <span>Entity: <span className="text-cyan-400">{event.entity}</span></span>
                        )}
                        {event.amount !== undefined && (
                          <span>Amount: <span className="text-green-400">
                            {event.currency || ''} {event.amount.toLocaleString()}
                          </span></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No events match the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
