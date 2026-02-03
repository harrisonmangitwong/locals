import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
import textwrap
import base64
from pathlib import Path

def restaurant_card(rank, name, neighborhood, cuisine, reviews, score=None, popular_dish=None, photo_url=None):
    """Recommendation card.

    We render the card as raw HTML (no Markdown parsing) so Streamlit doesn't
    accidentally treat indented lines as a code block.
    """

    # Score badge is independent of whether we have a local tip

    score_badge_html = ""
    if score is not None:
        # Use a custom CSS tooltip (better than native title) — keep it short + readable
        tooltip_text = (
            f"Signal Score: {int(score)}/100\n\n"
            "High-band score (80–100) based on our model’s confidence after adjusting for tourist-driven hype and review noise.\n"
        )
        # Escape for embedding in an HTML attribute
        tooltip_attr = (
            tooltip_text
            .replace("&", "&amp;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;")
            .replace("\n", "&#10;")
        )
        score_badge_html = (
            f"<div class='pin-score' data-tooltip='{tooltip_attr}' aria-label='{tooltip_attr}'>"
            f"{int(score)}"
            "</div>"
        )

    popular_dish_html = ""
    if popular_dish:
        # Keep popular dish to one clean line
        popular_dish = " ".join(str(popular_dish).split())
        popular_dish = textwrap.shorten(popular_dish, width=80, placeholder="…")
        popular_dish_html = (
            f"<div class='local-tip'><span class='local-tip-label'>Popular Dish:</span>{popular_dish}</div>"
        )

    # IMPORTANT: no leading indentation on lines below (prevents markdown treating it as code)
    card_html = "\n".join(
        [
            "<div class='pin-card'>",
            (
                f"<div class='pin-thumb pin-thumb--hasimg'>"
                f"<img class='pin-thumb-img' src=\"{photo_url}\" alt=\"\" loading=\"lazy\" "
                f"data-fallbacks=\"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80|https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1400&q=80|https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=1400&q=80\" "
                f"onerror=\"(function(img){{var fb=(img.dataset.fallbacks||'').split('|').filter(Boolean); if(!img.dataset.fidx){{img.dataset.fidx='0';}} var i=parseInt(img.dataset.fidx,10); if(i<fb.length){{img.src=fb[i]; img.dataset.fidx=String(i+1); return;}} img.onerror=null; img.remove(); img.parentElement.classList.remove('pin-thumb--hasimg'); img.parentElement.classList.add('pin-thumb--fallback');}})(this)\" />"
                f"</div>"
                if photo_url and str(photo_url).strip()
                else "<div class='pin-thumb pin-thumb--fallback' aria-hidden='true'></div>"
            ),
            f"{score_badge_html}" if score_badge_html else "",
            "<div class='pin-body'>",
            "<div class='pin-top'>",
            f"<div class='pin-title'><span class='rank-pill'>#{rank}</span><span class='pin-name'>{name}</span></div>",
            "</div>",
            "<div class='pin-meta'>",
            f"<span class='pin-chip'><span class='meta-ico'>📍</span>{neighborhood}</span>",
            f"<span class='pin-chip'><span class='meta-ico'>🍽️</span>{cuisine}</span>",
            f"<span class='pin-chip'><span class='meta-ico'>🧾</span>{int(reviews):,}</span>",
            "</div>",
            f"{popular_dish_html}" if popular_dish_html else "",
            "<div class='pin-actions'>",
            "  <button class='pin-save' title='Save'>Save</button>",
            "</div>",
            "</div>",
            "</div>",
        ]
    ).strip()

    # Render card HTML (unsafe HTML ON)
    st.markdown(card_html, unsafe_allow_html=True)


st.set_page_config(page_title="Locals", layout="wide")

def render_topbar():
    st.markdown("<div class='topbar'>", unsafe_allow_html=True)
    left, right1, right2 = st.columns([7, 1.2, 1.2])

    with left:
        st.markdown(
            "<div class='brand'><span class='brand-emoji'>🍜</span><span class='brand-word'>Locals</span></div>",
            unsafe_allow_html=True,
        )

    # keys must be unique across pages/reruns
    page_key = st.session_state.get("page", "landing")

    with right1:
        if st.button("Log in", key=f"nav_login_{page_key}"):
            st.toast("Login coming soon", icon="🔐")

    with right2:
        if st.button("Sign up", key=f"nav_signup_{page_key}", type="primary"):
            st.toast("Signup coming soon", icon="✨")

    st.markdown("</div>", unsafe_allow_html=True)

# --- Simple routing (Landing -> Recommendations) ---
if "page" not in st.session_state:
    st.session_state.page = "landing"
if "city" not in st.session_state:
    st.session_state.city = "New York City"

