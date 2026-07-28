import Card from "./Card";

const ICON_COLORS = {
  blue: "bg-blue-500/10 text-blue-500",
  indigo: "bg-indigo-500/10 text-indigo-500",
  green: "bg-green-500/10 text-green-500",
  red: "bg-red-500/10 text-red-500",
  amber: "bg-amber-500/10 text-amber-500",
  purple: "bg-purple-500/10 text-purple-500",
};

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  color = "blue",
  danger = false,
}) => {
  return (
    <Card
      className={`
        group
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        hover:shadow-black/20
        ${danger ? "border-red-400/25 bg-red-500/[0.03]" : ""}
      `}
    >
      <div className="mb-6 flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>

        {Icon && (
          <div
            className={`
              flex h-9 w-9 items-center justify-center rounded-xl
              transition-transform duration-300
              group-hover:scale-110
              ${ICON_COLORS[color]}
            `}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <p
        className="whitespace-nowrap text-3xl font-bold tracking-tight"
      >
        {value}
      </p>

      {subtext && (
        <p
          className={`
            mt-3
            text-sm
            ${
              danger
                ? "font-medium text-red-500 dark:text-red-400"
                : "text-slate-400"
            }
          `}
        >
          {subtext}
        </p>
      )}
    </Card>
  );
};

export default StatCard;