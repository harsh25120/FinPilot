from datetime import date
from decimal import ROUND_CEILING, Decimal

from dateutil.relativedelta import relativedelta

from app.schemas.simulator import (
    GoalPlannerRequest,
    GoalPlannerResponse,
    ProjectionPoint,
    ProjectionRequest,
    ProjectionResponse,
)
from app.utils.exceptions import BadRequestException

MAX_SIMULATION_MONTHS = 1200


def run_projection(data: ProjectionRequest) -> ProjectionResponse:
    balance = data.starting_balance
    monthly_rate = Decimal(str(data.annual_interest_rate)) / Decimal("12")

    schedule = []
    total_contributed = Decimal("0")
    total_interest = Decimal("0")

    for month in range(1, data.months + 1):
        interest = (balance * monthly_rate).quantize(Decimal("0.01"))
        balance += interest + data.monthly_contribution
        total_contributed += data.monthly_contribution
        total_interest += interest
        schedule.append(
            ProjectionPoint(
                month=month,
                contribution=data.monthly_contribution,
                interest_earned=interest,
                balance=balance.quantize(Decimal("0.01")),
            )
        )

    return ProjectionResponse(
        final_balance=balance.quantize(Decimal("0.01")),
        total_contributed=total_contributed.quantize(Decimal("0.01")),
        total_interest_earned=total_interest.quantize(Decimal("0.01")),
        schedule=schedule,
    )


def run_goal_planner(data: GoalPlannerRequest) -> GoalPlannerResponse:
    remaining = data.target_amount - data.current_amount
    if remaining <= 0:
        return GoalPlannerResponse(months_needed=0, projected_completion_date=date.today(), feasible=True)

    if data.monthly_contribution is not None and data.monthly_contribution > 0:
        monthly_rate = Decimal(str(data.annual_interest_rate)) / Decimal("12")
        balance = data.current_amount
        months = 0

        while balance < data.target_amount and months < MAX_SIMULATION_MONTHS:
            interest = balance * monthly_rate
            balance += interest + data.monthly_contribution
            months += 1

        if months >= MAX_SIMULATION_MONTHS:
            return GoalPlannerResponse(feasible=False)

        completion_date = date.today() + relativedelta(months=months)
        feasible = True
        if data.target_date:
            feasible = completion_date <= data.target_date

        return GoalPlannerResponse(
            months_needed=months, projected_completion_date=completion_date, feasible=feasible
        )

    if data.target_date is not None:
        months_left = (data.target_date.year - date.today().year) * 12 + (
            data.target_date.month - date.today().month
        )
        if months_left <= 0:
            raise BadRequestException("target_date must be in the future")

        required = (remaining / Decimal(months_left)).quantize(Decimal("0.01"), rounding=ROUND_CEILING)
        return GoalPlannerResponse(
            required_monthly_contribution=required,
            months_needed=months_left,
            projected_completion_date=data.target_date,
            feasible=True,
        )

    raise BadRequestException("Either monthly_contribution or target_date must be provided")
