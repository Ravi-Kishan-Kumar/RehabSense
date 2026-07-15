import io
import json
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# Colours matching the app's dark theme (used as accent on white PDF)
TEAL = colors.HexColor("#00ffe0")
PURPLE = colors.HexColor("#7c3aed")
NAVY = colors.HexColor("#07111d")
GREEN = colors.HexColor("#10b981")
AMBER = colors.HexColor("#f59e0b")
RED = colors.HexColor("#ef4444")
GREY = colors.HexColor("#64748b")

def _quality_color(q: str):
    return {
        "good": GREEN,
        "warn": AMBER,
        "bad": RED,
    }.get(q, GREY)

def generate_session_pdf(session, user) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("title", fontSize=22, textColor=NAVY,
                                  fontName="Helvetica-Bold", spaceAfter=4)
    sub_style = ParagraphStyle("sub", fontSize=10, textColor=GREY,
                                fontName="Helvetica", spaceAfter=12)
    h2_style = ParagraphStyle("h2", fontSize=13, textColor=PURPLE,
                               fontName="Helvetica-Bold", spaceAfter=6, spaceBefore=14)
    body_style = ParagraphStyle("body", fontSize=9, textColor=colors.black,
                                 fontName="Helvetica", leading=14)
    tip_style = ParagraphStyle("tip", fontSize=9, textColor=NAVY,
                                fontName="Helvetica", leftIndent=10, leading=14)

    story = []

    # ── Header ──────────────────────────────────────────────────
    story.append(Paragraph("RehabSense", title_style))
    story.append(Paragraph("AI-Powered Rehabilitation Report", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=10))

    # ── Patient & Session info ───────────────────────────────────
    started = session.started_at.strftime("%d %b %Y, %I:%M %p") if session.started_at else "—"
    ended = session.ended_at.strftime("%I:%M %p") if session.ended_at else "Ongoing"
    duration_str = f"{session.duration_seconds // 60}m {session.duration_seconds % 60}s"

    info_data = [
        ["Patient", user.full_name, "Session ID", f"#{session.id}"],
        ["Email", user.email, "Date", started],
        ["Joint", session.joint_label, "Duration", duration_str],
        ["Exercise", session.exercise_name, "Type", session.exercise_type],
    ]
    info_table = Table(info_data, colWidths=[35*mm, 65*mm, 35*mm, 35*mm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
        ("TEXTCOLOR", (2, 0), (2, -1), NAVY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    # ── Rep Summary ─────────────────────────────────────────────
    story.append(Paragraph("Rep Summary", h2_style))
    acc_color = GREEN if session.accuracy >= 80 else AMBER if session.accuracy >= 50 else RED
    summary_data = [
        ["Total Reps", "Correct ✓", "Partial ⚠", "Incorrect ✗", "Accuracy", "Avg Score"],
        [
            str(session.total_reps),
            str(session.good_reps),
            str(session.warn_reps),
            str(session.bad_reps),
            f"{session.accuracy:.1f}%",
            f"{session.avg_score:.1f}",
        ],
    ]
    sum_table = Table(summary_data, colWidths=[28*mm]*6)
    sum_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (1, 1), (1, 1), GREEN),
        ("TEXTCOLOR", (2, 1), (2, 1), AMBER),
        ("TEXTCOLOR", (3, 1), (3, 1), RED),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 10))

    # ── Rep-by-Rep Log ──────────────────────────────────────────
    if session.rep_logs:
        story.append(Paragraph("Rep-by-Rep Log", h2_style))
        rep_data = [["Rep #", "Quality", "Score", "Angle", "Issues"]]
        for r in sorted(session.rep_logs, key=lambda x: x.rep_number):
            try:
                issues = json.loads(r.issues_json or "[]")
                issues_str = ", ".join(issues) if issues else "None"
            except Exception:
                issues_str = "—"
            rep_data.append([
                str(r.rep_number),
                r.quality.upper(),
                str(r.score),
                f"{r.angle:.1f}°",
                issues_str,
            ])
        rep_table = Table(rep_data, colWidths=[15*mm, 22*mm, 18*mm, 20*mm, 95*mm])
        ts = [
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (3, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        for i, r in enumerate(session.rep_logs, start=1):
            c = _quality_color(r.quality)
            ts.append(("TEXTCOLOR", (1, i), (1, i), c))
        rep_table.setStyle(TableStyle(ts))
        story.append(rep_table)
        story.append(Spacer(1, 10))

    # ── AI Advice ───────────────────────────────────────────────
    if session.ai_advice:
        adv = session.ai_advice
        story.append(Paragraph("AI Analysis & Recommendations", h2_style))
        story.append(Paragraph(adv.form_feedback, body_style))
        story.append(Spacer(1, 6))
        try:
            tips = json.loads(adv.tips_json or "[]")
        except Exception:
            tips = []
        for tip in tips:
            story.append(Paragraph(f"• {tip}", tip_style))
        story.append(Spacer(1, 6))
        next_info_data = [
            ["Next Exercise", adv.next_exercise or "—"],
            ["Next Reps", str(adv.next_reps)],
            ["Next Sets", str(adv.next_sets)],
            ["Difficulty", (adv.difficulty_adjustment or "maintain").capitalize()],
        ]
        next_table = Table(next_info_data, colWidths=[45*mm, 100*mm])
        next_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), NAVY),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(next_table)

    # ── Footer ──────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GREY))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"Generated by RehabSense · {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')} · "
        "For clinical use only — not a substitute for professional medical advice.",
        ParagraphStyle("footer", fontSize=7, textColor=GREY, fontName="Helvetica", alignment=TA_CENTER)
    ))

    doc.build(story)
    return buf.getvalue()
