import math
import pandas as pd
import streamlit as st
import textwrap
from pathlib import Path

def restaurant_card(rank, name, neighborhood, cuisine, reviews, popular_dish=None, photo_url=None, rating=None, maps_url=None):
    """Recommendation card.

    We render the card as raw HTML (no Markdown parsing) so Streamlit doesn't
    accidentally treat indented lines as a code block.
    """

    # Score badge is independent of whether we have a local tip

    popular_dish_html = ""
    if popular_dish:
        popular_dish = " ".join(str(popular_dish).split())
        popular_dish = textwrap.shorten(popular_dish, width=80, placeholder="…")
        popular_dish_html = (
            f"<div class='local-tip'><span class='local-tip-label'>Popular Dish:</span>{popular_dish}</div>"
        )

    rating_html = ""
    if rating is not None:
        try:
            r = float(rating)
            rating_html = f"<span class='pin-chip'><span class='meta-ico'>⭐</span>{r:.1f}</span>"
        except (ValueError, TypeError):
            pass

    maps_html = ""
    if maps_url and str(maps_url).strip():
        maps_html = f"<a class='pin-maps-link' href='{maps_url}' target='_blank' rel='noopener'>Open in Maps →</a>"

    # IMPORTANT: no leading indentation on lines below (prevents markdown treating it as code)
    card_html = "\n".join(
        [
            "<div class='pin-card'>",
            (
                f"<div class='pin-thumb pin-thumb--hasimg'>"
                f"<img class='pin-thumb-img' src=\"{photo_url}\" alt=\"\" loading=\"lazy\" "
                f"data-fallbacks=\"https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=65|https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=400&q=65|https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=400&q=65\" "
                f"onerror=\"(function(img){{var fb=(img.dataset.fallbacks||'').split('|').filter(Boolean); if(!img.dataset.fidx){{img.dataset.fidx='0';}} var i=parseInt(img.dataset.fidx,10); if(i<fb.length){{img.src=fb[i]; img.dataset.fidx=String(i+1); return;}} img.onerror=null; img.remove(); img.parentElement.classList.remove('pin-thumb--hasimg'); img.parentElement.classList.add('pin-thumb--fallback');}})(this)\" />"
                f"</div>"
                if photo_url and str(photo_url).strip()
                else "<div class='pin-thumb pin-thumb--fallback' aria-hidden='true'></div>"
            ),
            "<div class='pin-body'>",
            "<div class='pin-top'>",
            f"<div class='pin-title'><span class='rank-pill'>#{rank}</span><span class='pin-name'>{name}</span></div>",
            "</div>",
            "<div class='pin-meta'>",
            f"<span class='pin-chip'><span class='meta-ico'>📍</span>{neighborhood}</span>",
            f"<span class='pin-chip'><span class='meta-ico'>🍽️</span>{cuisine}</span>",
            f"<span class='pin-chip'><span class='meta-ico'>💬</span>{int(reviews):,}</span>",
            f"{rating_html}" if rating_html else "",
            "</div>",
            f"{popular_dish_html}" if popular_dish_html else "",
            "<div class='pin-actions'>",
            "  <button class='pin-save' title='Save' aria-label='Save'><svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/></svg></button>",
            f"  {maps_html}" if maps_html else "",
            "</div>",
            "</div>",
            "</div>",
        ]
    ).strip()

    return card_html


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
  --bg0: #0f0f0f;
  --bg1: #1a1a1a;
  --ink: #f1f5f9;
  --muted: rgba(241,245,249,0.62);
  --muted2: rgba(241,245,249,0.42);
  --line: rgba(255,255,255,0.08);
  --shadow1: 0 12px 28px rgba(0,0,0,0.45);
  --shadow2: 0 18px 44px rgba(0,0,0,0.55);
  --accent: #ff385c;
  --accent2: #fb7185;
  --accentSoft: rgba(255,56,92,0.15);
  --cardGrad: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  --radius: 20px;
}

/* Page background + typography */
.stApp {
  background: #111111;
  color: var(--ink);
}

