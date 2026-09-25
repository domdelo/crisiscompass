"""
Scam Shield: rule-based fraud-signal detection for disaster-related
messages survivors forward to CrisisCompass.

Deliberately NOT a black-box ML classifier for the hackathon: every
result is explainable (which literal signals fired and why), grounded
in FTC/FEMA fraud guidance, and phrased with appropriate uncertainty
("possible_scam" / "suspicious"), never a flat certainty claim.
"""
import json
import logging
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

# backend/app/services/scam_engine.py -> repo root / data / government_sources
_GUIDANCE_PATH = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "government_sources"
    / "ftc-fema-impersonators.json"
)

_FALLBACK_GUIDANCE = {
    "title": "FEMA Disaster Fraud Guidance",
    "source_url": "https://www.fema.gov/disaster-fraud",
    "next_action": (
        "Do not send money or sensitive information. Verify disaster "
        "assistance through official government sources."
    ),
}


@lru_cache
def _load_guidance() -> dict:
    """Loads the FTC/FEMA impersonator guidance doc for grounding."""
    try:
        with open(_GUIDANCE_PATH) as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        logger.warning(
            "Could not load scam guidance source (%s); using fallback text.", e
        )
        return _FALLBACK_GUIDANCE


@dataclass(frozen=True)
class Signal:
    id: str
    description: str
    pattern: re.Pattern


_GOV_AGENCY_PATTERN = re.compile(
    r"\b(fema|irs|social security administration|ssa|dhs|department of "
    r"homeland security|red cross)\b",
    re.IGNORECASE,
)

_SIGNALS: list[Signal] = [
    Signal(
        id="payment_request",
        description="Requests payment, a fee, or money to receive assistance",
        pattern=re.compile(
            r"(\$\s?\d|\bpay\b|\bpayment\b|processing fee|wire transfer|"
            r"gift card|send money|western union|money order|cash app|"
            r"venmo|zelle)",
            re.IGNORECASE,
        ),
    ),
    Signal(
        id="sensitive_info_request",
        description="Asks for sensitive personal or financial information",
        pattern=re.compile(
            r"(social security number|\bssn\b|bank account|routing number|"
            r"credit card number|debit card|account number|date of birth|"
            r"\bpassword\b|\bpin number\b)",
            re.IGNORECASE,
        ),
    ),
    Signal(
        id="suspicious_link",
        description="Contains a link that is not an official .gov source",
        pattern=re.compile(
            r"https?://(?!([\w.-]*\.)?(gov|fema\.gov|disasterassistance\.gov)\b)"
            r"[^\s]+",
            re.IGNORECASE,
        ),
    ),
    Signal(
        id="urgency_pressure",
        description="Creates urgency or pressure to act immediately",
        pattern=re.compile(
            r"(act now|immediately|right away|urgent|expires? (today|soon|"
            r"in \d+ (hour|day)s?)|within \d+ (hour|day)s?|last chance|"
            r"final notice|today only)",
            re.IGNORECASE,
        ),
    ),
    Signal(
        id="guaranteed_claim",
        description="Makes a guaranteed approval or payment claim",
        pattern=re.compile(
            r"(guaranteed?|100% approved|pre-?approved|you('| a)ve been "
            r"selected|instant (approval|payment)|\bapproved\b.*\$)",
            re.IGNORECASE,
        ),
    ),
]


def _detect_government_impersonation(message: str, other_signal_ids: set[str]) -> Signal | None:
    """
    A government agency name alone isn't suspicious (real FEMA
    communications exist) — only flag impersonation when an agency
    name appears alongside another red flag like a payment or
    urgency signal, since that combination is what FEMA/FTC guidance
    warns about.
    """
    if not _GOV_AGENCY_PATTERN.search(message):
        return None
    if not other_signal_ids:
        return None
    return Signal(
        id="government_impersonation",
        description=(
            "Claims to be from a government agency while showing other "
            "warning signs (agencies do not request payment or sensitive "
            "info this way)"
        ),
        pattern=_GOV_AGENCY_PATTERN,
    )


def analyze_message(message: str) -> dict:
    """
    Analyzes a disaster-related message for fraud warning signs.

    Returns a dict matching the ScamCheckResponse contract:
      risk, warning_signs, recommendation, source_title, source_url
    """
    triggered: list[Signal] = [s for s in _SIGNALS if s.pattern.search(message)]
    triggered_ids = {s.id for s in triggered}

    impersonation_signal = _detect_government_impersonation(message, triggered_ids)
    if impersonation_signal:
        triggered.append(impersonation_signal)

    warning_signs = [s.description for s in triggered]
    signal_count = len(triggered)

    guidance = _load_guidance()

    if signal_count == 0:
        risk = "no_warning_signs_detected"
        recommendation = (
            "This message doesn't show the common warning signs CrisisCompass "
            "checks for, but disaster-related scams evolve quickly. Still "
            "verify any unexpected request through an official government "
            "source before acting."
        )
    elif signal_count == 1:
        risk = "suspicious"
        recommendation = (
            "This message has at least one warning sign. Verify it through "
            "an official government source before responding, and don't "
            "send money or personal information based on this message alone."
        )
    else:
        risk = "possible_scam"
        recommendation = (
            "This message shows multiple warning signs commonly used in "
            "disaster-related scams. Do not send money or personal "
            "information. Verify disaster assistance only through official "
            "government sources."
        )

    return {
        "risk": risk,
        "warning_signs": warning_signs,
        "recommendation": recommendation,
        "source_title": guidance.get("title", _FALLBACK_GUIDANCE["title"]),
        "source_url": guidance.get("source_url", _FALLBACK_GUIDANCE["source_url"]),
    }
