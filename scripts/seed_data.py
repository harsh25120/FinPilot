"""
Populate the database with a realistic demo user: six months of Indian
transaction history, active budgets, and in-progress financial goals.

Usage:
    python -m scripts.seed_data
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from dateutil.relativedelta import relativedelta

from app.database import SessionLocal
from app.models.budget import Budget
from app.models.category import Category
from app.models.goal import Goal
from app.models.transaction import Transaction
from app.models.user import User
from app.services.budget_service import compute_end_date
from app.services.category_service import DEFAULT_CATEGORIES
from app.utils.enums import BudgetPeriod, GoalStatus, TransactionType
from app.utils.security import hash_password

DEMO_EMAIL = "demo@finpilot.dev"
DEMO_PASSWORD = "DemoPass123!"
DEMO_FULL_NAME = "Rahul Sharma"
MONTHLY_SALARY = Decimal("75000")

# Curated 6-month salary timeline (oldest -> newest): a performance bonus in
# month 4, a small dip in month 6 from a leave deduction.
SALARY_TIMELINE = [
    (Decimal("68000"), "Monthly Salary"),
    (Decimal("70000"), "Monthly Salary"),
    (Decimal("72000"), "Monthly Salary"),
    (Decimal("82000"), "Monthly Salary (Performance Bonus Included)"),
    (Decimal("75000"), "Monthly Salary"),
    (Decimal("75000"), "Monthly Salary"),
]
# Freelance work landed in a few months only.
FREELANCE_TIMELINE = [
    None,
    ("Freelance Project - Landing Page", Decimal("4500")),
    ("Freelance Project - Portfolio Website", Decimal("5500")),
    ("Freelance Project - API Integration", Decimal("9000")),
    None,
    ("Freelance Project - Bug Fixes", Decimal("6500")),
]

# Small cashback rewards, most months.
CASHBACK_TIMELINE = [
    ("UPI Cashback", Decimal("120")),
    ("Amazon Cashback", Decimal("75")),
    None,
    ("Credit Card Cashback", Decimal("220")),
    ("PhonePe Cashback", Decimal("95")),
    ("Google Pay Cashback", Decimal("140")),
]

# Bank interest, credited almost every month.
BANK_INTEREST_TIMELINE = [
    Decimal("215"), Decimal("221"), Decimal("228"), Decimal("224"), Decimal("230"), Decimal("226"),
]

# Fixed monthly expenses
FIXED_MONTHLY_EXPENSES = {
    "Rent": [("Rent", Decimal("18000"), Decimal("18000"))],
    "Utilities": [
        ("Electricity Bill", Decimal("800"), Decimal("1600")),
        ("Jio Fiber", Decimal("799"), Decimal("899")),
        ("Jio Recharge", Decimal("199"), Decimal("399")),
    ],
    "Entertainment": [
        ("Netflix", Decimal("199"), Decimal("649")),
        ("Spotify", Decimal("119"), Decimal("149")),
    ],
}

# Variable daily expenses (category -> list of (description, low, high))
VARIABLE_EXPENSE_ITEMS = {
    "Groceries": [
        ("Blinkit Grocery", Decimal("150"), Decimal("700")),
        ("D-Mart", Decimal("500"), Decimal("2000")),
        ("Reliance Fresh", Decimal("300"), Decimal("1200")),
        ("BigBasket", Decimal("300"), Decimal("1500")),
    ],
    "Dining Out": [
        ("Swiggy Order", Decimal("150"), Decimal("450")),
        ("Zomato Dinner", Decimal("250"), Decimal("700")),
        ("Pizza Hut", Decimal("400"), Decimal("900")),
        ("Barbeque Nation", Decimal("1200"), Decimal("2500")),
    ],
    "Transportation": [
        ("Uber Ride", Decimal("80"), Decimal("350")),
        ("Rapido Ride", Decimal("60"), Decimal("220")),
        ("Metro Card Recharge", Decimal("200"), Decimal("800")),
        ("Petrol", Decimal("500"), Decimal("1500")),
        ("Parking Fee", Decimal("50"), Decimal("300")),
    ],
    "Shopping": [
        ("Amazon Purchase", Decimal("500"), Decimal("3000")),
        ("Flipkart Shopping", Decimal("500"), Decimal("3000")),
        ("Myntra Order", Decimal("800"), Decimal("2500")),
        ("Ajio Order", Decimal("700"), Decimal("2500")),
        ("Croma Purchase", Decimal("1200"), Decimal("5000")),
        ("Decathlon", Decimal("900"), Decimal("3500")),
    ],
    "Entertainment": [
        ("Steam Game", Decimal("200"), Decimal("2000")),
        ("Movie Tickets", Decimal("300"), Decimal("700")),
        ("BookMyShow", Decimal("250"), Decimal("900")),
        ("Bowling Night", Decimal("700"), Decimal("1800")),
    ],
    "Healthcare": [
        ("Apollo Pharmacy", Decimal("150"), Decimal("600")),
        ("Doctor Consultation", Decimal("500"), Decimal("1200")),
        ("Dental Checkup", Decimal("700"), Decimal("1500")),
    ],
    "Education": [
        ("Programming Books", Decimal("300"), Decimal("1200")),
        ("Udemy Course", Decimal("500"), Decimal("2500")),
        ("Coursera Subscription", Decimal("1000"), Decimal("3500")),
        ("LeetCode Premium", Decimal("1200"), Decimal("1800")),
    ],
}

# Draw frequency: groceries and dining dominate day-to-day spending.
VARIABLE_EXPENSE_WEIGHTS = {
    "Groceries": 10,
    "Dining Out": 5,
    "Transportation": 7,
    "Shopping": 3,
    "Entertainment": 3,
    "Healthcare": 2,
    "Education": 1,
}

# High-value purchases (category, description, low, high) — occasional, so
# not every month looks the same.
BIG_TICKET_ITEMS = [
    ("Shopping", "27-inch Monitor", Decimal("12000"), Decimal("18000")),
    ("Shopping", "Mechanical Keyboard", Decimal("4500"), Decimal("9000")),
    ("Shopping", "Ergonomic Office Chair", Decimal("7000"), Decimal("14000")),
    ("Shopping", "External SSD", Decimal("5000"), Decimal("9000")),
    ("Shopping", "Noise Cancelling Headphones", Decimal("8000"), Decimal("18000")),
    ("Shopping", "Weekend Trip Booking", Decimal("7000"), Decimal("15000")),
]


def _random_amount(low: Decimal, high: Decimal) -> Decimal:
    if low == high:
        return low
    return Decimal(str(round(random.uniform(float(low), float(high)), 2)))


def seed() -> None:
    random.seed(42)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            print(f"Demo user already exists ({DEMO_EMAIL}). Skipping seed.")
            return

        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name=DEMO_FULL_NAME,
            monthly_income=MONTHLY_SALARY,
            preferred_currency="INR",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        categories = [
            Category(user_id=user.id, name=name, type=ctype, icon=icon, color=color, is_default=True)
            for name, ctype, icon, color in DEFAULT_CATEGORIES
        ]
        db.add_all(categories)
        db.commit()
        for category in categories:
            db.refresh(category)

        categories_by_name = {c.name: c for c in categories}
        today = date.today()

        for months_ago in range(5, -1, -1):
            month_index = 5 - months_ago
            month_start = today.replace(day=1) - relativedelta(months=months_ago)

            # Monthly income
            salary_amount, salary_description = SALARY_TIMELINE[month_index]
            db.add(
                Transaction(
                    user_id=user.id,
                    category_id=categories_by_name["Salary"].id,
                    type=TransactionType.income,
                    amount=salary_amount,
                    currency=user.preferred_currency,
                    description=salary_description,
                    transaction_date=month_start + timedelta(days=1),
                )
            )

            freelance = FREELANCE_TIMELINE[month_index]
            if freelance:
                description, amount = freelance
                db.add(
                    Transaction(
                        user_id=user.id,
                        category_id=categories_by_name["Freelance"].id,
                        type=TransactionType.income,
                        amount=amount,
                        currency=user.preferred_currency,
                        description=description,
                        transaction_date=month_start + timedelta(days=random.randint(5, 24)),
                    )
                )

            cashback = CASHBACK_TIMELINE[month_index]
            if cashback:
                description, amount = cashback
                db.add(
                    Transaction(
                        user_id=user.id,
                        category_id=categories_by_name["Other Income"].id,
                        type=TransactionType.income,
                        amount=amount,
                        currency=user.preferred_currency,
                        description=description,
                        transaction_date=month_start + timedelta(days=random.randint(0, 27)),
                    )
                )

            db.add(
                Transaction(
                    user_id=user.id,
                    category_id=categories_by_name["Investments"].id,
                    type=TransactionType.income,
                    amount=BANK_INTEREST_TIMELINE[month_index],
                    currency=user.preferred_currency,
                    description="Bank Interest",
                    transaction_date=month_start + timedelta(days=random.randint(2, 6)),
                )
            )

            # Fixed monthly expenses
            for category_name, items in FIXED_MONTHLY_EXPENSES.items():
                category = categories_by_name[category_name]
                for description, low, high in items:
                    db.add(
                        Transaction(
                            user_id=user.id,
                            category_id=category.id,
                            type=TransactionType.expense,
                            amount=_random_amount(low, high),
                            currency=user.preferred_currency,
                            description=description,
                            transaction_date=month_start + timedelta(days=random.randint(0, 5)),
                        )
                    )

            # Variable daily expenses
            expense_category_names = list(VARIABLE_EXPENSE_WEIGHTS.keys())
            expense_weights = list(VARIABLE_EXPENSE_WEIGHTS.values())
            for _ in range(random.randint(18, 26)):
                category_name = random.choices(expense_category_names, weights=expense_weights, k=1)[0]
                description, low, high = random.choice(VARIABLE_EXPENSE_ITEMS[category_name])
                db.add(
                    Transaction(
                        user_id=user.id,
                        category_id=categories_by_name[category_name].id,
                        type=TransactionType.expense,
                        amount=_random_amount(low, high),
                        currency=user.preferred_currency,
                        description=description,
                        transaction_date=month_start + timedelta(days=random.randint(0, 27)),
                    )
                )

            # High-value purchases
            if random.random() < 0.3:
                category_name, description, low, high = random.choice(BIG_TICKET_ITEMS)
                db.add(
                    Transaction(
                        user_id=user.id,
                        category_id=categories_by_name[category_name].id,
                        type=TransactionType.expense,
                        amount=_random_amount(low, high),
                        currency=user.preferred_currency,
                        description=description,
                        transaction_date=month_start + timedelta(days=random.randint(0, 27)),
                    )
                )

        db.commit()

        # Budgets
        current_month_start = today.replace(day=1)
        budget_plan = [
            ("Groceries", Decimal("6000.00")),
            ("Dining Out", Decimal("5000.00")),
            ("Shopping", Decimal("12000.00")),
            ("Transportation", Decimal("6500.00")),
            ("Entertainment", Decimal("4000.00")),
        ]
        for name, amount in budget_plan:
            category = categories_by_name[name]
            db.add(
                Budget(
                    user_id=user.id,
                    category_id=category.id,
                    amount=amount,
                    period=BudgetPeriod.monthly,
                    start_date=current_month_start,
                    end_date=compute_end_date(current_month_start, BudgetPeriod.monthly),
                    alert_threshold=0.8,
                )
            )
        db.commit()

        # Goals
        goals = [
            Goal(
                user_id=user.id,
                name="Emergency Fund",
                description="Emergency savings for unexpected expenses.",
                target_amount=Decimal("100000.00"),
                current_amount=Decimal("42000.00"),
                target_date=today + relativedelta(months=8),
                status=GoalStatus.in_progress,
            ),
            Goal(
                user_id=user.id,
                name="MacBook Air",
                description="Saving for a MacBook Air.",
                target_amount=Decimal("95000.00"),
                current_amount=Decimal("52000.00"),
                target_date=today + relativedelta(months=5),
                status=GoalStatus.in_progress,
            ),
            Goal(
                user_id=user.id,
                name="Goa Trip",
                description="Vacation fund for a Goa trip.",
                target_amount=Decimal("40000.00"),
                current_amount=Decimal("32000.00"),
                target_date=today + relativedelta(months=2),
                status=GoalStatus.in_progress,
            ),
        ]
        db.add_all(goals)
        db.commit()

        print("Seed complete.")
        print(f"  Email:    {DEMO_EMAIL}")
        print(f"  Password: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()