# --- Global UX/UI styling (CSS) ---
st.markdown(
    """
    <style>
:root {
  --bg0: #fff7ed;
  --bg1: #ffffff;
  --ink: #0f172a;
  --muted: rgba(15, 23, 42, 0.62);
  --muted2: rgba(15, 23, 42, 0.42);
  --line: rgba(15, 23, 42, 0.10);
  --shadow1: 0 12px 28px rgba(15, 23, 42, 0.08);
  --shadow2: 0 18px 44px rgba(15, 23, 42, 0.12);
  --accent: #ff385c; /* Airbnb-ish coral */
  --accent2: #fb7185;
  --accentSoft: rgba(255, 56, 92, 0.10);
  --cardGrad: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,247,237,0.92) 100%);
  --radius: 20px;
}

/* Page background + typography */
.stApp {
  background: #fafafa; /* clean Pinterest-like canvas */
  color: var(--ink);
}

html, body, [class*="css"] {
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}

h1, h2, h3 {
  letter-spacing: -0.03em;
}

/* Top bar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 18px 0 12px 0;
  background: linear-gradient(180deg, rgba(250,250,250,0.98) 0%, rgba(250,250,250,0.86) 70%, rgba(250,250,250,0.00) 100%);
  backdrop-filter: blur(10px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: rgba(15,23,42,0.96);
  font-size: 30px;
  line-height: 1;
}

.brand-emoji { font-size: 30px; }
.brand-word  { font-size: 30px; }

/* Tighten nav button sizing */
.topbar div.stButton > button {
  width: 100%;
  justify-content: center;
  padding: 0.55rem 0.9rem !important;
}

/* Sidebar */
section[data-testid="stSidebar"] {
  background: rgba(255,255,255,0.86);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0,0,0,0.06);
}

/* Sidebar text was getting washed out (white-on-white). Force readable ink. */
section[data-testid="stSidebar"],
section[data-testid="stSidebar"] * {
  color: rgba(15,23,42,0.92) !important;
}

/* Keep muted helper text still muted (but visible) */
section[data-testid="stSidebar"] .stCaption,
section[data-testid="stSidebar"] [data-testid="stCaption"],
section[data-testid="stSidebar"] small {
  color: rgba(15,23,42,0.55) !important;
}

/* Make sidebar buttons look like buttons (not white-on-white) */
section[data-testid="stSidebar"] div.stButton > button {
  background: rgba(15,23,42,0.04) !important;
  border: 1px solid rgba(15,23,42,0.16) !important;
  color: rgba(15,23,42,0.92) !important;
  box-shadow: 0 8px 18px rgba(15,23,42,0.08) !important;
}

section[data-testid="stSidebar"] div.stButton > button:hover {
  border-color: rgba(255,56,92,0.40) !important;
  box-shadow: 0 12px 26px rgba(15,23,42,0.10) !important;
}

/* Keep primary buttons in sidebar as your coral gradient */
section[data-testid="stSidebar"] div.stButton > button[kind="primary"] {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 14px 28px rgba(255, 56, 92, 0.22) !important;
}

/* Sidebar collapse/expand (hamburger) control — keep it dark even when sidebar is closed */
button[data-testid="collapsedControl"],
button[data-testid="stSidebarCollapseButton"],
button[aria-label="Close sidebar"],
button[aria-label="Open sidebar"] {
  background: rgba(15,23,42,0.92) !important; /* dark/black pill */
  border: 1px solid rgba(15,23,42,0.92) !important;
  border-radius: 12px !important;
  box-shadow: 0 12px 28px rgba(15,23,42,0.22) !important;
}

/* Some Streamlit builds use stroke instead of fill — set both */
button[data-testid="collapsedControl"] svg,
button[data-testid="stSidebarCollapseButton"] svg,
button[aria-label="Close sidebar"] svg,
button[aria-label="Open sidebar"] svg {
  fill: rgba(255,255,255,0.98) !important;
  color: rgba(255,255,255,0.98) !important;
}

button[data-testid="collapsedControl"] svg * ,
button[data-testid="stSidebarCollapseButton"] svg * ,
button[aria-label="Close sidebar"] svg * ,
button[aria-label="Open sidebar"] svg * {
  fill: rgba(255,255,255,0.98) !important;
  stroke: rgba(255,255,255,0.98) !important;
}

button[data-testid="collapsedControl"]:hover,
button[data-testid="stSidebarCollapseButton"]:hover,
button[aria-label="Close sidebar"]:hover,
button[aria-label="Open sidebar"]:hover {
  background: rgba(15,23,42,0.82) !important;
  border-color: rgba(15,23,42,0.82) !important;
  box-shadow: 0 16px 34px rgba(15,23,42,0.26) !important;
}

button[data-testid="collapsedControl"]:active,
button[data-testid="stSidebarCollapseButton"]:active,
button[aria-label="Close sidebar"]:active,
button[aria-label="Open sidebar"]:active {
  transform: translateY(1px);
  box-shadow: 0 10px 22px rgba(15,23,42,0.22) !important;
}

/* Inputs */

/* Fix selectbox value text showing as white-on-white (Streamlit/BaseWeb) */
div[data-baseweb="select"] * {
  color: rgba(15,23,42,0.92) !important;
}

div[data-baseweb="select"] input {
  color: rgba(15,23,42,0.92) !important;
}

div[data-baseweb="select"] input::placeholder {
  color: rgba(15,23,42,0.42) !important;
}

/* Dropdown menu items */
ul[role="listbox"] li,
ul[role="listbox"] span {
  color: rgba(15,23,42,0.92) !important;
}

.stSelectbox > div > div {
  background: rgba(255,255,255,0.96);
  border: 1px solid var(--line);
  border-radius: 12px;
}

.stSelectbox > div > div:hover {
  border-color: rgba(255, 56, 92, 0.40);
}

.stSelectbox > div > div:focus-within {
  border-color: rgba(255, 56, 92, 0.75);
  box-shadow: 0 0 0 3px rgba(255, 56, 92, 0.14);
}

/* Buttons */
div.stButton > button {
  border-radius: 12px !important;
  padding: 0.55rem 1.05rem !important;
  font-weight: 750 !important;
  border: 1px solid rgba(15,23,42,0.14) !important;
  background: rgba(255,255,255,0.98) !important;
  color: rgba(15,23,42,0.92) !important;
  box-shadow: 0 8px 18px rgba(15,23,42,0.10);
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease;
  line-height: 1.1;
}

div.stButton > button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(15,23,42,0.14);
  border-color: rgba(15,23,42,0.24) !important;
}

div.stButton > button:active {
  transform: translateY(0px);
  box-shadow: 0 8px 18px rgba(15,23,42,0.12);
}

/* Primary buttons */
div.stButton > button[kind="primary"] {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 14px 28px rgba(255, 56, 92, 0.22);
}

div.stButton > button[kind="primary"]:hover {
  box-shadow: 0 18px 34px rgba(255, 56, 92, 0.28);
  filter: brightness(0.99);
}

/* Card styling */
.locals-card {
  position: relative;
  overflow: hidden;
  background: var(--cardGrad);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px 18px 16px 18px;
  margin: 14px 0;
  box-shadow: var(--shadow1);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.locals-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, rgba(255,56,92,0.95) 0%, rgba(255,209,102,0.80) 100%);
}

.locals-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow2);
  border-color: rgba(15,23,42,0.16);
}

.card-title {
  font-size: 20px;
  font-weight: 850;
  line-height: 1.15;
  margin-bottom: 4px;
  color: var(--ink);
}

.locals-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.meta-ico {
  opacity: 0.9;
}

.meta-dot::before {
  content: "•";
  opacity: 0.45;
}

/* Landing page polish */
.landing-shell {
  max-width: 720px;
  margin: 0 auto;
  padding-top: 18px;
}

/* Landing-only: hide the stray empty text-input bar (Streamlit testids vary by version) */
.landing-shell .stTextInput,
.landing-shell [data-testid^="stTextInput"] {
  display: none !important;
}

.landing-panel {
  background: rgba(255,255,255,0.78);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 18px 18px 14px 18px;
  box-shadow: var(--shadow1);
}

/* Responsive */
@media (max-width: 900px) {
  .locals-card { padding-right: 18px; }
}

.card-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-save-btn {
  border-radius: 10px;
  padding: 0.38rem 0.75rem;
  font-weight: 700;
  font-size: 13px;
  border: none;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  color: white;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(255,56,92,0.25);
}

.card-save-btn:hover {
  box-shadow: 0 14px 28px rgba(255,56,92,0.32);
  transform: translateY(-1px);
}

/* ===== Pinterest-like masonry + premium card system ===== */

/* Score badge (top-right on card) */
.pin-score {
  position: absolute;
  /* sit in the white body area (below banner) */
  top: calc(var(--thumbH) + 18px);
  right: 18px;

  /* smaller, Pinterest-y badge */
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
  letter-spacing: -0.01em;

  /* clean coral badge (not white-on-white) */
  color: #ffffff;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 14px 30px rgba(255, 56, 92, 0.26);

  user-select: none;
  transition: transform 140ms ease, box-shadow 140ms ease, filter 140ms ease;
}

.pin-card:hover .pin-score {
  transform: translateY(-1px);
  box-shadow: 0 18px 40px rgba(255, 56, 92, 0.32);
  filter: saturate(1.03);
}

/* Custom tooltip blurb for the score badge */
.pin-score { cursor: help; }

.pin-score::after {
  content: attr(data-tooltip);
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 260px;
  white-space: pre-line;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15,23,42,0.92);
  color: rgba(255,255,255,0.96);
  font-weight: 650;
  font-size: 12px;
  line-height: 1.35;
  letter-spacing: -0.01em;
  box-shadow: 0 18px 44px rgba(15,23,42,0.25);
  border: 1px solid rgba(255,255,255,0.10);
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
  transition: opacity 140ms ease, transform 140ms ease;
  z-index: 80;
}

.pin-score::before {
  content: "";
  position: absolute;
  right: 14px;
  top: calc(100% + 4px);
  width: 10px;
  height: 10px;
  background: rgba(15,23,42,0.92);
  transform: rotate(45deg);
  opacity: 0;
  pointer-events: none;
  transition: opacity 140ms ease, transform 140ms ease;
  z-index: 79;
  border-left: 1px solid rgba(255,255,255,0.10);
  border-top: 1px solid rgba(255,255,255,0.10);
}

.pin-score:hover::after,
.pin-score:focus::after {
  opacity: 1;
  transform: translateY(0);
}

.pin-score:hover::before,
.pin-score:focus::before {
  opacity: 1;
  transform: rotate(45deg) translateY(0);
}

/* Keep tooltip on-screen on narrow layouts */
@media (max-width: 760px) {
  .pin-score::after {
    right: -10px;
    width: 240px;
  }
}

/* Masonry container */
.reco-grid {
  column-count: 3;
  column-gap: 18px;
  padding-top: 6px;
}

@media (max-width: 1200px) { .reco-grid { column-count: 2; } }
@media (max-width: 760px)  { .reco-grid { column-count: 1; } }

/* Individual tile */
.pin-card {
  break-inside: avoid;
  display: inline-block;
  width: 100%;
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(15,23,42,0.10);
  border-radius: 20px;
  overflow: visible; /* allow tooltip to escape the card */
  box-shadow: 0 10px 26px rgba(15,23,42,0.10);
  margin: 0 0 18px 0;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  position: relative;
  --thumbH: 170px;
  z-index: 1;
}

.pin-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 44px rgba(15,23,42,0.14);
  border-color: rgba(15,23,42,0.16);
  z-index: 60; /* lift hovered card above neighbors so tooltip isn't clipped */
}

/* Thumbnail / banner image */
.pin-thumb {
  height: var(--thumbH);
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: rgba(15,23,42,0.04);
  /* fallback gradient if photo fails */
  background:
    radial-gradient(680px circle at 18% 20%, rgba(255, 56, 92, 0.22) 0%, rgba(255,255,255,0) 55%),
    radial-gradient(520px circle at 88% 10%, rgba(255, 209, 102, 0.22) 0%, rgba(255,255,255,0) 55%),
    linear-gradient(135deg, rgba(15,23,42,0.06) 0%, rgba(255,255,255,0.92) 62%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

/* When we have a real image, don't show the gradient behind it */
.pin-thumb--hasimg {
  background: none !important;
}

/* If fallback, keep the gradient */
.pin-thumb--fallback {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.pin-thumb-img {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block;
}

/* premium overlay for contrast */
.pin-thumb::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(15,23,42,0.18) 0%,
    rgba(15,23,42,0.00) 55%,
    rgba(15,23,42,0.10) 100%
  );
  pointer-events: none;
}



/* Body */
.pin-body {
  padding: 14px 72px 12px 14px; /* extra right space for score badge */
}

.rank-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 850;
  font-size: 12px;
  padding: 6px 9px;
  border-radius: 999px;
  background: rgba(255, 56, 92, 0.12);
  color: rgba(255, 56, 92, 0.95);
  margin-right: 10px;
}

.pin-title {
  display: flex;
  align-items: center;
  gap: 0;
}

.pin-name {
  font-size: 18px;
  font-weight: 860;
  letter-spacing: -0.02em;
  color: rgba(15,23,42,0.96);
}

.pin-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.pin-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: rgba(15,23,42,0.70);
  background: rgba(15,23,42,0.04);
  border: 1px solid rgba(15,23,42,0.07);
  padding: 6px 10px;
  border-radius: 999px;
}

.pin-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}

.pin-save {
  border: none;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 850;
  font-size: 12.5px;
  color: #fff;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  box-shadow: 0 12px 26px rgba(255,56,92,0.22);
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease;
}

.pin-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 34px rgba(255,56,92,0.28);
}

.pin-sub {
  font-size: 12px;
  color: rgba(15,23,42,0.48);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Local tip becomes a tasteful callout */
.local-tip {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 209, 102, 0.10);
  border: 1px solid rgba(255, 209, 102, 0.22);
  color: rgba(15,23,42,0.78);
  font-size: 12.5px;
}

.local-tip-label {
  display: inline-block;
  font-weight: 850;
  color: rgba(15,23,42,0.78);
  margin-right: 4px;
}

/* === Remove Streamlit top chrome that can create a dark/white gradient band === */
header[data-testid="stHeader"],
header[data-testid="stHeader"] * {
  background: transparent !important;
}

header[data-testid="stHeader"] {
  height: 0px !important;
  border-bottom: none !important;
}

/* Some Streamlit versions wrap the header differently */
.stApp > header {
  background: transparent !important;
}

/* Also remove default top padding Streamlit reserves for the header */
.main .block-container {
  padding-top: 2.25rem;
}

/* Hide any accidental empty Streamlit text input bars globally */
[data-testid="stTextInput"]:has(input:placeholder-shown) {
  display: none !important;
}
    </style>
    """,
    unsafe_allow_html=True,
)