/* Make all native Streamlit text elements light on dark background */
.stApp h1, .stApp h2, .stApp h3,
.stApp [data-testid="stHeadingWithActionElements"] {
  color: #f1f5f9 !important;
}
.stApp [data-testid="stMarkdownContainer"] p {
  color: rgba(241,245,249,0.80) !important;
}
.stApp [data-testid="stCaptionContainer"],
.stApp [data-testid="stCaption"] {
  color: rgba(241,245,249,0.52) !important;
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
  background: linear-gradient(180deg, rgba(17,17,17,0.98) 0%, rgba(17,17,17,0.86) 70%, rgba(17,17,17,0.00) 100%);
  backdrop-filter: blur(10px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: rgba(255,255,255,0.96);
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
  background: #1a1a1a;
  border-right: 1px solid rgba(255,255,255,0.06);
}

/* Sidebar text */
section[data-testid="stSidebar"],
section[data-testid="stSidebar"] * {
  color: rgba(241,245,249,0.92) !important;
}

/* Keep muted helper text still muted (but visible) */
section[data-testid="stSidebar"] .stCaption,
section[data-testid="stSidebar"] [data-testid="stCaption"],
section[data-testid="stSidebar"] small {
  color: rgba(241,245,249,0.45) !important;
}

/* Sidebar buttons */
section[data-testid="stSidebar"] div.stButton > button {
  background: rgba(255,255,255,0.06) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  color: rgba(241,245,249,0.92) !important;
  box-shadow: none !important;
}

section[data-testid="stSidebar"] div.stButton > button:hover {
  border-color: rgba(255,56,92,0.50) !important;
  background: rgba(255,255,255,0.10) !important;
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

/* Selectbox — dark theme */
div[data-baseweb="select"] * {
  color: rgba(241,245,249,0.92) !important;
  background-color: transparent !important;
}

div[data-baseweb="select"] input {
  color: rgba(241,245,249,0.92) !important;
}

div[data-baseweb="select"] input::placeholder {
  color: rgba(241,245,249,0.40) !important;
}

/* Dropdown menu items */
ul[role="listbox"] {
  background: #2a2a2a !important;
}

ul[role="listbox"] li,
ul[role="listbox"] span {
  color: rgba(241,245,249,0.92) !important;
}

.stSelectbox > div > div {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
}

.stSelectbox > div > div:hover {
  border-color: rgba(255,56,92,0.50);
}

.stSelectbox > div > div:focus-within {
  border-color: rgba(255,56,92,0.75);
  box-shadow: 0 0 0 3px rgba(255,56,92,0.14);
}

/* Buttons */
div.stButton > button {
  border-radius: 12px !important;
  padding: 0.55rem 1.05rem !important;
  font-weight: 750 !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  background: rgba(255,255,255,0.08) !important;
  color: rgba(241,245,249,0.92) !important;
  box-shadow: none;
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease;
  line-height: 1.1;
}

div.stButton > button:hover {
  transform: translateY(-1px);
  background: rgba(255,255,255,0.12) !important;
  border-color: rgba(255,255,255,0.20) !important;
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
  box-shadow: 0 14px 28px rgba(255,56,92,0.30) !important;
  padding: 0.75rem 1.5rem !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  border-radius: 14px !important;
}

div.stButton > button[kind="primary"]:hover {
  box-shadow: 0 20px 40px rgba(255,56,92,0.40) !important;
  transform: translateY(-2px);
  filter: brightness(1.04);
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

/* Landing page */
.landing-hero {
  max-width: 780px;
  margin: 60px auto 0 auto;
  padding: 0 24px 80px 24px;
  text-align: center;
}

.landing-eyebrow {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(255,56,92,0.12);
  border: 1px solid rgba(255,56,92,0.25);
  border-radius: 999px;
  padding: 5px 14px;
  margin-bottom: 28px;
}

.landing-headline {
  font-size: clamp(42px, 7vw, 72px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: #f1f5f9;
  margin: 0 0 24px 0;
}

.landing-headline em {
  font-style: normal;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.landing-desc {
  font-size: 18px;
  line-height: 1.65;
  color: rgba(241,245,249,0.60);
  max-width: 560px;
  margin: 0 auto 52px auto;
}

.landing-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 52px;
  text-align: left;
}

@media (max-width: 700px) {
  .landing-features { grid-template-columns: 1fr; }
}

.landing-feat {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feat-icon {
  font-size: 24px;
}

h4.feat-title {
  font-size: 16px !important;
  font-weight: 800 !important;
  color: #f1f5f9 !important;
  margin: 0 0 6px 0 !important;
  letter-spacing: -0.02em;
}

p.feat-body {
  font-size: 13px !important;
  line-height: 1.6 !important;
  color: rgba(241,245,249,0.45) !important;
  margin: 0 !important;
}

.landing-cta-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.landing-cta-sub {
  font-size: 13px;
  color: rgba(241,245,249,0.38);
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  padding-top: 6px;
}

@media (max-width: 1200px) { .reco-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px)  { .reco-grid { grid-template-columns: 1fr; } }

/* Individual tile */
.pin-card {
  display: flex;
  flex-direction: column;
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
  padding: 14px 16px 14px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.pin-actions {
  margin-top: auto !important;
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
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(15,23,42,0.07);
}

.pin-save {
  border: 1.5px solid rgba(15,23,42,0.12);
  border-radius: 999px;
  padding: 7px 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(15,23,42,0.35);
  background: transparent;
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease, transform 140ms ease;
}

.pin-save:hover {
  color: var(--accent);
  border-color: var(--accent);
  transform: scale(1.1);
}

.pin-sub {
  font-size: 12px;
  color: rgba(15,23,42,0.48);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.pin-maps-link {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  margin-left: auto;
  white-space: nowrap;
  transition: opacity 140ms ease;
}

.pin-maps-link:hover {
  opacity: 0.75;
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
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1506089676908-3592f7389d4d?auto=format&fit=crop&w=400&q=65",
    "https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?auto=format&fit=crop&w=400&q=65",
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
    """Return a static-server URL for an image file if it exists; else empty string.

    Accepts a repo-relative path like "assets/foo.jpg" OR an absolute path.
    If the exact file doesn't exist, tries common extension fallbacks.
    Images are served via Streamlit's static file server (/app/static/) instead
    of base64-encoding them — base64 embeds the full image in the HTML and
    crashes the browser tab when multiple cards are loaded.
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

        # Return a static URL — requires [server] enableStaticServing = true
        # in .streamlit/config.toml, and a `static/` folder (symlink to assets/).
        return f"/app/static/{p.name}"
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

def _restaurant_photo_url(name: str, seed: int, cuisine: str = "") -> str:
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

    # 2) As a general fallback, build a slug from the restaurant name
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in str(name)).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    uri = _asset_uri_by_slug(slug)
    if uri:
        return uri

    return _banner_photo_url(seed, cuisine=cuisine)


CUISINE_BANNERS = {
    "Ramen":           "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=400&q=65",
    "Japanese":        "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=400&q=65",
    "Pizza":           "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=65",
    "Italian":         "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=65",
    "Chinese":         "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=65",
    "Korean":          "https://images.unsplash.com/photo-1614563637806-1d0e645e0940?auto=format&fit=crop&w=400&q=65",
    "Mexican":         "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=65",
    "Indian":          "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=400&q=65",
    "Mediterranean":   "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=65",
    "Middle Eastern":  "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?auto=format&fit=crop&w=400&q=65",
    "Thai":            "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=400&q=65",
    "American":        "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=400&q=65",
    "Deli":            "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=400&q=65",
    "Seafood":         "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&q=65",
    "French":          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=65",
    "Halal":           "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?auto=format&fit=crop&w=400&q=65",
    "Restaurant":      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=400&q=65",
}


def _banner_photo_url(seed: int, cuisine: str = "") -> str:
    """Return a cuisine-specific banner if available, else a generic food banner."""
    if cuisine and cuisine in CUISINE_BANNERS:
        return CUISINE_BANNERS[cuisine]
    if not FOOD_BANNERS:
        return ""
    return FOOD_BANNERS[seed % len(FOOD_BANNERS)]

 # =========================
# Landing Page
# =========================
if st.session_state.page == "landing":
    import streamlit.components.v1 as components
    components.html("""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: transparent;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: #f1f5f9;
  }
  .wrap {
    max-width: 860px;
    margin: 20px auto 0 auto;
    padding: 0 24px;
    text-align: center;
  }
  .eyebrow {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #ff385c;
    background: rgba(255,56,92,0.12);
    border: 1px solid rgba(255,56,92,0.28);
    border-radius: 999px;
    padding: 5px 16px;
    margin-bottom: 28px;
  }
  h1 {
    font-size: clamp(44px, 7vw, 68px);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.05;
    color: #f1f5f9;
    margin: 0 0 22px 0;
  }
  .accent {
    background: linear-gradient(135deg, #ff385c 0%, #fb7185 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .desc {
    font-size: 17px;
    line-height: 1.7;
    color: rgba(241,245,249,0.52);
    max-width: 520px;
    margin: 0 auto 44px auto;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    text-align: left;
  }
  .card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 18px;
    padding: 22px 18px;
  }
  .icon { font-size: 24px; margin-bottom: 12px; }
  .card-title {
    font-size: 15px;
    font-weight: 800;
    color: #f1f5f9;
    margin-bottom: 8px;
    letter-spacing: -0.02em;
  }
  .card-body {
    font-size: 13px;
    line-height: 1.6;
    color: rgba(241,245,249,0.42);
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">🗽 New York City</div>
  <h1>Eat like a <span class="accent">local</span>.<br>Not a tourist.</h1>
  <p class="desc">Google Maps treats a first-time visitor’s review the same as a New Yorker who’s eaten there a dozen times. We don’t. Our algorithm surfaces the spots locals actually love — and filters out the tourist hype.</p>
  <div class="grid">
    <div class="card">
      <div class="icon">📊</div>
      <div class="card-title">Local signal scoring</div>
      <div class="card-body">Reviews from frequent NYC diners are weighted higher than one-time visitors passing through.</div>
    </div>
    <div class="card">
      <div class="icon">🚫</div>
      <div class="card-title">Tourist trap detection</div>
      <div class="card-body">Places with inflated tourist ratings get penalized. High hype, low local love = ranked lower.</div>
    </div>
    <div class="card">
      <div class="icon">📍</div>
      <div class="card-title">Neighborhood discovery</div>
      <div class="card-body">Filter by area to find what locals in Flushing, Astoria, or the Bronx are actually eating.</div>
    </div>
  </div>
</div>
</body>
</html>
""", height=660, scrolling=False)

    st.session_state.city = "New York City"

    col = st.columns([1, 2, 1])[1]
    with col:
        go = st.button("See recommendations →", type="primary", use_container_width=True)

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
    cuisines = ["All"] + sorted(df["cuisine"].dropna().unique().tolist())
    cuisine = st.selectbox("Cuisine", cuisines)

    st.markdown("<div style='height:10px'></div>", unsafe_allow_html=True)

    if st.button("Change city"):
        st.session_state.page = "landing"
        st.rerun()

# Neighborhood pills above the grid
neighborhoods = sorted(df["neighborhood"].dropna().unique().tolist())
neighborhood = st.pills("Neighborhood", neighborhoods, selection_mode="single", default=None)

filtered = df.copy()

if neighborhood:
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
    "total_score",
    "url",
]].rename(columns={
    "name": "Name",
    "neighborhood": "Neighborhood",
    "cuisine": "Cuisine",
    "num_reviews": "Reviews",
    "total_score": "Rating",
    "url": "MapsURL",
})

# st.dataframe(user_view, use_container_width=True, hide_index=True)
st.markdown(f"### {st.session_state.city} Recommendations")

st.caption("Curated picks designed to avoid tourist traps. Showing the strongest options first.")

# Pagination — reset to page 0 when filters change
PAGE_SIZE = 20
_filter_key = f"{neighborhood}|{cuisine}"
if st.session_state.get("_filter_key") != _filter_key:
    st.session_state._filter_key = _filter_key
    st.session_state.card_page = 0
if "card_page" not in st.session_state:
    st.session_state.card_page = 0

total_pages = max(1, math.ceil(len(user_view) / PAGE_SIZE))
start = st.session_state.card_page * PAGE_SIZE
page_view = user_view.iloc[start : start + PAGE_SIZE]

cards_html = []
for _, row in page_view.iterrows():
    _k = _norm_name(row["Name"])
    popular_dish = POPULAR_DISHES.get(_k) or POPULAR_DISHES.get(_k.replace(" ", ""))
    photo_url = _restaurant_photo_url(name=row["Name"], seed=int(row["Rank"]), cuisine=row["Cuisine"])
    cards_html.append(restaurant_card(
        rank=int(row["Rank"]),
        name=row["Name"],
        neighborhood=row["Neighborhood"],
        cuisine=row["Cuisine"],
        reviews=int(row["Reviews"]),
        popular_dish=popular_dish,
        photo_url=photo_url,
        rating=row.get("Rating"),
        maps_url=row.get("MapsURL"),
    ))

st.markdown(
    "<div class='reco-grid'>" + "\n".join(cards_html) + "</div>",
    unsafe_allow_html=True,
)

# Pagination controls
if total_pages > 1:
    col1, col2, col3 = st.columns([1, 2, 1])
    with col1:
        if st.session_state.card_page > 0:
            if st.button("← Prev"):
                st.session_state.card_page -= 1
                st.rerun()
    with col2:
        st.caption(f"Page {st.session_state.card_page + 1} of {total_pages}")
    with col3:
        if st.session_state.card_page < total_pages - 1:
            if st.button("Next →"):
                st.session_state.card_page += 1
                st.rerun()
