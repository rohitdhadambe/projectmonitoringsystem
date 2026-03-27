from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from database import get_db
from BudgetProposal.models import BudgetProposal
from BudgetProposal.schema import (
    BudgetProposalCreate,
    BudgetProposalResponse,
    BudgetSubmit,
    BudgetReview,
)
from Project.models import Project

router = APIRouter(prefix="/budget", tags=["Budget"])


# ─────────────────────────────────────────────────────────────────────────────
# 1. CREATE budget draft  (PM only)
# POST /budget/
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=BudgetProposalResponse)
async def create_budget(
    payload: BudgetProposalCreate,
    db: AsyncSession = Depends(get_db),
):
    # ✅ Project must exist
    project = await db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    # ✅ Only PM of this project can create
    if project.project_manager_id != payload.created_by:
        raise HTTPException(403, "Only the project manager can create a budget")

    # ✅ No duplicate budget
    existing = await db.execute(
        select(BudgetProposal).where(
            BudgetProposal.project_id == payload.project_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Budget already exists for this project")

    budget = BudgetProposal(**payload.model_dump())
    db.add(budget)
    await db.commit()
    await db.refresh(budget)
    return budget


# ─────────────────────────────────────────────────────────────────────────────
# 2. GET budget for a project
# GET /budget/project/{project_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/project/{project_id}", response_model=BudgetProposalResponse)
async def get_budget(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BudgetProposal).where(
            BudgetProposal.project_id == project_id
        )
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(404, "No budget found for this project")
    return budget


# ─────────────────────────────────────────────────────────────────────────────
# 3. SUBMIT budget to committee  (PM sends it)
# POST /budget/{budget_id}/submit
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/{budget_id}/submit", response_model=BudgetProposalResponse)
async def submit_budget(
    budget_id: int,
    payload: BudgetSubmit,
    db: AsyncSession = Depends(get_db),
):
    budget = await db.get(BudgetProposal, budget_id)
    if not budget:
        raise HTTPException(404, "Budget not found")

    # ✅ Only draft or revision_requested budgets can be submitted
    if budget.status not in ("draft", "revision_requested"):
        raise HTTPException(
            400,
            f"Cannot submit a budget with status '{budget.status}'"
        )

    # ✅ Verify PM
    project = await db.get(Project, budget.project_id)
    if project.project_manager_id != payload.submitted_by:
        raise HTTPException(403, "Only the project manager can submit the budget")

    budget.status       = "submitted"
    budget.submitted_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(budget)
    return budget


# ─────────────────────────────────────────────────────────────────────────────
# 4. COMMITTEE REVIEW — approve or request revision
# POST /budget/{budget_id}/review
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/{budget_id}/review", response_model=BudgetProposalResponse)
async def review_budget(
    budget_id: int,
    payload: BudgetReview,
    db: AsyncSession = Depends(get_db),
):
    budget = await db.get(BudgetProposal, budget_id)
    if not budget:
        raise HTTPException(404, "Budget not found")

    if budget.status != "submitted":
        raise HTTPException(400, "Budget must be submitted before review")

    if payload.action not in ("approved", "revision_requested"):
        raise HTTPException(400, "action must be 'approved' or 'revision_requested'")

    budget.status            = payload.action
    budget.committee_remarks = payload.committee_remarks

    if payload.action == "revision_requested":
        budget.revision_count = (budget.revision_count or 0) + 1

    await db.commit()
    await db.refresh(budget)
    return budget


# ─────────────────────────────────────────────────────────────────────────────
# 5. UPDATE budget (PM edits after revision request)
# PUT /budget/{budget_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/{budget_id}", response_model=BudgetProposalResponse)
async def update_budget(
    budget_id: int,
    payload: BudgetProposalCreate,
    db: AsyncSession = Depends(get_db),
):
    budget = await db.get(BudgetProposal, budget_id)
    if not budget:
        raise HTTPException(404, "Budget not found")

    if budget.status not in ("draft", "revision_requested"):
        raise HTTPException(
            400, "Budget can only be edited in draft or revision_requested state"
        )

    for key, val in payload.model_dump(exclude={"project_id", "created_by"}).items():
        setattr(budget, key, val)

    await db.commit()
    await db.refresh(budget)
    return budget