FOOD_BANNERS = [
    # Curated food/restaurant banners from Unsplash (stable URLs)
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1506089676908-3592f7389d4d?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?auto=format&fit=crop&w=1400&q=80",
]

# ---- Real photos for top restaurants (place files in ./assets) ----
# Put these images into: /Users/harrisonmwong/Desktop/locals/assets/
# Filenames below are what this code expects.
RAW_RESTAURANT_PHOTO_FILES = {
    # Put these images into: /Users/harrisonmwong/Desktop/locals/assets/
    # Filenames below are what this code expects.
    "Los Mariscos": "assets/los-mariscos.jpg",
    "Tasty Hand-Pulled Noodles": "assets/tasty-hand-pulled-noodles.jpg",
    "Fuskahouse": "assets/fuskahouse.jpg",
    "Arepa Lady": "assets/arepa-lady.jpg",
    "Spicy Village": "assets/spicy-village.jpg",

    # L’Industrie has a few common spellings in CSVs
    "L’Industrie Pizza": "assets/lindustrie-pizza.jpeg",
    "L'Industrie Pizza": "assets/lindustrie-pizza.jpeg",
    "L’industrie Pizza": "assets/lindustrie-pizza.jpeg",
    "Lindustrie Pizza": "assets/lindustrie-pizza.jpeg",

    "Little Neck Dumpling House": "assets/little-neck-dumpling-house.jpg",
    "Llama San": "assets/llama-san.jpg",

    # King of Falafel variants
    "King of Falafel Shawarma": "assets/king-of-falafel-shawarma.jpg",
    "King of Falafel & Shawarma": "assets/king-of-falafel-shawarma.jpg",
    "King of Falafel and Shawarma": "assets/king-of-falafel-shawarma.jpg",

    # Adda variants
    "Adda Indian Canteen": "assets/adda.jpeg",
    "Adda": "assets/adda.jpeg",

    # --- #10–19 assets ---
    "Carbone": "assets/carbone.jpeg",
    "Via Carota": "assets/via-carota.jpeg",
    "Tanoreen": "assets/tanoreen.jpeg",
    "Gramercy Tavern": "assets/gramcery-tavern.jpg",
    "Lucali": "assets/lucali.jpeg",

    # Mamoun's variants
    "Mamoun's Falafel": "assets/mamouns-falafel.jpg",
    "Mamoun’s Falafel": "assets/mamouns-falafel.jpg",
    "Mamouns Falafel": "assets/mamouns-falafel.jpg",

    # Peter Luger variants
    "Peter Luger": "assets/peter-luger.jpeg",
    "Peter Luger Steak House": "assets/peter-luger.jpeg",

    # Los Tacos No. 1 variants
    "Los Tacos No. 1": "assets/los-tacos-no-1.jpeg",
    "Los Tacos No 1": "assets/los-tacos-no-1.jpeg",
    "Los Tacos No.1": "assets/los-tacos-no-1.jpeg",

    # TAO variants
    "TAO Downtown": "assets/tao-downtown.jpeg",
    "Tao Downtown": "assets/tao-downtown.jpeg",

        # --- #20–25 assets ---
    # Katz's variants
    "Katz's Delicatessen": "assets/katz-deli.jpg",
    "Katz’s Delicatessen": "assets/katz-deli.jpg",
    "Katz Deli": "assets/katz-deli.jpg",
    "Katz's Deli": "assets/katz-deli.jpg",

    # Prince Street variants
    "Prince Street Pizza": "assets/prince-street-pizza.jpeg",
    "Prince St Pizza": "assets/prince-street-pizza.jpeg",

    # Russ & Daughters variants
    "Russ & Daughters": "assets/russ-daughters.jpg",
    "Russ and Daughters": "assets/russ-daughters.jpg",
    "Russ Daughters": "assets/russ-daughters.jpg",

    # Shake Shack variants
    "Shake Shack": "assets/shake-shack.jpg",

    # Superiority Burger variants
    "Superiority Burger": "assets/superiority-burger.jpeg",

    # Xi'an Famous Foods variants
    "Xi'an Famous Foods": "assets/xian-famous-food.jpeg",
    "Xi’an Famous Foods": "assets/xian-famous-food.jpeg",
    "Xian Famous Foods": "assets/xian-famous-food.jpeg",
}

