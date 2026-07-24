from calendar import monthrange
from datetime import date
from typing import List, Tuple


def get_month_bounds(year: int, month: int) -> Tuple[date, date]:
    """Return the first and last calendar day of the given year/month."""
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end


def get_last_n_months(months: int, anchor: date = None) -> List[Tuple[int, int]]:
    """
    Return a chronologically ordered list of (year, month) tuples for the
    last `months` months, inclusive of the anchor month (defaults to today).
    """
    reference = anchor or date.today()
    year, month = reference.year, reference.month
    result: List[Tuple[int, int]] = []
    for _ in range(months):
        result.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    result.reverse()
    return result
