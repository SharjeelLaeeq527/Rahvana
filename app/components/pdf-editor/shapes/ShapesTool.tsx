"use client";

export type ShapeType = "checkmark" | "cross";
interface ShapesToolProps {
  onShapeSelect: (shape: ShapeType) => void;
}

export function ShapesTool({ onShapeSelect }: ShapesToolProps) {
  const shapes: { type: ShapeType; icon: string; label: string }[] = [
    { type: "checkmark", icon: "✓", label: "Checkmark" },
    { type: "cross", icon: "✕", label: "Cross" },
  ];

  return (
    <div className="flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded shadow-lg">
      {shapes.map((shape) => (
        <button
          key={shape.type}
          onClick={() => onShapeSelect(shape.type)}
          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 rounded transition text-left"
        >
          <span className="text-2xl font-bold text-gray-700">{shape.icon}</span>
          <span className="text-sm font-medium text-gray-700">{shape.label}</span>
        </button>
      ))}
    </div>
  );
}

// Shape Component for rendering on PDF
interface ShapeAnnotation {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  color: string;
  pageIndex: number;
}

export function ShapeRenderer({ shape, scale }: { shape: ShapeAnnotation; scale: number }) {
  const renderShape = () => {
    const size = shape.size * scale;
    const commonStyle = {
      width: size,
      height: size,
      color: shape.color,
      fontSize: size,
      lineHeight: `${size}px`,
    };

    switch (shape.type) {
      case "checkmark":
        return (
          <span style={commonStyle} className="font-bold">
            ✓
          </span>
        );
      case "cross":
        return (
          <span style={commonStyle} className="font-bold">
            ✕
          </span>
        );
    }
  };

  return (
    <div
      className="absolute pointer-events-auto cursor-move"
      style={{
        left: shape.x * scale,
        top: shape.y * scale,
      }}
    >
      {renderShape()}
    </div>
  );
}