def _norm_name(s: str) -> str:
    if s is None:
        return ""
    s = str(s).strip().lower()
    s = s.replace("’", "'")
    # simplify punctuation to spaces
    out = []
    prev_space = False
    for ch in s:
        if ch.isalnum():
            out.append(ch)
            prev_space = False
        else:
            if not prev_space:
                out.append(" ")
                prev_space = True
    return " ".join("".join(out).split())

# Normalize RAW_RESTAURANT_PHOTO_FILES keys once so lookups match CSV names reliably
RESTAURANT_PHOTO_FILES = {}
for k, v in RAW_RESTAURANT_PHOTO_FILES.items():
    nk = _norm_name(k)
    RESTAURANT_PHOTO_FILES[nk] = v
    RESTAURANT_PHOTO_FILES[nk.replace(" ", "")] = v  # also support space-stripped lookups

# ---- Popular dish (curated, traveler-friendly) ----
POPULAR_DISHES_RAW = {
    "Los Mariscos": "Fish tacos",
    "Tasty Hand-Pulled Noodles": "Spicy cumin lamb noodles",
    "Fuskahouse": "Fuska (street snack) + chai",
    "Arepa Lady": "Classic arepa (cheese + meat)",
    "Spicy Village": "Big Tray Chicken",

    "L’Industrie Pizza": "Burrata slice",
    "L'Industrie Pizza": "Burrata slice",
    "Lindustrie Pizza": "Burrata slice",
    "L’industrie Pizza": "Burrata slice",

    "Little Neck Dumpling House": "Soup dumplings (xiao long bao)",
    "Llama San": "Crispy chicken / rotisserie-style chicken",

    "King of Falafel Shawarma": "Falafel sandwich",
    "King of Falafel & Shawarma": "Falafel sandwich",
    "King of Falafel and Shawarma": "Falafel sandwich",

    "Adda Indian Canteen": "Chicken tikka masala",
    "Adda": "Chicken tikka masala",

    "Carbone": "Spicy rigatoni vodka",
    "Via Carota": "Cacio e pepe",
    "Tanoreen": "Lamb kebabs",
    "Gramercy Tavern": "Tavern burger",
    "Lucali": "Classic pizza (thin crust)",

    "Mamoun's Falafel": "Falafel sandwich",
    "Mamoun’s Falafel": "Falafel sandwich",
    "Mamouns Falafel": "Falafel sandwich",

    "Peter Luger": "Porterhouse steak",
    "Peter Luger Steak House": "Porterhouse steak",

    "Los Tacos No. 1": "Adobada taco",
    "Los Tacos No 1": "Adobada taco",
    "Los Tacos No.1": "Adobada taco",

    "TAO Downtown": "Crispy rice",
    "Tao Downtown": "Crispy rice",

    "Katz's Delicatessen": "Pastrami on rye",
    "Katz’s Delicatessen": "Pastrami on rye",

    "Prince Street Pizza": "Pepperoni square slice",

    "Shake Shack (Madison Sq Park)": "ShackBurger",

    "Russ & Daughters Cafe": "Smoked salmon bagel",

    "Superiority Burger": "Signature veggie burger",

    "Xi'an Famous Foods": "Spicy cumin lamb noodles",
    "Xi’an Famous Foods": "Spicy cumin lamb noodles",
    "Xian Famous Foods": "Spicy cumin lamb noodles",
}

