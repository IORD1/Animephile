export default function Bubble({ children, className = '', style = {} }) {
  return (
    <div className={`bubble ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
