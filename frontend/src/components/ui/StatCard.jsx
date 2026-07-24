import Card from "./Card";

const ICON_COLORS = {
  blue: "bg-blue-500/10 text-blue-500",
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
}) => {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>

        {subtext && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {subtext}
          </p>
        )}
      </div>

      {Icon && (
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_COLORS[color]}`}
        >
          <Icon size={18} />
        </div>
      )}
    </Card>
  );
};

export default StatCard;