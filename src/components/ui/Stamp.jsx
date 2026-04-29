export default function Stamp({
  children,
  size = 60,
  fontSize,
  rotate = -8,
  style = {},
  className = '',
}) {
  return (
    <div
      className={`stamp ${className}`.trim()}
      style={{
        width: size,
        height: size,
        fontSize: fontSize ?? size * 0.4,
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
