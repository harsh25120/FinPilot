from decimal import Decimal
from typing import Optional, Union

TWO_PLACES = Decimal("0.01")


def to_money(value: Optional[Union[Decimal, int, float, str]]) -> Decimal:
    """
    Convert a raw SQL aggregate result to a Decimal with exactly two decimal
    places. Needed because `coalesce(sum(numeric_column), 0)` returns a bare
    integer literal (scale 0) when there are no matching rows, instead of
    the column's NUMERIC(12,2) scale — without this, "no data" responses
    would serialize as "0" instead of the expected "0.00".
    """
    if value is None:
        return Decimal("0.00")
    return Decimal(value).quantize(TWO_PLACES)
