export default function Btn({ variant="green", className="", ...props }) {
  const base = "btn " + (variant==="green" ? "btn-green" : "btn-ghost");
  return <button {...props} className={`${base} ${className}`} />;
}
