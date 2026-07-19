import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Download, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { AppState } from '../hooks/useGeoTagState';
import { generateExportImage } from '../utils/canvasExport';

interface LivePreviewProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export function LivePreview({ state, updateState }: LivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Position is stored as a percentage to be resolution independent
  const [positionPct, setPositionPct] = useState({ x: 0.05, y: 0.8 }); // Default to bottom left
  
  // Convert percentage back to pixels for Draggable
  const getPixelPosition = () => {
    if (!containerRef.current || !overlayRef.current) return { x: 0, y: 0 };
    const maxW = containerRef.current.clientWidth - overlayRef.current.clientWidth;
    const maxH = containerRef.current.clientHeight - overlayRef.current.clientHeight;
    return {
      x: positionPct.x * maxW,
      y: positionPct.y * maxH
    };
  };

  const handleDragStop = (e: any, data: { x: number, y: number }) => {
    if (!containerRef.current || !overlayRef.current) return;
    const maxW = containerRef.current.clientWidth - overlayRef.current.clientWidth;
    const maxH = containerRef.current.clientHeight - overlayRef.current.clientHeight;
    setPositionPct({
      x: Math.max(0, Math.min(1, data.x / maxW)),
      y: Math.max(0, Math.min(1, data.y / maxH))
    });
  };

  const handleExport = async () => {
    if (!state.imageSrc) return;
    setIsExporting(true);
    try {
      const dataUrl = await generateExportImage({
        imageSrc: state.imageSrc,
        overlayState: state,
        position: positionPct,
        scale: 1, // Will be calculated dynamically in canvasExport.ts
        quality: state.exportQuality / 100,
        format: state.exportFormat
      });

      const link = document.createElement('a');
      link.download = `geotag-${Date.now()}.${state.exportFormat === 'image/jpeg' ? 'jpg' : 'png'}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!state.imageSrc) return null;

  const formattedDate = format(state.date, 'MM/dd/yyyy');
  const formattedTime = format(state.date, 'hh:mm a');
  
  return (
    <div className="flex-1 bg-gray-100 flex flex-col p-6 overflow-hidden relative">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Live Preview</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Quality:</label>
            <select 
              value={state.exportQuality}
              onChange={(e) => updateState({ exportQuality: Number(e.target.value) })}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="100">100%</option>
              <option value="90">90%</option>
              <option value="80">80%</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Format:</label>
            <select 
              value={state.exportFormat}
              onChange={(e) => updateState({ exportFormat: e.target.value as any })}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Download Image'}
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 relative rounded-xl overflow-hidden shadow-2xl bg-black/5 flex items-center justify-center">
        <div className="relative w-full h-full" ref={containerRef}>
          <img 
            src={state.imageSrc} 
            alt="Preview" 
            className="w-full h-full object-contain pointer-events-none"
          />

          <Draggable 
            nodeRef={overlayRef}
            position={getPixelPosition()} 
            onStop={handleDragStop}
            bounds="parent"
          >
            <div 
              ref={overlayRef}
              className="absolute cursor-move overflow-hidden flex"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: state.cornerRadius,
                padding: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.2)',
                minWidth: '320px',
                maxWidth: '450px'
              }}
            >
              {/* Map Thumbnail */}
              {state.mapUrl && (
                <div className="shrink-0 mr-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden relative shadow-inner">
                    <img src={state.mapUrl} alt="Map" className="w-full h-full object-cover pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Text Info */}
              <div className="flex flex-col justify-center text-white font-sans text-shadow-sm">
                
                <div className="flex items-center gap-2 mb-1">
                  {state.showLogo && (
                     <Camera className="text-white/90" size={20} />
                  )}
                  <h3 className="text-xl font-bold tracking-tight">{state.locationName || 'Location'}</h3>
                </div>
                
                {state.address && (
                  <p className="text-[13px] leading-snug text-white/90 mb-2 max-w-[250px]">
                    {state.address}
                  </p>
                )}
                
                {(state.lat || state.lng) && (
                  <div className="text-[12px] font-medium text-white/80 mb-2 space-y-0.5 tracking-wide">
                    {state.lat && <div>Lat {state.lat}°</div>}
                    {state.lng && <div>Long {state.lng}°</div>}
                  </div>
                )}
                
                <div className="text-[13px] font-medium text-white/95 tracking-wide">
                  <div>{formattedDate}</div>
                  <div>{formattedTime} {state.timezone}</div>
                </div>
              </div>
            </div>
          </Draggable>

        </div>
      </div>
    </div>
  );
}