POPULAR_DISHES = {}
for k, v in POPULAR_DISHES_RAW.items():
    nk = _norm_name(k)
    POPULAR_DISHES[nk] = v
    POPULAR_DISHES[nk.replace(" ", "")] = v

def _file_to_data_uri(rel_path: str) -> str:
    """Return data URI for an image file if it exists; else empty string.

    Accepts a repo-relative path like "assets/foo.jpg" OR an absolute path.
    If the exact file doesn't exist, tries common extension fallbacks.
    """
    try:
        base = Path(__file__).resolve().parent
        p = Path(rel_path)
        if not p.is_absolute():
            p = base / rel_path

        # If missing, try swapping extensions (common when users download .jpg vs .jpeg)
        if (not p.exists() or not p.is_file()) and p.suffix:
            stem = p.with_suffix("")
            for ext in [".jpg", ".jpeg", ".png", ".webp"]:
                cand = stem.with_suffix(ext)
                if cand.exists() and cand.is_file():
                    p = cand
                    break

        if not p.exists() or not p.is_file():
            return ""

        ext = p.suffix.lower().lstrip(".")
        mime = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
        }.get(ext, "image/jpeg")

        b = p.read_bytes()
        enc = base64.b64encode(b).decode("utf-8")
        return f"data:{mime};base64,{enc}"
    except Exception:
        return ""

