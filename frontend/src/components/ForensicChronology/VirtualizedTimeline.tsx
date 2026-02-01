/**
 * Virtualized Timeline Component
 * Handles 100K+ events efficiently using @tanstack/react-virtual
 * Replaces react-window for better compatibility with Next.js 15+
 */

import React, { useCallback, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TimelineEvent } from './ForensicChronology';
import { Clock, AlertTriangle, FileText, User } from 'lucide-react';
import EventDetailModal from './EventDetailModal';

interface VirtualizedTimelineProps {
  events: TimelineEvent[];
  height?: number;
  itemSize?: number;
  onEventClick?: (event: TimelineEvent) => void;
}

const VirtualizedTimeline: React.FC<VirtualizedTimelineProps> = ({
  events,
  height = 600,
  itemSize = 80,
  onEventClick,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
    overscan: 5,
  });

  const handleEventClick = useCallback((event: TimelineEvent) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      setSelectedEvent(event);
    }
  }, [onEventClick]);

  const closeModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'risk_flag':
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'evidence':
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'user_action':
        return <User className="w-5 h-5 text-purple-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return 'border-l-red-500 bg-red-500/5';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low':
        return 'border-l-green-500 bg-green-500/5';
      default:
        return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  return (
    <>
      <div className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
        {/* Performance stats */}
        <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {events.length.toLocaleString()} events
          </span>
          <span className="text-xs text-gray-500 font-mono">
            ⚡ NEURAL_VIRTUALIZER_STABLE
          </span>
        </div>

        {/* Virtualized list container */}
        <div
          ref={parentRef}
          className="overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
          style={{ height: `${height}px` }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const event = events[virtualItem.index];
              if (!event) return null;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  className="px-4 py-1"
                >
                  <button
                    onClick={() => handleEventClick(event)}
                    className={`
                      w-full h-full flex items-center gap-4 px-4 py-3
                      border-l-4 rounded-r-lg
                      ${getRiskColor(event.riskLevel)}
                      hover:bg-white/10 hover:shadow-lg
                      transition-all duration-200
                      cursor-pointer group
                    `}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getEventIcon(event.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm truncate">
                          {event.title}
                        </span>
                        {event.riskLevel && (
                          <span className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${event.riskLevel === 'critical' || event.riskLevel === 'high' ? 'bg-red-500/20 text-red-300' : ''}
                            ${event.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : ''}
                            ${event.riskLevel === 'low' ? 'bg-green-500/20 text-green-300' : ''}
                          `}>
                            {event.riskLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {event.description}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Hover indicator */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default VirtualizedTimeline;