import { format } from "date-fns";

export interface OverlayState {
  locationName: string;
  address: string;
  lat: string;
  lng: string;
  date: Date;
  timezone: string;
  mapUrl: string;
}

export interface ExportConfig {
  imageSrc: string;
  overlayState: OverlayState;
  position: { x: number, y: number }; 
  scale: number; 
  quality: number; 
  format: 'image/jpeg' | 'image/png';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

export async function generateExportImage(config: ExportConfig): Promise<string> {
  const { imageSrc, overlayState, format: outputFormat, quality } = config;

  const mainImg = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = mainImg.width;
  canvas.height = mainImg.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(mainImg, 0, 0);

  const isPortrait = mainImg.height > mainImg.width;
  const overlayWidth = isPortrait ? mainImg.width * 0.85 : mainImg.width * 0.6;
  
  const padding = overlayWidth * 0.03;
  const cornerRadius = overlayWidth * 0.02;

  // Pre-calculate text to find required height
  const titleSize = overlayWidth * 0.04;
  const addressSize = overlayWidth * 0.025;
  const coordSize = overlayWidth * 0.022;
  const timeSize = overlayWidth * 0.022;
  
  // We need an estimated map size to calculate text wrapping width
  // Assume overlayHeight is roughly overlayWidth * 0.3 initially just for map size
  const estimatedMapSize = (overlayWidth * 0.3) - padding * 2;
  const textMaxWidth = overlayWidth - (estimatedMapSize + padding * 3);

  ctx.font = `normal ${titleSize}px sans-serif`;
  const locationLines = wrapText(ctx, overlayState.locationName, textMaxWidth);
  
  ctx.font = `normal ${addressSize}px sans-serif`;
  const addressLines = wrapText(ctx, overlayState.address, textMaxWidth);

  // Calculate actual height needed for text
  let totalTextHeight = padding * 1.2; // Top padding
  totalTextHeight += titleSize * 1.5; // "GPS Map Camera"
  totalTextHeight += locationLines.length * (titleSize * 1.2);
  totalTextHeight += padding * 0.2;
  totalTextHeight += addressLines.length * (addressSize * 1.2);
  totalTextHeight += padding * 0.4;
  totalTextHeight += coordSize * 1.5; // Lat/Long
  totalTextHeight += timeSize * 1.2; // Date/Time
  totalTextHeight += padding * 1.2; // Bottom padding

  // The overlay height should be the larger of the text height or a minimum ratio
  const overlayHeight = Math.max(overlayWidth * 0.28, totalTextHeight);

  // Center horizontally
  const x = (mainImg.width - overlayWidth) / 2;
  const margin = mainImg.height * 0.03;
  const y = mainImg.height - overlayHeight - margin;

  // Background box
  ctx.save();
  roundRect(ctx, x, y, overlayWidth, overlayHeight, cornerRadius);
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fill();
  ctx.restore();

  // Map Thumbnail
  // We make the map square, fitting the height of the overlay
  const mapSize = overlayHeight - padding * 2;
  const mapX = x + padding;
  const mapY = y + padding;
  
  if (overlayState.mapUrl) {
    try {
      const mapImg = await loadImage(overlayState.mapUrl);
      ctx.save();
      roundRect(ctx, mapX, mapY, mapSize, mapSize, cornerRadius * 0.5);
      ctx.clip();
      
      // Draw the tile filling the map box
      ctx.drawImage(mapImg, mapX, mapY, mapSize, mapSize);
      
      // Draw red pin EXACTLY in the center of the thumbnail
      const pinX = mapX + mapSize / 2;
      const pinY = mapY + mapSize / 2;
      
      ctx.beginPath();
      ctx.arc(pinX, pinY, mapSize * 0.08, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = mapSize * 0.015;
      ctx.stroke();

      ctx.restore();
      
      // Draw "Google" logo at bottom left of map thumbnail
      ctx.fillStyle = "white";
      ctx.font = `bold ${mapSize * 0.15}px sans-serif`;
      ctx.fillText("Google", mapX + mapSize * 0.05, mapY + mapSize - mapSize * 0.05);

    } catch (e) {
      console.error("Map load failed", e);
      ctx.fillStyle = "#333";
      roundRect(ctx, mapX, mapY, mapSize, mapSize, cornerRadius * 0.5);
      ctx.fill();
    }
  }

  // Text Styling Setup
  const textX = mapX + mapSize + padding;
  let currentY = y + padding * 1.2;
  ctx.fillStyle = "white";
  ctx.textBaseline = "top";
  
  // App Title "GPS Map Camera"
  ctx.font = `bold ${titleSize * 0.8}px sans-serif`;
  ctx.fillText("📷 GPS Map Camera", textX, currentY);
  currentY += titleSize * 1.5;

  // Location Name
  ctx.font = `normal ${titleSize}px sans-serif`;
  // Re-wrap text with the true mapSize
  const trueTextMaxWidth = overlayWidth - (mapSize + padding * 3);
  const finalLocationLines = wrapText(ctx, overlayState.locationName, trueTextMaxWidth);
  finalLocationLines.forEach(line => {
    ctx.fillText(line, textX, currentY);
    currentY += titleSize * 1.2;
  });
  
  // Address
  currentY += padding * 0.2;
  ctx.font = `normal ${addressSize}px sans-serif`;
  const finalAddressLines = wrapText(ctx, overlayState.address, trueTextMaxWidth);
  finalAddressLines.forEach(line => {
    ctx.fillText(line, textX, currentY);
    currentY += addressSize * 1.2;
  });
  
  currentY += padding * 0.4;

  // Coordinates
  ctx.font = `normal ${coordSize}px sans-serif`;
  ctx.fillText(`Lat ${overlayState.lat}° Long ${overlayState.lng}°`, textX, currentY);
  currentY += coordSize * 1.5;

  // Date and Time
  const formattedDate = format(overlayState.date, "dd/MM/yyyy");
  const formattedTime = format(overlayState.date, "hh:mm a");
  
  ctx.font = `normal ${timeSize}px sans-serif`;
  ctx.fillText(`${formattedDate} ${formattedTime} ${overlayState.timezone}`, textX, currentY);

  return canvas.toDataURL(outputFormat, quality);
}