# Discover asset by slug helper
def _asset_uri_by_slug(slug: str) -> str:
    """Try to find an asset image by slug in ./assets with any common extension."""
    try:
        assets_dir = Path(__file__).resolve().parent / "assets"
        if not assets_dir.exists():
            return ""
        for ext in [".jpg", ".jpeg", ".png", ".webp"]:
            p = assets_dir / f"{slug}{ext}"
            uri = _file_to_data_uri(str(p))
            if uri:
                return uri
        return ""
    except Exception:
        return ""

def _restaurant_photo_url(name: str, seed: int) -> str:
    """Prefer a real restaurant photo (local asset) when available; else fallback."""
    key = _norm_name(name)

    # 0) Lightweight fuzzy matches for common CSV name variants
    # (helps when the CSV includes neighborhood/branch notes like "Adda Indian Canteen - Queens")
    if "adda" in key and ("canteen" in key or "indian" in key):
        uri = _file_to_data_uri("assets/adda.jpeg")
        if uri:
            return uri

    if "industrie" in key:
        uri = _file_to_data_uri("assets/lindustrie-pizza.jpeg")
        if uri:
            return uri

    if "mamoun" in key:
        uri = _file_to_data_uri("assets/mamouns-falafel.jpg")
        if uri:
            return uri

    if "peter" in key and "luger" in key:
        uri = _file_to_data_uri("assets/peter-luger.jpeg")
        if uri:
            return uri

    if "los" in key and "tacos" in key and ("no 1" in key or "no. 1" in key or "no1" in key):
        uri = _file_to_data_uri("assets/los-tacos-no-1.jpeg")
        if uri:
            return uri

    if "via" in key and "carota" in key:
        uri = _file_to_data_uri("assets/via-carota.jpeg")
        if uri:
            return uri

    if "gramercy" in key and "tavern" in key:
        uri = _file_to_data_uri("assets/gramcery-tavern.jpg")
        if uri:
            return uri
    
    if "katz" in key:
        uri = _file_to_data_uri("assets/katz-deli.jpg")
        if uri:
            return uri

    if "prince" in key and "street" in key:
        uri = _file_to_data_uri("assets/prince-street-pizza.jpeg")
        if uri:
            return uri

    if "russ" in key and "daughters" in key:
        uri = _file_to_data_uri("assets/russ-daughters.jpg")
        if uri:
            return uri

    if "shake" in key and "shack" in key:
        uri = _file_to_data_uri("assets/shake-shack.jpg")
        if uri:
            return uri

    if "superiority" in key and "burger" in key:
        uri = _file_to_data_uri("assets/superiority-burger.jpeg")
        if uri:
            return uri

    if ("xian" in key or "xi an" in key) and "famous" in key:
        uri = _file_to_data_uri("assets/xian-famous-food.jpeg")
        if uri:
            return uri

    # 1) Try explicit mapping (normalized name -> relative file path)
    rel = RESTAURANT_PHOTO_FILES.get(key, "")
    if not rel:
        rel = RESTAURANT_PHOTO_FILES.get(key.replace(" ", ""), "")
    if rel:
        uri = _file_to_data_uri(rel)
        if uri:
            return uri

    # 2) Try a few known slugs (helps when CSV names vary)
    for slug in [
        "adda",
        "adda-indian-canteen",
        "lindustrie-pizza",
        "lindustrie",
        "king-of-falafel-shawarma",
        "los-mariscos",
        "tasty-hand-pulled-noodles",
        "fuskahouse",
        "arepa-lady",
        "spicy-village",
        "little-neck-dumpling-house",
        "llama-san",
        "carbone",
        "via-carota",
        "tanoreen",
        "gramcery-tavern",
        "lucali",
        "mamouns-falafel",
        "peter-luger",
        "los-tacos-no-1",
        "tao-downtown",
        "katz-deli",
        "prince-street-pizza",
        "russ-daughters",
        "shake-shack",
        "superiority-burger",
        "xian-famous-food",
        "xian-famous-foods",
    ]:
        uri = _asset_uri_by_slug(slug)
        if uri:
            return uri

    # 3) As a general fallback, build a slug from the restaurant name
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in str(name)).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    uri = _asset_uri_by_slug(slug)
    if uri:
        return uri

    return _banner_photo_url(seed)


def _banner_photo_url(seed: int) -> str:
    """Return a stable, high-quality food/restaurant banner (no API key)."""
    if not FOOD_BANNERS:
        return ""
    return FOOD_BANNERS[seed % len(FOOD_BANNERS)]

 # =========================
# Landing Page
# =========================
if st.session_state.page == "landing":
    st.markdown("<div class='landing-shell'>", unsafe_allow_html=True)

    st.title("🍜 Locals")
    st.markdown("### Anti-tourist food picks, ranked by local signals")
    st.caption("Tell us where you’re traveling — we’ll surface places that are less likely to be tourist traps.")

    st.subheader("Where are you traveling?")

    city = st.selectbox(
        "City",
        options=["New York City"],
        index=0,
        help="More cities coming soon."
    )

    st.session_state.city = city

    st.markdown(
        """
        <style>
        /* Landing CTA: keep text on one line */
        .landing-shell div.stButton > button[kind="primary"] {
          white-space: nowrap !important;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    c1, c2 = st.columns([2.4, 5.6])
    with c1:
        go = st.button("See recommendations", type="primary")
    # No caption in c2

    st.markdown("</div>", unsafe_allow_html=True)  # landing-panel
    st.markdown("</div>", unsafe_allow_html=True)  # landing-shell

    if go:
        st.session_state.page = "recommendations"
        st.rerun()

    st.stop()

# =========================
# Recommendations Page
# =========================
st.title("🍜 Locals")
# st.markdown(f"### {st.session_state.city} recs... without the tourist traps")

df = pd.read_csv("outputs/locals_recommendations.csv")

# Filters (sidebar)
with st.sidebar:
    st.header("Filters")
    neighborhoods = ["All"] + sorted(df["neighborhood"].dropna().unique().tolist())
    cuisines = ["All"] + sorted(df["cuisine"].dropna().unique().tolist())

    neighborhood = st.selectbox("Neighborhood", neighborhoods)
    cuisine = st.selectbox("Cuisine", cuisines)

    # tighter spacing between filters and actions
    st.markdown("<div style='height:10px'></div>", unsafe_allow_html=True)

    if st.button("Change city"):
        st.session_state.page = "landing"
        st.rerun()


filtered = df.copy()

if neighborhood != "All":
    filtered = filtered[filtered["neighborhood"] == neighborhood]

if cuisine != "All":
    filtered = filtered[filtered["cuisine"] == cuisine]

# st.markdown(f"**Showing {len(filtered)} places**")

# st.dataframe(
#     filtered[
#         [
#             "name",
#             "neighborhood",
#             "cuisine",
#             "num_reviews",
#             "p_safe_pick",
#             "adjusted_score",
#         ]
#     ].sort_values("p_safe_pick", ascending=False),
#     use_container_width=True,
# )

# sort however you currently do it (keep your existing sort)
filtered_sorted = filtered.sort_values("p_safe_pick", ascending=False).reset_index(drop=True)

# Map ML probability to a user-friendly score that still reflects the model,
# but keeps the "recommended" set in a high-confidence looking band (80–100).
# This is a *relative within the filtered list* score, monotonic with p_safe_pick.
if len(filtered_sorted) > 0:
    # rank pct in [0, 1]
    _pct = filtered_sorted["p_safe_pick"].rank(pct=True, method="first")

    # map to [80, 100], so the lowest item in the shown list is ~80
    filtered_sorted["Signal Score"] = (80 + 20 * _pct).round().astype(int)

    # ensure bounds and force the top item to 100
    filtered_sorted["Signal Score"] = filtered_sorted["Signal Score"].clip(80, 99)
    filtered_sorted.loc[filtered_sorted["p_safe_pick"].idxmax(), "Signal Score"] = 100
else:
    filtered_sorted["Signal Score"] = []

# add 1-indexed rank
filtered_sorted.insert(0, "Rank", filtered_sorted.index + 1)

# choose user-facing columns only
# user_view = filtered_sorted[["Rank", "name", "neighborhood", "cuisine", "num_reviews"]]

# user_view = user_view.rename(columns={"num_reviews": "Reviews"})

user_view = filtered_sorted[[
    "Rank",
    "name",
    "neighborhood",
    "cuisine",
    "num_reviews",
    "Signal Score",
]].rename(columns={
    "name": "Name",
    "neighborhood": "Neighborhood",
    "cuisine": "Cuisine",
    "num_reviews": "Reviews",
})

# st.dataframe(user_view, use_container_width=True, hide_index=True)
st.markdown(f"### {st.session_state.city} Recommendations")

st.caption("Curated picks designed to avoid tourist traps. Showing the strongest options first.")

st.markdown("<div class='reco-grid'>", unsafe_allow_html=True)
for _, row in user_view.iterrows():
    # Popular dish lookup (normalized to handle punctuation/spacing variants)
    _k = _norm_name(row["Name"])
    popular_dish = POPULAR_DISHES.get(_k) or POPULAR_DISHES.get(_k.replace(" ", ""))

    photo_url = _restaurant_photo_url(name=row["Name"], seed=int(row["Rank"]))

    restaurant_card(
        rank=int(row["Rank"]),
        name=row["Name"],
        neighborhood=row["Neighborhood"],
        cuisine=row["Cuisine"],
        reviews=int(row["Reviews"]),
        score=int(row["Signal Score"]),
        popular_dish=popular_dish,
        photo_url=photo_url,
    )
st.markdown("</div>", unsafe_allow_html=True)
